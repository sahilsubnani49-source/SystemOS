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

    // Each dimension contributes 0–3 points; the summed score (0–9) maps to a rank.
    // Every threshold must be met to earn that dimension's point tier, and higher
    // ranks therefore require progress on ALL fronts, not just grinding one.
    //
    //   points │ level ≥ │ completionRate ≥ │ dungeonsCleared ≥
    //     1    │    5    │       0.25       │        1
    //     2    │   15    │       0.50       │        2
    //     3    │   30    │       0.75       │        4
    //
    //   score 0 → E · 1–2 → D · 3–4 → C · 5–6 → B · 7–8 → A · 9 → S
    const tier = (value: number, thresholds: [number, number, number]): number => {
      if (value >= thresholds[2]) return 3;
      if (value >= thresholds[1]) return 2;
      if (value >= thresholds[0]) return 1;
      return 0;
    };

    const score =
      tier(input.level, [5, 15, 30]) +
      tier(completionRate, [0.25, 0.5, 0.75]) +
      tier(input.dungeonsCleared, [1, 2, 4]);

    if (score >= 9) return 'S-Rank';
    if (score >= 7) return 'A-Rank';
    if (score >= 5) return 'B-Rank';
    if (score >= 3) return 'C-Rank';
    if (score >= 1) return 'D-Rank';
    return 'E-Rank';
  },
};
