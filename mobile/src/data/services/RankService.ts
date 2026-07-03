// Hunter Rank — the player's personal progression rank (Solo Leveling style).
// Single-player, offline; rises as the player levels up, clears dungeons, and stays
// consistent through their campaign.

export const HUNTER_RANKS = ['E-Rank', 'D-Rank', 'C-Rank', 'B-Rank', 'A-Rank', 'S-Rank'] as const;
export type HunterRank = (typeof HUNTER_RANKS)[number];

export interface RankInput {
  /** Player level. */
  level: number;
  /** Number of dungeons (mock-exam gates) the player has cleared with a PASS. */
  dungeonsCleared: number;
  /** Days of the campaign fully completed. */
  daysCompleted: number;
  /** Total length of the active campaign in days (0 if no active goal). */
  durationDays: number;
}

export const RankService = {
  /**
   * Maps the player's progress to a Hunter Rank (one of HUNTER_RANKS).
   *
   * `completionRate` (0..1) is pre-computed for convenience — the share of campaign
   * days the player has fully completed.
   */
  computeRank(input: RankInput): HunterRank {
    const completionRate = input.durationDays > 0 ? input.daysCompleted / input.durationDays : 0;

    // TODO: decide how (input.level, input.dungeonsCleared, completionRate)
    // combine into a Hunter Rank. Return one of HUNTER_RANKS. The placeholder below
    // keeps the app compiling — replace it with your threshold logic.
    void completionRate;
    return HUNTER_RANKS[0];
  },
};
