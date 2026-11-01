import { Player } from '../models/Player';

export interface IPlayerRepository {
  getPlayer(): Promise<Player | null>;
  savePlayer(player: Player): Promise<void>;
  /** Persist level / XP / stats only — leaves rank, keys and profile untouched. */
  saveProgress(player: Player): Promise<void>;
  updateName(name: string): Promise<void>;
  updateBio(bio: string): Promise<void>;
  updateAspirations(aspirations: string): Promise<void>;
  /** Award one dungeon key; returns the new key total. */
  awardKey(): Promise<number>;
  setRank(rank: string): Promise<void>;
}
