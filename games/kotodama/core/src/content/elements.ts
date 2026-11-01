export type Element = 'fire' | 'water' | 'wind' | 'earth' | 'thunder' | 'shadow' | 'light' | 'steel';

// Wheel: fire > wind > earth > thunder > water > fire. Shadow and light hit each
// other hard. Steel (samurai, raiders' iron) resists the wheel but is weak to thunder.
const STRONG: Record<Element, Element[]> = {
  fire: ['wind', 'steel'],
  wind: ['earth'],
  earth: ['thunder'],
  thunder: ['water', 'steel'],
  water: ['fire'],
  shadow: ['light'],
  light: ['shadow'],
  steel: ['shadow'],
};

/** Damage multiplier for an attack of `attack` element landing on `defend`. */
export function elementMultiplier(attack: Element, defend: Element): number {
  if (STRONG[attack].includes(defend)) return 1.5;
  if (STRONG[defend].includes(attack)) return 0.75;
  return 1;
}
