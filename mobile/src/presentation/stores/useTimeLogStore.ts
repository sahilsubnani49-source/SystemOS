import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TimeLog, DescriptionSource } from '../../domain/models/TimeLog';
import { TimeLogRepository } from '../../data/repositories/TimeLogRepository';
import { GoalRepository } from '../../data/repositories/GoalRepository';
import { QuestRepository } from '../../data/repositories/QuestRepository';
import { deriveCampaignTask, MAX_DESCRIPTION_CHARS } from '../../data/services/CampaignTaskService';
import { ApiDataSource } from '../../data/datasources/ApiDataSource';
import { usePlayerStore } from './usePlayerStore';
import { NotificationService } from '../../core/NotificationService';
import { isOnline } from '../../core/network';
import { todayDateStr } from '../../core/dateUtils';

const repo = new TimeLogRepository();
const goalRepo = new GoalRepository();
const questRepo = new QuestRepository();

// Focus-hour logging (the Army tab's timer). Unlike gym hours this is MEASURED, not
// self-reported — so it prorates per second and is defended by clamps rather than by
// a picker's granularity.
const XP_PER_FOCUS_HOUR = 30;
export const DAILY_FOCUS_HOURS_CAP = 8;
/** Below this a session is discarded outright — no row, no XP. Stops tap-farming. */
export const MIN_LOGGABLE_SECONDS = 300;
/** Ceiling for one session. Catches forgotten timers and forward clock jumps. */
export const MAX_SESSION_SECONDS = DAILY_FOCUS_HOURS_CAP * 3600;

export interface FocusCredit {
  /** Elapsed after both clamps — what XP is actually paid on. */
  creditedSeconds: number;
  xp: number;
  capped: boolean;
}

/**
 * The clamp cascade, in one place so the stop sheet's projection and the XP actually
 * awarded can never disagree: a session is clipped first to its own ceiling, then to
 * whatever is left of the day's budget.
 */
export function computeFocusCredit(rawSeconds: number, bankedSeconds: number): FocusCredit {
  const sessionCapped = Math.min(rawSeconds, MAX_SESSION_SECONDS);
  const dayRemaining = Math.max(0, DAILY_FOCUS_HOURS_CAP * 3600 - bankedSeconds);
  const creditedSeconds = Math.min(sessionCapped, dayRemaining);
  return {
    creditedSeconds,
    xp: Math.round((XP_PER_FOCUS_HOUR * creditedSeconds) / 3600),
    capped: creditedSeconds < rawSeconds,
  };
}

/** "3h 12m" / "47m" — friendlier than h:mm:ss for notification copy. */
function hoursLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export interface StartTimerInput {
  /** Required when goalId is null; may be empty when a campaign is tagged. */
  description: string;
  goalId: string | null;
}

export interface StopTimerResult {
  xp: number;
  leveledUp: boolean;
  /** Raw measured elapsed. */
  seconds: number;
  /** What survived the clamps and earned XP. */
  creditedSeconds: number;
  capped: boolean;
  /** True when the session was under the floor and thrown away. */
  discarded: boolean;
}

interface TimeLogState {
  running: TimeLog | null;
  todayLogs: TimeLog[];
  todaySeconds: number;
  todayXp: number;
  starting: boolean;
  stopping: boolean;
  deriving: boolean;
  error: string | null;

  load: () => Promise<void>;
  /** Auto-close a resumed timer that outran MAX_SESSION_SECONDS while the app slept. */
  reconcileRunning: () => Promise<void>;
  startTimer: (input: StartTimerInput) => Promise<void>;
  stopTimer: (opts?: { description?: string; recovered?: boolean }) => Promise<StopTimerResult>;
  cancelTimer: () => Promise<void>;
  /** Sever campaign links after a campaign is abandoned or wiped. */
  detachGoal: (goalId: string) => Promise<void>;
  clearError: () => void;
  resetTimeLogs: () => Promise<void>;
}

const NO_OP_STOP: StopTimerResult = {
  xp: 0,
  leveledUp: false,
  seconds: 0,
  creditedSeconds: 0,
  capped: false,
  discarded: true,
};

export const useTimeLogStore = create<TimeLogState>((set, get) => ({
  running: null,
  todayLogs: [],
  todaySeconds: 0,
  todayXp: 0,
  starting: false,
  stopping: false,
  deriving: false,
  error: null,

  load: async () => {
    const [running, todayLogs] = await Promise.all([
      repo.getRunningLog(),
      repo.getLogsForDate(todayDateStr()),
    ]);
    set({
      running,
      todayLogs,
      todaySeconds: todayLogs.reduce((s, l) => s + l.creditedSeconds, 0),
      todayXp: todayLogs.reduce((s, l) => s + l.xpAwarded, 0),
    });
    await get().reconcileRunning();
  },

  reconcileRunning: async () => {
    const running = get().running;
    if (!running) return;
    const elapsed = Math.max(
      0,
      Math.floor((Date.now() - new Date(running.startedAt).getTime()) / 1000),
    );
    if (elapsed <= MAX_SESSION_SECONDS) return;

    // The Hunter never stopped it. Credit at the ceiling rather than discarding
    // work they actually did, and tell them what happened.
    await get().stopTimer({ recovered: true });
    NotificationService.send(
      '[Session Recovered.]',
      'A timer ran while the System slept. Credited at the ceiling.',
    ).catch(() => {});
  },

  startTimer: async (input) => {
    if (get().starting || get().running) return;
    set({ starting: true, error: null });

    try {
      const typed = input.description.trim();
      let description = typed;
      let questId: string | null = null;
      let source: DescriptionSource = 'manual';

      if (input.goalId) {
        set({ deriving: true });
        const derived = await deriveCampaignTask(input.goalId, todayDateStr());
        set({ deriving: false });
        if (derived) {
          questId = derived.questId;
          // The Hunter's own words win; the derived line only fills a blank.
          description = typed || derived.description;
          source = typed ? 'manual' : 'campaign';
        }
      }

      if (!description) {
        set({ starting: false, error: 'Describe the task, Hunter.' });
        return;
      }

      const now = new Date().toISOString();
      const log: TimeLog = {
        id: uuidv4(),
        date: todayDateStr(),
        description: description.slice(0, MAX_DESCRIPTION_CHARS),
        descriptionSource: source,
        goalId: input.goalId,
        questId,
        startedAt: now,
        endedAt: null,
        seconds: 0,
        creditedSeconds: 0,
        xpAwarded: 0,
        createdAt: now,
      };

      await repo.startLog(log);
      set({ running: log, starting: false });

      const goalTitle = input.goalId ? (await goalRepo.getGoal(input.goalId))?.title : null;
      NotificationService.send(
        '[Timer Engaged.]',
        goalTitle ? `Logging against ${goalTitle}.` : 'The System is counting. Do the work.',
      ).catch(() => {});

      // The Architect narrates AFTER the clock is already running — a round-trip
      // between "tap START" and "the timer runs" is the worst latency in the app.
      if (source === 'campaign') void upgradeDescriptionWithAi(log, set, get);
    } catch (e) {
      set({
        starting: false,
        deriving: false,
        error: e instanceof Error ? e.message : 'Could not start the timer.',
      });
    }
  },

  stopTimer: async (opts) => {
    const running = get().running;
    if (!running || get().stopping) return NO_OP_STOP;
    set({ stopping: true });

    try {
      const endedAt = new Date().toISOString();
      const raw = Math.max(
        0,
        Math.floor((new Date(endedAt).getTime() - new Date(running.startedAt).getTime()) / 1000),
      );

      if (raw < MIN_LOGGABLE_SECONDS && !opts?.recovered) {
        await repo.deleteLog(running.id);
        set({ running: null, stopping: false });
        return { ...NO_OP_STOP, seconds: raw };
      }

      // Charged against the log's OWN date, not today's — a session that began
      // before midnight belongs wholly to the day it started.
      const banked = await repo.getCreditedSecondsForDate(running.date);
      const { creditedSeconds, xp, capped } = computeFocusCredit(raw, banked);

      const edited = opts?.description?.trim();
      if (edited && edited !== running.description) {
        await repo.updateDescription(running.id, edited.slice(0, MAX_DESCRIPTION_CHARS), 'manual');
      }

      // SQLite is committed before XP is granted, so a crash can never award XP
      // for a session that was lost.
      await repo.finishLog(running.id, endedAt, raw, creditedSeconds, xp);
      const leveledUp = xp > 0 ? usePlayerStore.getState().addExperience(xp) : false;

      const todayLogs = await repo.getLogsForDate(todayDateStr());
      set({
        running: null,
        stopping: false,
        todayLogs,
        todaySeconds: todayLogs.reduce((s, l) => s + l.creditedSeconds, 0),
        todayXp: todayLogs.reduce((s, l) => s + l.xpAwarded, 0),
      });

      if (xp > 0) {
        NotificationService.send(
          '[Task Logged.]',
          `+${xp} XP for ${hoursLabel(creditedSeconds)} of focused work.`,
        ).catch(() => {});
      }
      if (capped) {
        NotificationService.send(
          '[Focus Ceiling Reached.]',
          `Credited ${hoursLabel(creditedSeconds)} of ${DAILY_FOCUS_HOURS_CAP}h. Rest is also training.`,
        ).catch(() => {});
      }

      return { xp, leveledUp, seconds: raw, creditedSeconds, capped, discarded: false };
    } catch (e) {
      set({
        stopping: false,
        error: e instanceof Error ? e.message : 'Could not log the session.',
      });
      throw e;
    }
  },

  cancelTimer: async () => {
    const running = get().running;
    if (!running) return;
    await repo.deleteLog(running.id);
    set({ running: null });
  },

  detachGoal: async (goalId) => {
    await repo.detachGoal(goalId);
    const running = get().running;
    // Patch the in-flight log in memory too, or stopTimer would act on a stale goalId.
    set({
      running:
        running && running.goalId === goalId
          ? { ...running, goalId: null, questId: null }
          : running,
      todayLogs: get().todayLogs.map((l) =>
        l.goalId === goalId ? { ...l, goalId: null, questId: null } : l,
      ),
    });
  },

  clearError: () => set({ error: null }),

  resetTimeLogs: async () => {
    await repo.clearAll();
    set({ running: null, todayLogs: [], todaySeconds: 0, todayXp: 0, error: null });
  },
}));

/**
 * Silently upgrade a running log's description with the Architect's narration.
 * Best-effort by design: offline, a backend failure, or the Hunter having already
 * stopped the timer all just leave the on-device line in place.
 */
async function upgradeDescriptionWithAi(
  log: TimeLog,
  set: (partial: Partial<TimeLogState>) => void,
  get: () => TimeLogState,
): Promise<void> {
  try {
    if (!(await isOnline())) return;

    const goal = log.goalId ? await goalRepo.getGoal(log.goalId) : null;
    if (!goal) return;

    const quests = await questRepo.getDailyQuestsForGoal(goal.id, log.date);
    const res = await ApiDataSource.describeTask({
      goal_title: goal.title,
      context: goal.context,
      plan_excerpt: goal.plan.slice(0, 600),
      quests: quests.map((q) => ({
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        is_completed: q.isCompleted,
        is_accepted: q.acceptedAt !== null,
      })),
      model_preference: usePlayerStore.getState().player?.modelPreference,
    });

    const text = res.description?.trim();
    if (!text || !res.ai_generated) return;

    // The Hunter may have stopped or edited it while we were away — only upgrade a
    // log that is still running and still carries the description we generated from.
    const current = get().running;
    if (!current || current.id !== log.id || current.descriptionSource !== 'campaign') return;

    const description = text.slice(0, MAX_DESCRIPTION_CHARS);
    await repo.updateDescription(log.id, description, 'ai');
    set({ running: { ...current, description, descriptionSource: 'ai' } });
  } catch {
    // Keep the local line — this path is decoration, never a failure the Hunter sees.
  }
}
