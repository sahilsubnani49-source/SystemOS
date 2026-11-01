import { getMeta, setMeta } from './AppMeta';
import { GoalRepository } from '../repositories/GoalRepository';
import { QuestRepository } from '../repositories/QuestRepository';
import { PlayerRepository } from '../repositories/PlayerRepository';
import { InventoryRepository } from '../repositories/InventoryRepository';
import { DungeonService } from './DungeonService';
import { RankService } from './RankService';
import { NotificationService } from '../../core/NotificationService';
import { addDays, daysBetween, todayDateStr } from '../../core/dateUtils';

const LAST_TIMELINE_DATE = 'last_timeline_date';
const DAYS_PER_KEY = 21;

/** app_meta key holding the date a penalty was enforced — consumed by the System notice on next open. */
export const PENALTY_NOTICE_KEY = 'penalty_notice_date';

/**
 * app_meta key holding the last date "[Daily Quest has arrived.]" was sent.
 * Shared with the background fetch task so the player is notified at most
 * once per day no matter which path (tick or background run) fires first.
 */
export const LAST_DAILY_NOTIFICATION_DATE = 'last_daily_notification_date';

const goalRepo = new GoalRepository();
const questRepo = new QuestRepository();
const playerRepo = new PlayerRepository();
const inventoryRepo = new InventoryRepository();

export interface TimelineTickResult {
  newDay: boolean;
  daysEvaluated: number;
  keysAwarded: number;
  penaltyApplied: boolean;
  /** Campaigns whose final day passed during this tick. */
  campaignsCompleted: number;
}

/**
 * Recompute and persist the player's Hunter Rank from current progress.
 * Safe to call any time; aggregates across all active goals + cleared dungeons.
 */
async function refreshRank(): Promise<void> {
  const player = await playerRepo.getPlayer();
  if (!player) return;
  // Finished campaigns still count — otherwise completing a campaign would drop the
  // completion rate to zero and DEMOTE the Hunter for succeeding.
  const goals = await goalRepo.getRankedGoals();
  const dungeons = await questRepo.getDungeons();
  const dungeonsCleared = dungeons.filter((d) => d.dungeonResult?.passed).length;

  const daysCompleted = goals.reduce((sum, g) => sum + g.daysCompleted, 0);
  const durationDays = goals.reduce((sum, g) => sum + g.durationDays, 0);

  const rank = RankService.computeRank({
    level: player.level,
    dungeonsCleared,
    daysCompleted,
    durationDays,
  });
  await playerRepo.setRank(rank);
}

export const DailyTimelineService = {
  /** Call right after a campaign is created so day-1 isn't evaluated prematurely. */
  async markStart(): Promise<void> {
    await setMeta(LAST_TIMELINE_DATE, todayDateStr());
  },

  /**
   * Advance the timeline. For each fully-elapsed day since the last check, decide —
   * PER active goal — whether that goal's quests for the day were all completed; every
   * DAYS_PER_KEY completed days for a goal awards a dungeon key and schedules a
   * mock-exam dungeon for that goal within the next 7 days. One global cursor advances
   * once for all goals. Recomputes Hunter Rank at the end.
   */
  async tick(): Promise<TimelineTickResult> {
    const today = todayDateStr();
    const goals = await goalRepo.getActiveGoals();

    // No active campaigns — just keep the cursor current.
    if (goals.length === 0) {
      await setMeta(LAST_TIMELINE_DATE, today);
      return {
        newDay: false,
        daysEvaluated: 0,
        keysAwarded: 0,
        penaltyApplied: false,
        campaignsCompleted: 0,
      };
    }

    const lastProcessed = await getMeta(LAST_TIMELINE_DATE);
    if (lastProcessed == null) {
      // First run — establish the cursor, evaluate nothing yet.
      await setMeta(LAST_TIMELINE_DATE, today);
      return {
        newDay: false,
        daysEvaluated: 0,
        keysAwarded: 0,
        penaltyApplied: false,
        campaignsCompleted: 0,
      };
    }
    if (lastProcessed === today) {
      return {
        newDay: false,
        daysEvaluated: 0,
        keysAwarded: 0,
        penaltyApplied: false,
        campaignsCompleted: 0,
      };
    }

    const player = await playerRepo.getPlayer();
    const elapsed = Math.max(0, daysBetween(lastProcessed, today));
    let keysAwarded = 0;
    let daysEvaluated = 0;
    let questsLeftIncomplete = false;

    // Evaluate each day in [lastProcessed, today) — the days that have fully ended.
    for (let i = 0; i < elapsed; i++) {
      const day = addDays(lastProcessed, i);
      let dayHadQuests = false;

      for (const goal of goals) {
        const dayQuests = await questRepo.getDailyQuestsForGoal(goal.id, day);
        // This goal had nothing that day (e.g. created later) — naturally skipped.
        if (dayQuests.length === 0) continue;
        dayHadQuests = true;

        if (!dayQuests.every((q) => q.isCompleted)) {
          questsLeftIncomplete = true;
          continue;
        }

        const newCount = await goalRepo.incrementDaysCompleted(goal.id);
        if (newCount % DAYS_PER_KEY === 0) {
          await playerRepo.awardKey();
          try {
            await DungeonService.generateAndSchedule(
              { ...goal, daysCompleted: newCount },
              player?.level ?? 1,
              player?.modelPreference ?? 'cloud',
            );
          } catch {
            // Dungeon scheduling is best-effort; the key is still awarded.
          }
          keysAwarded++;
        }
      }

      if (dayHadQuests) daysEvaluated++;
    }

    // Every day up to `today - 1` has now been evaluated, so any campaign whose last
    // day is in the past is over. Without this, campaigns stayed 'active' forever and
    // permanently consumed one of the 3 campaign slots.
    const finished = await goalRepo.completeEndedGoals(today);

    await setMeta(LAST_TIMELINE_DATE, today);
    await refreshRank();

    for (const g of finished) {
      NotificationService.send(
        '[Campaign Complete.]',
        `"${g.title}" has ended. ${g.daysCompleted} of ${g.durationDays} days conquered.`,
      ).catch(() => {});
    }

    // PENALTY — a day ended with quests left incomplete: every earned reward is
    // confiscated. The notice date is stored so the System announces it on next open.
    if (questsLeftIncomplete) {
      await inventoryRepo.clearItems();
      await setMeta(PENALTY_NOTICE_KEY, today);
      NotificationService.send(
        '[Penalty.]',
        'You failed to complete your daily quests. All rewards have been confiscated.',
      ).catch(() => {});
    }

    if (keysAwarded > 0) {
      NotificationService.send(
        '[Dungeon Key Acquired.]',
        `Your consistency has torn open a Gate. ${keysAwarded} dungeon${keysAwarded > 1 ? 's' : ''} await.`,
      ).catch(() => {});
    }
    const lastNotified = await getMeta(LAST_DAILY_NOTIFICATION_DATE);
    if (lastNotified !== today) {
      await setMeta(LAST_DAILY_NOTIFICATION_DATE, today);
      NotificationService.send(
        '[Daily Quest has arrived.]',
        'A new day on your path. Rise and conquer, Hunter.',
      ).catch(() => {});
    }

    return {
      newDay: true,
      daysEvaluated,
      keysAwarded,
      penaltyApplied: questsLeftIncomplete,
      campaignsCompleted: finished.length,
    };
  },

  refreshRank,
};
