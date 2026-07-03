import { getDb } from '../database/db';
import { TrainingExercise } from '../../domain/models/TrainingExercise';
import { GymSession } from '../../domain/models/GymSession';
import { ITrainingRepository } from '../../domain/repositories/ITrainingRepository';

function rowToGymSession(row: Record<string, unknown>): GymSession {
  return {
    date: row.date as string,
    hours: row.hours as number,
    xpAwarded: row.xp_awarded as number,
    createdAt: row.created_at as string,
  };
}

function rowToExercise(row: Record<string, unknown>): TrainingExercise {
  return {
    id: row.id as string,
    name: row.name as string,
    muscleGroup: row.muscle_group as string,
    mode: row.mode as 'reps' | 'seconds',
    baseline: row.baseline as number,
    currentTarget: row.current_target as number,
    maxTarget: row.max_target as number,
    stepIndex: row.step_index as number,
    daysTrained: row.days_trained as number,
    lastCompletedDate: (row.last_completed_date as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export class TrainingRepository implements ITrainingRepository {
  async getExercises(): Promise<TrainingExercise[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM training_exercises ORDER BY created_at ASC',
    );
    return rows.map(rowToExercise);
  }

  async saveExercises(list: TrainingExercise[]): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
      for (const e of list) {
        await db.runAsync(
          `INSERT OR REPLACE INTO training_exercises
            (id, name, muscle_group, mode, baseline, current_target, max_target,
             step_index, days_trained, last_completed_date, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            e.id,
            e.name,
            e.muscleGroup,
            e.mode,
            e.baseline,
            e.currentTarget,
            e.maxTarget,
            e.stepIndex,
            e.daysTrained,
            e.lastCompletedDate ?? null,
            e.createdAt,
          ],
        );
      }
    });
  }

  async completeExercise(id: string, dateStr: string): Promise<TrainingExercise> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE training_exercises SET last_completed_date = ?, days_trained = days_trained + 1 WHERE id = ?',
      [dateStr, id],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM training_exercises WHERE id = ?',
      [id],
    );
    if (!row) throw new Error(`Training exercise ${id} not found`);
    return rowToExercise(row);
  }

  async applyProgression(
    id: string,
    newTarget: number,
    newStepIndex: number,
  ): Promise<TrainingExercise> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE training_exercises SET current_target = ?, step_index = ? WHERE id = ?',
      [newTarget, newStepIndex, id],
    );
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM training_exercises WHERE id = ?',
      [id],
    );
    if (!row) throw new Error(`Training exercise ${id} not found`);
    return rowToExercise(row);
  }

  async getGymSession(date: string): Promise<GymSession | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM gym_sessions WHERE date = ?',
      [date],
    );
    return row ? rowToGymSession(row) : null;
  }

  async upsertGymSession(session: GymSession): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO gym_sessions (date, hours, xp_awarded, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         hours = excluded.hours,
         xp_awarded = excluded.xp_awarded`,
      [session.date, session.hours, session.xpAwarded, session.createdAt],
    );
  }

  async clearAll(): Promise<void> {
    const db = await getDb();
    await db.runAsync('DELETE FROM training_exercises');
    await db.runAsync('DELETE FROM gym_sessions');
  }
}
