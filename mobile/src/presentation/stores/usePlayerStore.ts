import { create } from 'zustand';
import { Player } from '../../domain/models/Player';
import { PlayerRepository } from '../../data/repositories/PlayerRepository';
import { ApiDataSource } from '../../data/datasources/ApiDataSource';
import { ApiPlayer } from '../../data/datasources/ApiTypes';
import { STAT_KEYS } from '../../core/constants';
import { isOnline } from '../../core/network';

const repo = new PlayerRepository();

function apiPlayerToDomain(api: ApiPlayer): Player {
  const stats = {} as Player['stats'];
  for (const key of STAT_KEYS) {
    stats[key] = api.stats[key] ?? 10;
  }
  return {
    id: api.id,
    name: api.name,
    level: api.level,
    experience: api.experience,
    experienceToNextLevel: api.experience_to_next_level,
    stats,
    bio: api.bio ?? null,
    aspirations: api.aspirations ?? null,
    modelPreference: api.model_preference ?? 'local',
    rank: api.rank ?? 'E-Rank',
    keys: 0, // keys are tracked locally, not by the stateless backend
  };
}

/**
 * Validate a proposed Hunter name before it is saved.
 * Returns an error message to show the user, or null if the name is acceptable.
 * The raw (untrimmed) input is passed in so trimming rules are decided here.
 */
export function validateHunterName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'A Hunter requires a name.';
  if (trimmed.length < 2) return 'A Hunter name must be at least 2 characters.';
  if (trimmed.length > 30) return 'A Hunter name must be 30 characters or fewer.';
  return null;
}

interface PlayerState {
  player: Player | null;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  syncFromApi: (apiPlayer: ApiPlayer) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updateBio: (bio: string) => Promise<void>;
  updateAspirations: (aspirations: string) => Promise<void>;
  applyLevelUp: (newLevel: number, newExp: number, newExpRequired: number) => void;
  /** Apply XP locally (the device is the source of truth). Returns true on level-up. */
  addExperience: (amount: number) => boolean;
  /** Re-read the player from SQLite (e.g. after the timeline awards keys / updates rank). */
  refreshFromLocal: () => Promise<void>;
  /** Reset progression (level/XP/stats/rank/keys) to a fresh Hunter, keeping identity. */
  resetProgress: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  player: null,
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    const local = await repo.getPlayer();

    // Local is the source of truth once it exists — never let the stateless server
    // mock overwrite locally-earned XP, keys, or rank.
    if (local) {
      set({ player: local, loading: false, error: null });
      return;
    }

    // First run, no local player — seed from the API.
    const online = await isOnline();
    if (!online) {
      set({ loading: false, error: 'No connection — start online to initialize your Hunter.' });
      return;
    }
    try {
      const apiPlayer = await ApiDataSource.getProfile();
      await get().syncFromApi(apiPlayer);
    } catch {
      set({ loading: false, error: 'Could not load player data' });
    }
  },

  syncFromApi: async (apiPlayer: ApiPlayer) => {
    const player = apiPlayerToDomain(apiPlayer);
    await repo.savePlayer(player);
    set({ player, loading: false, error: null });
  },

  updateName: async (name: string) => {
    const { player } = get();
    if (!player) return;
    // Name is local identity only — the stateless backend never stores it,
    // so unlike bio/aspirations there is no API call to make here.
    await repo.updateName(name);
    set({ player: { ...player, name } });
  },

  updateBio: async (bio: string) => {
    const { player } = get();
    if (!player) return;
    await repo.updateBio(bio);
    try {
      await ApiDataSource.updateProfile(bio, player.modelPreference, player.aspirations ?? '');
    } catch {
      // Saved locally — sync when back online
    }
    set({ player: { ...player, bio } });
  },

  updateAspirations: async (aspirations: string) => {
    const { player } = get();
    if (!player) return;
    await repo.updateAspirations(aspirations);
    try {
      await ApiDataSource.updateProfile(player.bio ?? '', player.modelPreference, aspirations);
    } catch {
      // Saved locally — sync when back online
    }
    set({ player: { ...player, aspirations } });
  },

  applyLevelUp: (newLevel, newExp, newExpRequired) => {
    const { player } = get();
    if (!player) return;
    const updated = {
      ...player,
      level: newLevel,
      experience: newExp,
      experienceToNextLevel: newExpRequired,
    };
    repo.saveProgress(updated).catch(() => set({ error: 'Could not save experience.' }));
    set({ player: updated });
  },

  addExperience: (amount: number) => {
    const { player } = get();
    if (!player) return false;

    let level = player.level;
    let experience = player.experience + amount;
    let toNext = player.experienceToNextLevel;
    const stats = { ...player.stats };
    let leveledUp = false;

    // Mirror the backend math: each level-up bumps the threshold ×1.5 and +1 to all stats.
    while (experience >= toNext) {
      leveledUp = true;
      level += 1;
      experience -= toNext;
      toNext = Math.floor(toNext * 1.5);
      for (const key of STAT_KEYS) stats[key] += 1;
    }

    const updated = { ...player, level, experience, experienceToNextLevel: toNext, stats };
    // Progress columns only — a full savePlayer would clobber keys/rank the timeline
    // wrote directly to SQLite since this in-memory copy was loaded.
    repo.saveProgress(updated).catch(() => set({ error: 'Could not save experience.' }));
    set({ player: updated });
    return leveledUp;
  },

  refreshFromLocal: async () => {
    const local = await repo.getPlayer();
    if (local) set({ player: local });
  },

  resetProgress: async () => {
    await repo.resetProgress();
    await get().refreshFromLocal();
  },
}));
