import { getDb } from '../database/db';
import { DungeonChallenge, DungeonResult, Quest, QuestType } from '../../domain/models/Quest';
import { IQuestRepository } from '../../domain/repositories/IQuestRepository';
import { Rank } from '../../core/constants';

function parseJson<T>(value: unknown): T | null {
  if (value == null || value === '') return null;
  try {
    return JSON.parse(value as string) as T;
  } catch {
    return null;
  }
}

function rowToQuest(row: Record<string, unknown>): Quest {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as string,
    difficulty: row.difficulty as Rank,
    xpReward: row.xp_reward as number,
    goldReward: row.gold_reward as number,
    isCompleted: (row.is_completed as number) === 1,
    createdAt: row.created_at as string,
    completedAt: (row.completed_at as string | null) ?? null,
    goalId: (row.goal_id as string | null) ?? null,
    scheduledFor: (row.scheduled_for as string | null) ?? null,
    questType: ((row.quest_type as string) ?? 'daily') as QuestType,
    dungeonChallenge: parseJson<DungeonChallenge>(row.dungeon_challenge),
    dungeonResult: parseJson<DungeonResult>(row.dungeon_result),
    acceptedAt: (row.accepted_at as string | null) ?? null,
  };
}

export class QuestRepository implements IQuestRepository {
  async getQuests(): Promise<Quest[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM quests ORDER BY created_at DESC',
    );
    return rows.map(rowToQuest);
  }

  async saveQuests(quests: Quest[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
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

  async acceptQuest(questId: string): Promise<Quest> {
    const db = await getDb();
    const acceptedAt = new Date().toISOString();
    await db.runAsync('UPDATE quests SET accepted_at = ? WHERE id = ?', [acceptedAt, questId]);
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM quests WHERE id = ?',
      [questId],
    );
    if (!row) throw new Error(`Quest ${questId} not found`);
    return rowToQuest(row);
  }

  async completeQuest(questId: string): Promise<Quest> {
    const db = await getDb();
    const completedAt = new Date().toISOString();
    await db.runAsync(
      'UPDATE quests SET is_completed = 1, completed_at = ? WHERE id = ?',
      [completedAt, questId],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM quests WHERE id = ?',
      [questId],
    );
    if (!row) throw new Error(`Quest ${questId} not found`);
    return rowToQuest(row);
  }

  async resetQuests(): Promise<void> {
    // Timeline quests are dated and stay completed once done — reset only clears all.
    const db = await getDb();
    await db.runAsync('DELETE FROM quests');
  }

  async deleteQuestsForGoal(goalId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM quests WHERE goal_id = ?', [goalId]);
  }

  async resetDailyQuests(dateStr: string): Promise<void> {
    // Un-complete today's daily quests so they can be re-done (manual daily reset).
    const db = await getDb();
    await db.runAsync(
      `UPDATE quests SET is_completed = 0, completed_at = NULL
        WHERE quest_type = 'daily' AND scheduled_for = ?`,
      [dateStr],
    );
  }

  async getTodaysQuests(dateStr: string): Promise<Quest[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM quests
        WHERE quest_type = 'daily' AND scheduled_for = ?
        ORDER BY difficulty ASC`,
      [dateStr],
    );
    return rows.map(rowToQuest);
  }

  async getDailyQuestsForGoal(goalId: string, dateStr: string): Promise<Quest[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM quests
        WHERE quest_type = 'daily' AND goal_id = ? AND scheduled_for = ?
        ORDER BY difficulty ASC`,
      [goalId, dateStr],
    );
    return rows.map(rowToQuest);
  }

  async getDailyQuestsUpTo(dateStr: string): Promise<Quest[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM quests
        WHERE quest_type = 'daily' AND scheduled_for IS NOT NULL AND scheduled_for <= ?
        ORDER BY scheduled_for ASC`,
      [dateStr],
    );
    return rows.map(rowToQuest);
  }

  async getDungeons(): Promise<Quest[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      `SELECT * FROM quests WHERE quest_type = 'dungeon' ORDER BY scheduled_for ASC`,
    );
    return rows.map(rowToQuest);
  }

  async setDungeonResult(questId: string, result: DungeonResult): Promise<Quest> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE quests SET dungeon_result = ?, is_completed = 1, completed_at = ? WHERE id = ?',
      [JSON.stringify(result), result.reportedAt, questId],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM quests WHERE id = ?',
      [questId],
    );
    if (!row) throw new Error(`Dungeon ${questId} not found`);
    return rowToQuest(row);
  }
}
