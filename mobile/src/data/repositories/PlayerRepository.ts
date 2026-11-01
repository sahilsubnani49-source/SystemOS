import { getDb } from '../database/db';
import { Player, PlayerStats } from '../../domain/models/Player';
import { IPlayerRepository } from '../../domain/repositories/IPlayerRepository';
import { STAT_KEYS } from '../../core/constants';

function rowToPlayer(row: Record<string, unknown>): Player {
  const stats = {} as PlayerStats;
  for (const key of STAT_KEYS) {
    stats[key] = (row[key] as number) ?? 10;
  }
  return {
    id: row.id as string,
    name: row.name as string,
    level: row.level as number,
    experience: row.experience as number,
    experienceToNextLevel: row.experience_to_next_level as number,
    stats,
    bio: (row.bio as string | null) ?? null,
    aspirations: (row.aspirations as string | null) ?? null,
    modelPreference: (row.model_preference as 'local' | 'cloud') ?? 'local',
    rank: (row.rank as string) ?? 'E-Rank',
    keys: (row.keys as number) ?? 0,
  };
}

export class PlayerRepository implements IPlayerRepository {
  async getPlayer(): Promise<Player | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM players LIMIT 1');
    return row ? rowToPlayer(row) : null;
  }

  async savePlayer(player: Player): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO players
        (id, name, level, experience, experience_to_next_level,
         strength, agility, stamina, intelligence, perception,
         discipline, creativity, mindfulness, bio, aspirations, model_preference,
         rank, keys)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player.id,
        player.name,
        player.level,
        player.experience,
        player.experienceToNextLevel,
        player.stats.strength,
        player.stats.agility,
        player.stats.stamina,
        player.stats.intelligence,
        player.stats.perception,
        player.stats.discipline,
        player.stats.creativity,
        player.stats.mindfulness,
        player.bio ?? null,
        player.aspirations ?? null,
        player.modelPreference,
        player.rank,
        player.keys,
      ],
    );
  }

  /**
   * Persist ONLY the progression columns (level / XP / stats). Unlike savePlayer this
   * never rewrites rank, keys, bio, etc. from a possibly-stale in-memory copy — the
   * timeline awards keys and rank straight to SQLite, and a full-row REPLACE from the
   * store would silently roll them back.
   */
  async saveProgress(player: Player): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE players SET
        level = ?, experience = ?, experience_to_next_level = ?,
        strength = ?, agility = ?, stamina = ?, intelligence = ?, perception = ?,
        discipline = ?, creativity = ?, mindfulness = ?
       WHERE id = ?`,
      [
        player.level,
        player.experience,
        player.experienceToNextLevel,
        player.stats.strength,
        player.stats.agility,
        player.stats.stamina,
        player.stats.intelligence,
        player.stats.perception,
        player.stats.discipline,
        player.stats.creativity,
        player.stats.mindfulness,
        player.id,
      ],
    );
  }

  async awardKey(): Promise<number> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE players SET keys = keys + 1 WHERE id = (SELECT id FROM players LIMIT 1)',
    );
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT keys FROM players LIMIT 1');
    return (row?.keys as number) ?? 0;
  }

  async setRank(rank: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE players SET rank = ? WHERE id = (SELECT id FROM players LIMIT 1)', [
      rank,
    ]);
  }

  async updateName(name: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE players SET name = ? WHERE id = (SELECT id FROM players LIMIT 1)', [
      name,
    ]);
  }

  async updateBio(bio: string): Promise<void> {
    const db = await getDb();
    await db.runAsync('UPDATE players SET bio = ? WHERE id = (SELECT id FROM players LIMIT 1)', [
      bio,
    ]);
  }

  async updateAspirations(aspirations: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      'UPDATE players SET aspirations = ? WHERE id = (SELECT id FROM players LIMIT 1)',
      [aspirations],
    );
  }

  /**
   * Reset the singleton player's progression to a fresh Hunter while preserving
   * identity (id, name, bio, aspirations, model_preference).
   */
  async resetProgress(): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE players SET
        level = 1,
        experience = 0,
        experience_to_next_level = 100,
        strength = 10,
        agility = 10,
        stamina = 10,
        intelligence = 10,
        perception = 10,
        discipline = 10,
        creativity = 10,
        mindfulness = 10,
        rank = 'E-Rank',
        keys = 0
       WHERE id = (SELECT id FROM players LIMIT 1)`,
    );
  }
}
