import { elementMultiplier, type Element } from '../content/elements';

export interface DamageInput {
  atk: number;
  def: number;
  power: number;
  level: number;
  attackElement: Element;
  defendElement: Element;
  combo: number;
  comboStep: number;
  crit: boolean;
  /** 0.9..1.1 variance roll. */
  variance: number;
  /** Spirit-surge multiplier from a solved FOCUS puzzle (see surgeMultiplier). Default 1. */
  surge?: number;
}

export const MAX_COMBO_MULTIPLIER = 2;
export const CRIT_MULTIPLIER = 1.5;

export function comboMultiplier(combo: number, step: number): number {
  return Math.min(MAX_COMBO_MULTIPLIER, 1 + combo * step);
}

/** Always at least 1 for a damaging move, so no fight is ever unwinnable. */
export function computeDamage(d: DamageInput): number {
  if (d.power <= 0) return 0;
  // No extra level multiplier: atk already grows with level (statsAt), and HP only
  // grows linearly, so a second level factor made late-game fights end in 2-3 answers.
  const raw = (d.atk * d.power * 2 - d.def) * 0.9;
  const scaled =
    Math.max(1, raw) *
    elementMultiplier(d.attackElement, d.defendElement) *
    comboMultiplier(d.combo, d.comboStep) *
    (d.crit ? CRIT_MULTIPLIER : 1) *
    (d.surge ?? 1) *
    d.variance;
  return Math.max(1, Math.round(scaled));
}

/** Party hits a solved FOCUS puzzle charges. */
export const SURGE_CHARGES = 3;

/** Extra damage per charge still held: the surge is strongest the moment it starts. */
export const SURGE_STEP = 0.5;

/**
 * How much harder a surged hit lands. `chargesLeft` counts down as the surge is
 * spent: SURGE_CHARGES for the first charged hit, 1 for the last.
 *
 * x2.5, then x2, then x1.5. FOCUS costs a turn, so the three hits together (x6)
 * must beat the four plain hits (x4) the party would otherwise have landed; this
 * does, by half again. Front-loaded so the hit right after the puzzle is the one
 * that feels like the reward, and so a surge fading out is visible in the numbers.
 */
export function surgeMultiplier(chargesLeft: number): number {
  return 1 + SURGE_STEP * Math.max(1, Math.min(SURGE_CHARGES, chargesLeft));
}
