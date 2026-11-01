import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  TaskCategory,
  TaskCategorySource,
  TaskCategorySummary,
  TaskSession,
} from '../../domain/models/TaskLog';
import { TaskLogRepository } from '../../data/repositories/TaskLogRepository';
import { TrainingRepository } from '../../data/repositories/TrainingRepository';
import { TimeLogRepository } from '../../data/repositories/TimeLogRepository';
import { usePlayerStore } from './usePlayerStore';
import { NotificationService } from '../../core/NotificationService';
import { addDays, todayDateStr } from '../../core/dateUtils';
import { formatMinutesLabel } from '../hooks/useElapsed';

const repo = new TaskLogRepository();
// The Hunter Log is a VIEW over three stores of time. Gym hours and focus sessions
// already awarded their own XP when they were recorded, so they are merged here on
// read only — never copied into task_sessions, which would pay XP for them twice.
const trainingRepo = new TrainingRepository();
const timeLogRepo = new TimeLogRepository();

// Hunter Log sessions are SELF-REPORTED, like gym hours — so they earn the same
// passive rate and are defended by caps rather than by a clock.
export const XP_PER_TASK_HOUR = 30;
/** Total self-reported hours that can earn XP in one day, across all categories. */
export const DAILY_TASK_HOURS_CAP = 8;
/** Ceiling for a single logged session. Catches typos like "120 hours". */
export const MAX_SESSION_MINUTES = 12 * 60;

/** Seeded on first launch only; the Hunter can add more from the Dashboard. */
const DEFAULT_CATEGORIES: { name: string; icon: string; source: TaskCategorySource }[] = [
  // 'gym' links this bucket to the Army tab's gym_sessions hours.
  { name: 'Gym', icon: '🏋️', source: 'gym' },
  { name: 'Coding', icon: '💻', source: null },
  { name: 'Studying', icon: '📚', source: null },
];

/** Stable id for the synthetic Focus row — it has no task_categories record. */
export const FOCUS_CATEGORY_ID = '__focus__';

/** How many sessions the detail screen shows. */
export const RECENT_SESSIONS_LIMIT = 20;

export interface TaskCredit {
  /** Minutes that actually earn XP after the clamps. */
  creditedMinutes: number;
  xp: number;
  /** True when any part of the session was clipped by a cap. */
  capped: boolean;
}

/**
 * Decide how much of a self-reported session earns XP.
 *
 * @param minutes            what the Hunter typed (already validated > 0)
 * @param bankedMinutesToday minutes already logged today across every category
 */
export function computeTaskCredit(minutes: number, bankedMinutesToday: number): TaskCredit {
  // TODO(human)
  // Placeholder so the app runs: full credit, no caps. Replace with the real policy.
  return {
    creditedMinutes: minutes,
    xp: Math.round((XP_PER_TASK_HOUR * minutes) / 60),
    capped: false,
  };
}

/**
 * Consecutive days with at least one session, counting back from today. A streak
 * is still alive if the last session was yesterday (today isn't over yet).
 * `dates` must be distinct YYYY-MM-DD strings, newest first.
 */
export function computeStreak(dates: string[], today: string): number {
  if (dates.length === 0) return 0;
  const yesterday = addDays(today, -1);
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i] !== addDays(dates[i - 1], -1)) break;
    streak += 1;
  }
  return streak;
}

export interface LogSessionInput {
  categoryId: string;
  minutes: number;
  note: string;
}

/**
 * A study session reported by an embedded game (Kotodama). Declared structurally
 * here so this store never imports the game package: anything with these fields
 * can be bridged into the Hunter Log.
 */
export interface ExternalStudySession {
  activeMinutes: number;
  promptsAnswered: number;
  correct: number;
}

/** Hunter Log bucket that game study time is filed under. */
export const JAPANESE_CATEGORY = { name: 'Japanese', icon: '🗾' } as const;

export interface LogSessionResult {
  xp: number;
  leveledUp: boolean;
  creditedMinutes: number;
  capped: boolean;
}

interface TaskLogState {
  categories: TaskCategorySummary[];
  /** Recent sessions per category, filled lazily by the detail screen. */
  sessionsByCategory: Record<string, TaskSession[]>;
  streakDays: number;
  todayMinutes: number;
  loading: boolean;
  logging: boolean;
  error: string | null;

  load: () => Promise<void>;
  loadSessions: (categoryId: string) => Promise<void>;
  addCategory: (name: string, icon: string) => Promise<void>;
  logSession: (input: LogSessionInput) => Promise<LogSessionResult>;
  /**
   * File a Kotodama session under the "Japanese" bucket (created on first use).
   * Goes through logSession, so XP is paid exactly once and the daily cap applies.
   * Returns null when there was nothing worth logging.
   */
  recordJapaneseSession: (session: ExternalStudySession) => Promise<LogSessionResult | null>;
  clearError: () => void;
  resetTaskLogs: () => Promise<void>;
}

async function refreshSummary(): Promise<
  Pick<TaskLogState, 'categories' | 'streakDays' | 'todayMinutes'>
> {
  const today = todayDateStr();
  const [stored, dates, todayMinutes, gymMinutes, focusMinutes] = await Promise.all([
    repo.getCategories(),
    // 400 distinct days covers any streak a Hunter could plausibly hold.
    repo.getSessionDates(400),
    repo.getMinutesForDate(today),
    trainingRepo.getTotalGymMinutes(),
    timeLogRepo.getTotalMinutes(),
  ]);

  // Fold Army-tab gym hours into whichever bucket is linked to them.
  const categories: TaskCategorySummary[] = stored.map((c) =>
    c.source === 'gym'
      ? { ...c, totalMinutes: c.totalMinutes + gymMinutes, sourceMinutes: gymMinutes }
      : c,
  );

  // Focus-timer time has no bucket of its own, so it gets a synthetic read-only row.
  // Hidden at zero so the grid stays clean for Hunters who never start a timer.
  if (focusMinutes > 0) {
    categories.push({
      id: FOCUS_CATEGORY_ID,
      name: 'Focus',
      icon: '⏱️',
      sortOrder: categories.length,
      source: 'focus',
      createdAt: '',
      totalMinutes: focusMinutes,
      sourceMinutes: focusMinutes,
      synthetic: true,
    });
  }

  return { categories, streakDays: computeStreak(dates, today), todayMinutes };
}

export const useTaskLogStore = create<TaskLogState>((set, get) => ({
  categories: [],
  sessionsByCategory: {},
  streakDays: 0,
  todayMinutes: 0,
  loading: false,
  logging: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const now = new Date().toISOString();
      await repo.seedDefaultCategories(
        DEFAULT_CATEGORIES.map((c, i) => ({
          id: uuidv4(),
          name: c.name,
          icon: c.icon,
          sortOrder: i,
          source: c.source,
          createdAt: now,
        })),
      );
      set({ ...(await refreshSummary()), loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Could not load the Hunter Log.',
      });
    }
  },

  loadSessions: async (categoryId) => {
    const sessions = await repo.getSessionsForCategory(categoryId, RECENT_SESSIONS_LIMIT);
    set({ sessionsByCategory: { ...get().sessionsByCategory, [categoryId]: sessions } });
  },

  addCategory: async (name, icon) => {
    const trimmed = name.trim();
    if (!trimmed) {
      set({ error: 'A task needs a name, Hunter.' });
      return;
    }
    const category: TaskCategory = {
      id: uuidv4(),
      name: trimmed.slice(0, 24),
      icon,
      // Count stored rows only — the synthetic Focus row would otherwise skew this.
      sortOrder: get().categories.filter((c) => !c.synthetic).length,
      // Hunter-created buckets are plain hand-entry; only seeded Gym links a source.
      source: null,
      createdAt: new Date().toISOString(),
    };
    await repo.addCategory(category);
    set({ ...(await refreshSummary()), error: null });
  },

  logSession: async ({ categoryId, minutes, note }) => {
    if (get().logging) {
      return { xp: 0, leveledUp: false, creditedMinutes: 0, capped: false };
    }
    // Synthetic rows have no task_categories record. With no foreign keys, a write
    // here would silently insert an orphan session that nothing ever reads back.
    if (categoryId === FOCUS_CATEGORY_ID) {
      set({ error: 'Focus time is logged by the timer in the Army tab.' });
      return { xp: 0, leveledUp: false, creditedMinutes: 0, capped: false };
    }
    set({ logging: true, error: null });

    try {
      const today = todayDateStr();
      const banked = await repo.getMinutesForDate(today);
      const { creditedMinutes, xp, capped } = computeTaskCredit(minutes, banked);

      const now = new Date().toISOString();
      const session: TaskSession = {
        id: uuidv4(),
        categoryId,
        date: today,
        // The honest number the Hunter typed is what history shows; only XP is clamped.
        minutes,
        note: note.trim().slice(0, 120),
        xpAwarded: xp,
        createdAt: now,
      };

      // SQLite first, XP second — a crash can never award XP for a lost session.
      await repo.addSession(session);
      const leveledUp = xp > 0 ? usePlayerStore.getState().addExperience(xp) : false;

      const summary = await refreshSummary();
      const sessions = await repo.getSessionsForCategory(categoryId, RECENT_SESSIONS_LIMIT);
      set({
        ...summary,
        sessionsByCategory: { ...get().sessionsByCategory, [categoryId]: sessions },
        logging: false,
      });

      const category = summary.categories.find((c) => c.id === categoryId);
      if (xp > 0) {
        NotificationService.send(
          '[Task Logged.]',
          `+${xp} XP for ${formatMinutesLabel(creditedMinutes)} of ${category?.name ?? 'work'}.`,
        ).catch(() => {});
      }
      if (capped) {
        NotificationService.send(
          '[Daily Ceiling Reached.]',
          `Credited ${formatMinutesLabel(creditedMinutes)} of ${DAILY_TASK_HOURS_CAP}h. Rest is also training.`,
        ).catch(() => {});
      }

      return { xp, leveledUp, creditedMinutes, capped };
    } catch (e) {
      set({
        logging: false,
        error: e instanceof Error ? e.message : 'Could not log the session.',
      });
      throw e;
    }
  },

  recordJapaneseSession: async (session) => {
    const minutes = Math.min(Math.round(session.activeMinutes), MAX_SESSION_MINUTES);
    if (minutes < 1) return null;
    if (get().categories.length === 0) await get().load();
    const find = () =>
      get().categories.find(
        (c) => !c.synthetic && c.name.toLowerCase() === JAPANESE_CATEGORY.name.toLowerCase(),
      );
    if (!find()) await get().addCategory(JAPANESE_CATEGORY.name, JAPANESE_CATEGORY.icon);
    const category = find();
    if (!category) return null;
    const accuracy = session.promptsAnswered
      ? Math.round((session.correct / session.promptsAnswered) * 100)
      : 0;
    return get().logSession({
      categoryId: category.id,
      minutes,
      note: `Kotodama: ${session.promptsAnswered} prompts, ${accuracy}% correct`,
    });
  },

  clearError: () => set({ error: null }),

  resetTaskLogs: async () => {
    await repo.clearAll();
    set({ categories: [], sessionsByCategory: {}, streakDays: 0, todayMinutes: 0, error: null });
    // Re-seed so the Dashboard is never an empty grid after SCRAM.
    await get().load();
  },
}));
