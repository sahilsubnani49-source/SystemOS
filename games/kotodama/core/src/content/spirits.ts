import type { Element } from './elements';
import type { KanaRow } from './kana';
import type { MoveId } from './moves';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface SpiritStage {
  name: string;
  /** Japanese name; always starts with a kana from the family's row. */
  nameJa: string;
  /** Sprite atlas key (see game/assets). */
  sprite: string;
}

/**
 * A Kotodama family is bound to one kana row. Its evolution stage is NOT bought with
 * XP: it is read from the player's SRS mastery of that row (see stageForMastery).
 * The collection is therefore an honest map of what the player can read.
 */
export interface SpiritFamily {
  id: string;
  row: KanaRow;
  element: Element;
  folklore: string;
  stages: [SpiritStage, SpiritStage, SpiritStage];
  base: BaseStats;
  /** Moves unlocked at stage 0, 1, 2 (cumulative). */
  moves: [MoveId[], MoveId[], MoveId[]];
}

const s = (name: string, nameJa: string, sprite: string): SpiritStage => ({ name, nameJa, sprite });

export const SPIRIT_FAMILIES: readonly SpiritFamily[] = [
  { id: 'akari', row: 'a', element: 'fire', folklore: 'Paper-lantern spirit (chōchin-obake)',
    stages: [s('Akari', 'あかり', 'akari0'), s('Akaribi', 'あかりび', 'akari1'), s('Ondōrō', 'おんどうろう', 'akari2')],
    base: { hp: 38, atk: 11, def: 8, spd: 10 }, moves: [['ember'], ['blossom'], ['foxfire']] },
  { id: 'kobi', row: 'k', element: 'fire', folklore: 'Fox-fire kitsune',
    stages: [s('Kobi', 'こび', 'kobi0'), s('Kitsunebi', 'きつねび', 'kobi1'), s('Kokonoe', 'ここのえ', 'kobi2')],
    base: { hp: 34, atk: 13, def: 7, spd: 13 }, moves: [['ember'], ['foxfire'], ['gale']] },
  { id: 'suiko', row: 's', element: 'water', folklore: 'River imp (kappa)',
    stages: [s('Sarara', 'さらら', 'suiko0'), s('Sawataro', 'さわたろう', 'suiko1'), s('Suiko', 'すいこ', 'suiko2')],
    base: { hp: 42, atk: 10, def: 11, spd: 8 }, moves: [['torrent'], ['mend'], ['tide']] },
  { id: 'tanu', row: 't', element: 'earth', folklore: 'Shape-shifting tanuki',
    stages: [s('Tanu', 'たぬ', 'tanu0'), s('Tanuzō', 'たぬぞう', 'tanu1'), s('Tetsubara', 'てつばら', 'tanu2')],
    base: { hp: 48, atk: 11, def: 12, spd: 6 }, moves: [['boulder'], ['guardian'], ['mend']] },
  { id: 'nekaze', row: 'n', element: 'wind', folklore: 'Crow tengu',
    stages: [s('Nekaze', 'ねかぜ', 'nekaze0'), s('Nagaha', 'ながは', 'nekaze1'), s('Nokiwashi', 'のきわし', 'nekaze2')],
    base: { hp: 32, atk: 12, def: 7, spd: 15 }, moves: [['gale'], ['nightclaw'], ['shuriken']] },
  { id: 'hikari', row: 'h', element: 'thunder', folklore: 'Thunder beast (raijū)',
    stages: [s('Hachi', 'はち', 'hikari0'), s('Hibiki', 'ひびき', 'hikari1'), s('Hōraijū', 'ほうらいじゅう', 'hikari2')],
    base: { hp: 36, atk: 14, def: 8, spd: 12 }, moves: [['thunder'], ['gale'], ['blossom']] },
  { id: 'mimi', row: 'm', element: 'shadow', folklore: 'Two-tailed cat (nekomata)',
    stages: [s('Mimi', 'みみ', 'mimi0'), s('Matatabi', 'またたび', 'mimi1'), s('Mayonaka', 'まよなか', 'mimi2')],
    base: { hp: 34, atk: 13, def: 8, spd: 14 }, moves: [['nightclaw'], ['smoke'], ['kunai']] },
  { id: 'yozakura', row: 'y', element: 'light', folklore: 'Cherry-tree spirit (kodama)',
    stages: [s('Yuzu', 'ゆず', 'yozakura0'), s('Yozakura', 'よざくら', 'yozakura1'), s('Yamabuki', 'やまぶき', 'yozakura2')],
    base: { hp: 40, atk: 10, def: 10, spd: 10 }, moves: [['blossom'], ['mend'], ['guardian']] },
  { id: 'riki', row: 'r', element: 'earth', folklore: 'Shrine guardian lion (komainu)',
    stages: [s('Riki', 'りき', 'riki0'), s('Ryūseki', 'りゅうせき', 'riki1'), s('Raigōseki', 'らいごうせき', 'riki2')],
    base: { hp: 50, atk: 12, def: 14, spd: 5 }, moves: [['guardian'], ['boulder'], ['thunder']] },
  { id: 'wadachi', row: 'w', element: 'water', folklore: 'Sea-wanderer (umibōzu)',
    stages: [s('Wakame', 'わかめ', 'wadachi0'), s('Wanizame', 'わにざめ', 'wadachi1'), s('Wadachi', 'わだち', 'wadachi2')],
    base: { hp: 46, atk: 12, def: 10, spd: 9 }, moves: [['torrent'], ['tide'], ['mend']] },
];

const BY_ID = new Map(SPIRIT_FAMILIES.map((f) => [f.id, f]));
/** ん has no family of its own; it trains with the w-row sea spirit. */
const BY_ROW = new Map<KanaRow, SpiritFamily>(SPIRIT_FAMILIES.map((f) => [f.row, f]));

export function getFamily(id: string): SpiritFamily {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`Unknown spirit family: ${id}`);
  return f;
}

export function familyForRow(row: KanaRow): SpiritFamily {
  return BY_ROW.get(row === 'nn' ? 'w' : row) as SpiritFamily;
}

/** Evolution from mastery: mean SRS stage of the row's kana (0..5) → spirit stage 0..2. */
export function stageForMastery(averageStage: number): 0 | 1 | 2 {
  if (averageStage >= 4) return 2;
  if (averageStage >= 2) return 1;
  return 0;
}

export function statsAt(base: BaseStats, level: number, stage: number): BaseStats {
  const scale = (1 + level * 0.12) * (1 + stage * 0.15);
  return {
    hp: Math.floor(base.hp * scale),
    atk: Math.floor(base.atk * scale),
    def: Math.floor(base.def * scale),
    spd: Math.floor(base.spd * scale),
  };
}

export function movesAt(family: SpiritFamily, stage: number): MoveId[] {
  return family.moves.slice(0, stage + 1).flat();
}
