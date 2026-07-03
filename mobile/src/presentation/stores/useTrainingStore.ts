import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TrainingExercise } from '../../domain/models/TrainingExercise';
import { GymSession } from '../../domain/models/GymSession';
import { TrainingRepository } from '../../data/repositories/TrainingRepository';
import { EXERCISE_CATALOG, onExerciseCompleted } from '../../data/services/TrainingProgressionService';
import {
  NutritionResult,
  computeLocalNutrition,
} from '../../data/services/NutritionService';
import { ApiDataSource } from '../../data/datasources/ApiDataSource';
import { getMeta, setMeta, deleteMeta } from '../../data/services/AppMeta';
import { usePlayerStore } from './usePlayerStore';
import { NotificationService } from '../../core/NotificationService';
import { isOnline } from '../../core/network';
import { todayDateStr } from '../../core/dateUtils';

const trainingRepo = new TrainingRepository();

const META_SETUP_DONE = 'training_setup_done';
const META_WEIGHT_KG = 'player_weight_kg';
const META_HEIGHT_CM = 'player_height_cm';
const META_NUTRITION_LAST = 'nutrition_last_result';

// Gym-hours logging (F4). Passive attendance XP, deliberately separate from the
// bodyweight exercise progression — capped so it can't be farmed.
const XP_PER_GYM_HOUR = 30;
export const DAILY_GYM_HOURS_CAP = 4;

interface TrainingState {
  exercises: TrainingExercise[];
  weightKg: number | null;
  heightCm: number | null;
  todayGymHours: number;
  lastNutrition: NutritionResult | null;
  calculatingNutrition: boolean;
  setupDone: boolean;
  loading: boolean;
  load: () => Promise<void>;
  /** Enrol the player: persist their assessed baselines + body weight + height. */
  completeSetup: (
    entries: { name: string; baseline: number }[],
    weightKg: number,
    heightCm: number,
  ) => Promise<void>;
  /** Complete today's set for an exercise. Returns the XP gained and whether it caused a level-up. */
  completeExercise: (id: string) => Promise<{ leveledUp: boolean; xp: number }>;
  /** Log gym-attendance hours for today (capped at 4h/day). */
  logGymHours: (hours: number) => Promise<{ xp: number; leveledUp: boolean; grantedHours: number }>;
  /** Persist the player's body metrics (weight + height) to meta + state. */
  updateBodyMetrics: (weightKg: number, heightCm: number) => Promise<void>;
  /** Compute today's protein directive (AI when online, local formula otherwise). */
  calculateProtein: (weightKg: number, heightCm: number) => Promise<NutritionResult | null>;
  /** Wipe all training data and setup flags (SCRAM). */
  resetTraining: () => Promise<void>;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  exercises: [],
  weightKg: null,
  heightCm: null,
  todayGymHours: 0,
  lastNutrition: null,
  calculatingNutrition: false,
  setupDone: false,
  loading: false,

  load: async () => {
    set({ loading: true });
    const setupDone = (await getMeta(META_SETUP_DONE)) === '1';
    const w = await getMeta(META_WEIGHT_KG);
    const weightKg = w ? Number(w) : null;
    const h = await getMeta(META_HEIGHT_CM);
    const heightCm = h ? Number(h) : null;

    let lastNutrition: NutritionResult | null = null;
    const rawNutrition = await getMeta(META_NUTRITION_LAST);
    if (rawNutrition) {
      try {
        lastNutrition = JSON.parse(rawNutrition) as NutritionResult;
      } catch {
        lastNutrition = null;
      }
    }

    const gym = await trainingRepo.getGymSession(todayDateStr());
    const todayGymHours = gym?.hours ?? 0;

    const exercises = await trainingRepo.getExercises();
    set({
      setupDone,
      weightKg,
      heightCm,
      lastNutrition,
      todayGymHours,
      exercises,
      loading: false,
    });
  },

  completeSetup: async (entries, weightKg, heightCm) => {
    const now = new Date().toISOString();
    const rows: TrainingExercise[] = EXERCISE_CATALOG.map((entry) => {
      const provided = entries.find((e) => e.name === entry.name);
      const baseline =
        provided && Number.isInteger(provided.baseline) && provided.baseline > 0
          ? provided.baseline
          : entry.defaultBaseline;
      return {
        id: uuidv4(),
        name: entry.name,
        muscleGroup: entry.muscleGroup,
        mode: entry.mode,
        baseline,
        currentTarget: baseline,
        maxTarget: entry.maxTarget,
        stepIndex: 0,
        daysTrained: 0,
        lastCompletedDate: null,
        createdAt: now,
      };
    });

    await trainingRepo.saveExercises(rows);
    await setMeta(META_SETUP_DONE, '1');
    await setMeta(META_WEIGHT_KG, String(weightKg));
    await setMeta(META_HEIGHT_CM, String(heightCm));
    set({ exercises: rows, weightKg, heightCm, setupDone: true });
  },

  completeExercise: async (id) => {
    const today = todayDateStr();
    const ex = get().exercises.find((e) => e.id === id);
    if (!ex || ex.lastCompletedDate === today) return { leveledUp: false, xp: 0 };

    // Persist the completion (daysTrained++, lastCompletedDate=today, target unchanged).
    const updated = await trainingRepo.completeExercise(id, today);

    // XP is based on the target they just completed (pre-progression).
    const xp = updated.mode === 'reps' ? updated.currentTarget : Math.round(updated.currentTarget / 2);

    // Progression check — may raise the target and fire [Training Intensified.] internally.
    const prog = onExerciseCompleted(updated);
    let finalRow = updated;
    if (prog.increased) {
      finalRow = await trainingRepo.applyProgression(id, prog.newTarget, prog.newStepIndex);
    }

    set((state) => ({
      exercises: state.exercises.map((e) => (e.id === id ? finalRow : e)),
    }));

    // Grant per-exercise XP.
    let leveledUp = usePlayerStore.getState().addExperience(xp);

    // All-done bonus: if every exercise is now done today, add +50 XP and notify.
    // (Gym hours are intentionally excluded — they are not exercises.)
    const all = get().exercises;
    const allDone = all.length > 0 && all.every((e) => e.lastCompletedDate === today);
    if (allDone) {
      if (usePlayerStore.getState().addExperience(50)) leveledUp = true;
      NotificationService.send(
        '[Daily Training Complete.]',
        'Your body grows stronger. The Shadow Army acknowledges you.',
      ).catch(() => {});
    }

    return { leveledUp, xp };
  },

  logGymHours: async (hours) => {
    const today = todayDateStr();
    const already = get().todayGymHours;
    const remaining = DAILY_GYM_HOURS_CAP - already;
    const grantedHours = Math.max(0, Math.min(hours, remaining));

    if (grantedHours <= 0) return { xp: 0, leveledUp: false, grantedHours: 0 };

    const xp = Math.round(XP_PER_GYM_HOUR * grantedHours);

    // Accumulate onto today's row (hours + xp), leaving other metrics untouched.
    const existing = await trainingRepo.getGymSession(today);
    const session: GymSession = {
      date: today,
      hours: (existing?.hours ?? 0) + grantedHours,
      xpAwarded: (existing?.xpAwarded ?? 0) + xp,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    await trainingRepo.upsertGymSession(session);

    const leveledUp = usePlayerStore.getState().addExperience(xp);
    set({ todayGymHours: session.hours });

    NotificationService.send(
      '[Gym Session Logged.]',
      `+${xp} XP for ${grantedHours}h of iron discipline.`,
    ).catch(() => {});

    return { xp, leveledUp, grantedHours };
  },

  updateBodyMetrics: async (weightKg, heightCm) => {
    await setMeta(META_WEIGHT_KG, String(weightKg));
    await setMeta(META_HEIGHT_CM, String(heightCm));
    set({ weightKg, heightCm });
  },

  calculateProtein: async (weightKg, heightCm) => {
    set({ calculatingNutrition: true });
    try {
      await get().updateBodyMetrics(weightKg, heightCm);

      const today = todayDateStr();
      // Gym hours are deliberately NOT exercises and are excluded from this payload.
      const exercises = get().exercises;
      const payload = exercises.map((e) => ({
        name: e.name,
        mode: e.mode,
        current_target: e.currentTarget,
        days_trained: e.daysTrained,
        completed_today: e.lastCompletedDate === today,
      }));
      const doneToday = payload.filter((p) => p.completed_today).length;

      let result: NutritionResult | null = null;

      if (await isOnline()) {
        try {
          const modelPreference = usePlayerStore.getState().player?.modelPreference;
          const res = await ApiDataSource.getProteinAdvice({
            height_cm: heightCm,
            weight_kg: weightKg,
            exercises: payload,
            model_preference: modelPreference,
          });
          result = {
            dailyProteinG: res.daily_protein_g,
            rangeMinG: res.range_min_g,
            rangeMaxG: res.range_max_g,
            bmi: res.bmi,
            bmiCategory: res.bmi_category,
            rationale: res.rationale,
            tip: res.tip,
            aiGenerated: res.ai_generated,
            computedAt: new Date().toISOString(),
          };
        } catch {
          result = computeLocalNutrition(weightKg, heightCm, doneToday, exercises.length);
        }
      } else {
        result = computeLocalNutrition(weightKg, heightCm, doneToday, exercises.length);
      }

      if (result) {
        await setMeta(META_NUTRITION_LAST, JSON.stringify(result));
        set({ lastNutrition: result });
      }

      return result;
    } finally {
      set({ calculatingNutrition: false });
    }
  },

  resetTraining: async () => {
    await trainingRepo.clearAll();
    await deleteMeta(META_SETUP_DONE);
    await deleteMeta(META_WEIGHT_KG);
    await deleteMeta(META_HEIGHT_CM);
    await deleteMeta(META_NUTRITION_LAST);
    set({
      exercises: [],
      weightKg: null,
      heightCm: null,
      todayGymHours: 0,
      lastNutrition: null,
      setupDone: false,
    });
  },
}));
