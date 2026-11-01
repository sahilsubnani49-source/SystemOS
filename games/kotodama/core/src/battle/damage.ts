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
}

export const MAX_COMBO_MULTIPLIER = 2;
export const CRIT_MULTIPLIER = 1.5;

export function comboMultiplier(combo: number, step: number): number {
  return Math.min(MAX_COMBO_MULTIPLIER, 1 + combo * step);
}

/** Always at least 1 for a damaging move, so no fight is ever unwinnable. */
export function computeDamage(d: DamageInput): number {
  if (d.power <= 0) return 0;
  const raw = (d.atk * d.power * (1 + d.level / 20) * 2 - d.def) * 0.9;
  const scaled =
    Math.max(1, raw) *
    elementMultiplier(d.attackElement, d.defendElement) *
    comboMultiplier(d.combo, d.comboStep) *
    (d.crit ? CRIT_MULTIPLIER : 1) *
    d.variance;
  return Math.max(1, Math.round(scaled));
}
