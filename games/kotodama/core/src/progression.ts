import { addDaysStr } from './util/dates';
import { HEROES, type HeroClass } from './content/heroes';
import { familyForRow, familyItemIds, getFamily, movesAt, stageForMastery, statsAt } from './content/spirits';
import { getKana } from './content/kana';
import { getKanji } from './content/kanji';
import { isKanjiId, isWordId } from './content/items';
import { averageStage, type SrsTable } from './srs/schedule';
import type { Combatant } from './battle/engine';
import type { FoeSpec } from './world/types';
import type { OwnedSpirit, Save } from './save/schema';
import type { Rng } from './util/rng';

export const MAX_LEVEL = 50;

export function xpToNext(level: number): number {
  return 20 + level * level * 6;
}

export function applyXp(level: number, xp: number, gain: number): { level: number; xp: number; levelsGained: number } {
  let l = level;
  let x = xp + gain;
  let gained = 0;
  while (l < MAX_LEVEL && x >= xpToNext(l)) {
    x -= xpToNext(l);
    l += 1;
    gained += 1;
  }
  if (l >= MAX_LEVEL) x = 0;
  return { level: l, xp: x, levelsGained: gained };
}

/** Mastery-flag that teaches both heroes their Mirror move. */
export const MIRROR_FLAG = 'learned_mirror';

/** Evolution stage of a family, from mastery of the exact items it embodies. */
export function familyStage(familyId: string, srs: SrsTable): 0 | 1 | 2 {
  return stageForMastery(averageStage(srs, familyItemIds(getFamily(familyId))));
}

export function heroCombatant(save: Save): Combatant {
  const def = HEROES[save.hero];
  const stats = statsAt(def.base, save.heroLevel, 0);
  return {
    uid: 'hero',
    side: 'party',
    name: save.playerName,
    nameJa: def.titleJa,
    sprite: def.sprite,
    element: def.element,
    level: save.heroLevel,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    moves: save.flags[MIRROR_FLAG] ? [...def.moves, def.mirrorMove] : [...def.moves],
    comboStep: def.comboStep,
    guard: false,
    evade: false,
  };
}

export function spiritCombatant(owned: OwnedSpirit, srs: SrsTable): Combatant {
  const family = getFamily(owned.familyId);
  const stage = familyStage(family.id, srs);
  const stats = statsAt(family.base, owned.level, stage);
  const form = family.stages[stage];
  return {
    uid: owned.uid,
    side: 'party',
    name: form.name,
    nameJa: form.nameJa,
    sprite: form.sprite,
    element: family.element,
    level: owned.level,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    moves: movesAt(family, stage),
    comboStep: 0.1,
    guard: false,
    evade: false,
  };
}

/**
 * A corrupted (Mojibake) foe. Wild foes carry a true kana from their own row, drawn
 * from the area's pool when possible, which the player must type to purify them.
 */
export function foeCombatant(spec: FoeSpec, uid: string, pool: readonly string[], rng: Rng): Combatant {
  const family = getFamily(spec.familyId);
  const stats = statsAt(family.base, spec.level, 0);
  // The true name is always one kana or one kanji (purifying means TYPING its
  // reading), taken from what the family embodies. Words are never candidates.
  const own = (id: string): boolean => {
    if (isWordId(id)) return false;
    if (family.kanjiGroup) return isKanjiId(id) && getKanji(id).group === family.kanjiGroup;
    if (isKanjiId(id)) return false;
    const k = getKana(id);
    return k.script === family.script && (k.row === family.row || (family.row === 'w' && k.row === 'nn'));
  };
  const inPool = pool.filter(own);
  const trueName = rng.pick(inPool.length > 0 ? inPool : familyItemIds(family));
  const hp = Math.round(stats.hp * (spec.hpScale ?? 1));
  const form = family.stages[0];
  return {
    uid,
    side: 'enemy',
    name: spec.name ?? `Corrupted ${form.name}`,
    nameJa: spec.nameJa ?? form.nameJa,
    sprite: spec.sprite ?? form.sprite,
    element: family.element,
    level: spec.level,
    hp,
    maxHp: hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    moves: ['rend', ...movesAt(family, 0)],
    comboStep: 0,
    guard: false,
    evade: false,
    familyId: spec.recruitable === false ? undefined : family.id,
    trueName,
  };
}

/** Study streak: consecutive local days with a session. Today again keeps it. */
export function nextStreak(lastPlayed: string | null, streak: number, today: string): number {
  if (lastPlayed === today) return Math.max(1, streak);
  if (lastPlayed && addDaysStr(lastPlayed, 1) === today) return streak + 1;
  return 1;
}

/**
 * Horse bond grows with the streak: riding speed multiplier from 1.5x (streak
 * broken) up to 3x at a 14-day streak. A neglected horse is slow, not lost.
 */
export function horseSpeed(streakDays: number): number {
  return 1.5 + Math.min(1, Math.max(0, streakDays - 1) / 13) * 1.5;
}

export { familyForRow };
export type { HeroClass };
