import { getDb } from '../database/db';
import { Goal, GoalStatus } from '../../domain/models/Goal';
import { Quest } from '../../domain/models/Quest';
import { IGoalRepository } from '../../domain/repositories/IGoalRepository';

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    context: row.context as string,
    durationDays: row.duration_days as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    plan: (row.plan as string) ?? '',
    schedule: (row.schedule as string) ?? '',
    daysCompleted: (row.days_completed as number) ?? 0,
    status: (row.status as GoalStatus) ?? 'active',
    createdAt: row.created_at as string,
  };
}

export class GoalRepository implements IGoalRepository {
  async getActiveGoals(): Promise<Goal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM goals WHERE status = 'active' ORDER BY created_at DESC`,
    );
    return rows.map(rowToGoal);
  }

  async getRankedGoals(): Promise<Goal[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM goals WHERE status IN ('active', 'completed') ORDER BY created_at DESC`,
    );
    return rows.map(rowToGoal);
  }

  async completeEndedGoals(today: string): Promise<Goal[]> {
    // end_date is the campaign's LAST day (inclusive), so it has ended once today is past it.
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM goals WHERE status = 'active' AND end_date < ?`,
      [today],
    );
    if (rows.length === 0) return [];
    await db.runAsync(
      `UPDATE goals SET status = 'completed' WHERE status = 'active' AND end_date < ?`,
      [today],
    );
    return rows.map((r) => ({ ...rowToGoal(r), status: 'completed' as const }));
  }

  async countActiveGoals(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT COUNT(*) as c FROM goals WHERE status = 'active'`,
    );
    return (row?.c as number) ?? 0;
  }

  async getGoal(goalId: string): Promise<Goal | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM goals WHERE id = ?',
      [goalId],
    );
    return row ? rowToGoal(row) : null;
  }

  async saveGoal(goal: Goal): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO goals
        (id, title, description, context, duration_days, start_date, end_date,
         plan, schedule, days_completed, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.title,
        goal.description,
        goal.context,
        goal.durationDays,
        goal.startDate,
        goal.endDate,
        goal.plan,
        goal.schedule,
        goal.daysCompleted,
        goal.status,
        goal.createdAt,
      ],
    );
  }

  async saveCampaign(goal: Goal, quests: Quest[]): Promise<void> {
    // One transaction for the goal + its whole quest set: either the full campaign
    // lands or nothing does, so a goal can never exist without its daily work.
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO goals
          (id, title, description, context, duration_days, start_date, end_date,
           plan, schedule, days_completed, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          goal.id,
          goal.title,
          goal.description,
          goal.context,
          goal.durationDays,
          goal.startDate,
          goal.endDate,
          goal.plan,
          goal.schedule,
          goal.daysCompleted,
          goal.status,
          goal.createdAt,
        ],
      );

      for (const q of quests) {
        await db.runAsync(
          `INSERT OR REPLACE INTO quests
            (id, title, description, category, difficulty, xp_reward, gold_reward,
             is_completed, created_at, completed_at,
             goal_id, scheduled_for, quest_type, dungeon_challenge, dungeon_result, accepted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            q.id,
            q.title,
            q.description,
            q.category,
            q.difficulty,
            q.xpReward,
            q.goldReward,
            q.isCompleted ? 1 : 0,
            q.createdAt,
            q.completedAt ?? null,
            q.goalId ?? null,
            q.scheduledFor ?? null,
            q.questType,
            q.dungeonChallenge ? JSON.stringify(q.dungeonChallenge) : null,
            q.dungeonResult ? JSON.stringify(q.dungeonResult) : null,
            q.acceptedAt ?? null,
          ],
        );
      }
    });
  }

  async incrementDaysCompleted(goalId: string): Promise<number> {
    const db = await getDb();
    await db.runAsync('UPDATE goals SET days_completed = days_completed + 1 WHERE id = ?', [
      goalId,
    ]);
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT days_completed FROM goals WHERE id = ?',
      [goalId],
    );
    return (row?.days_completed as number) ?? 0;
  }

  async setStatus(goalId: string, status: GoalStatus): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE goals SET status = ? WHERE id = ?', [status, goalId]);
  }

  async deleteAllGoals(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM goals');
  }

  async deleteGoal(goalId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM goals WHERE id = ?', [goalId]);
  }
}
