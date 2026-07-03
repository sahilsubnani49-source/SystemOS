import { Player } from '../models/Player';

export interface IPlayerRepository {
  getPlayer(): Promise<Player | null>;
  savePlayer(player: Player): Promise<void>;
  updateBio(bio: string): Promise<void>;
  updateAspirations(aspirations: string): Promise<void>;
  /** Award one dungeon key; returns the new key total. */
  awardKey(): Promise<number>;
  setRank(rank: string): Promise<void>;
}
