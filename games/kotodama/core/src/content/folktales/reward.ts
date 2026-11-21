import type { Tale } from '../tales';

/**
 * What finishing a tale for the first time gives the player. The game calls this once
 * per tale, when its last page is turned, and adds the gold and the hero XP to the save.
 *
 * `talesRead` is how many tales the player had already finished before this one
 * (0 for the first). `pages` is this tale's page count.
 */
export function taleReward(tale: Tale, talesRead: number): { gold: number; xp: number } {
  // TODO(human): decide what reading a tale is worth.
  void tale;
  void talesRead;
  return { gold: 0, xp: 0 };
}
