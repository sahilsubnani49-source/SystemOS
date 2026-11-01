import type { Element } from './elements';
import type { KanaRow, Script } from './kana';
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
  /** Which script's row this family embodies (and evolves from). */
  script: Script;
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
  { id: 'akari', script: 'hiragana', row: 'a', element: 'fire', folklore: 'Paper-lantern spirit (chōchin-obake)',
    stages: [s('Akari', 'あかり', 'akari0'), s('Akaribi', 'あかりび', 'akari1'), s('Ondōrō', 'おんどうろう', 'akari2')],
    base: { hp: 38, atk: 11, def: 8, spd: 10 }, moves: [['ember'], ['blossom'], ['foxfire']] },
  { id: 'kobi', script: 'hiragana', row: 'k', element: 'fire', folklore: 'Fox-fire kitsune',
    stages: [s('Kobi', 'こび', 'kobi0'), s('Kitsunebi', 'きつねび', 'kobi1'), s('Kokonoe', 'ここのえ', 'kobi2')],
    base: { hp: 34, atk: 13, def: 7, spd: 13 }, moves: [['ember'], ['foxfire'], ['gale']] },
  { id: 'suiko', script: 'hiragana', row: 's', element: 'water', folklore: 'River imp (kappa)',
    stages: [s('Sarara', 'さらら', 'suiko0'), s('Sawataro', 'さわたろう', 'suiko1'), s('Suiko', 'すいこ', 'suiko2')],
    base: { hp: 42, atk: 10, def: 11, spd: 8 }, moves: [['torrent'], ['mend'], ['tide']] },
  { id: 'tanu', script: 'hiragana', row: 't', element: 'earth', folklore: 'Shape-shifting tanuki',
    stages: [s('Tanu', 'たぬ', 'tanu0'), s('Tanuzō', 'たぬぞう', 'tanu1'), s('Tetsubara', 'てつばら', 'tanu2')],
    base: { hp: 48, atk: 11, def: 12, spd: 6 }, moves: [['boulder'], ['guardian'], ['mend']] },
  { id: 'nekaze', script: 'hiragana', row: 'n', element: 'wind', folklore: 'Crow tengu',
    stages: [s('Nekaze', 'ねかぜ', 'nekaze0'), s('Nagaha', 'ながは', 'nekaze1'), s('Nokiwashi', 'のきわし', 'nekaze2')],
    base: { hp: 32, atk: 12, def: 7, spd: 15 }, moves: [['gale'], ['nightclaw'], ['shuriken']] },
  { id: 'hikari', script: 'hiragana', row: 'h', element: 'thunder', folklore: 'Thunder beast (raijū)',
    stages: [s('Hachi', 'はち', 'hikari0'), s('Hibiki', 'ひびき', 'hikari1'), s('Hōraijū', 'ほうらいじゅう', 'hikari2')],
    base: { hp: 36, atk: 14, def: 8, spd: 12 }, moves: [['thunder'], ['gale'], ['blossom']] },
  { id: 'mimi', script: 'hiragana', row: 'm', element: 'shadow', folklore: 'Two-tailed cat (nekomata)',
    stages: [s('Mimi', 'みみ', 'mimi0'), s('Matatabi', 'またたび', 'mimi1'), s('Mayonaka', 'まよなか', 'mimi2')],
    base: { hp: 34, atk: 13, def: 8, spd: 14 }, moves: [['nightclaw'], ['smoke'], ['kunai']] },
  { id: 'yozakura', script: 'hiragana', row: 'y', element: 'light', folklore: 'Cherry-tree spirit (kodama)',
    stages: [s('Yuzu', 'ゆず', 'yozakura0'), s('Yozakura', 'よざくら', 'yozakura1'), s('Yamabuki', 'やまぶき', 'yozakura2')],
    base: { hp: 40, atk: 10, def: 10, spd: 10 }, moves: [['blossom'], ['mend'], ['guardian']] },
  { id: 'riki', script: 'hiragana', row: 'r', element: 'earth', folklore: 'Shrine guardian lion (komainu)',
    stages: [s('Riki', 'りき', 'riki0'), s('Ryūseki', 'りゅうせき', 'riki1'), s('Raigōseki', 'らいごうせき', 'riki2')],
    base: { hp: 50, atk: 12, def: 14, spd: 5 }, moves: [['guardian'], ['boulder'], ['thunder']] },
  { id: 'wadachi', script: 'hiragana', row: 'w', element: 'water', folklore: 'Sea-wanderer (umibōzu)',
    stages: [s('Wakame', 'わかめ', 'wadachi0'), s('Wanizame', 'わにざめ', 'wadachi1'), s('Wadachi', 'わだち', 'wadachi2')],
    base: { hp: 46, atk: 12, def: 10, spd: 9 }, moves: [['torrent'], ['tide'], ['mend']] },
  // ── Arc 2: Norse / Germanic folklore, bound to KATAKANA rows ────────────
  { id: 'alv', script: 'katakana', row: 'a', element: 'light', folklore: 'Light elf (ljósálfr)',
    stages: [s('Alv', 'アルヴ', 'alv0'), s('Elvhild', 'エルヴヒルド', 'alv1'), s('Oskalv', 'オスカルヴ', 'alv2')],
    base: { hp: 38, atk: 12, def: 9, spd: 12 }, moves: [['blossom'], ['frostbite'], ['runebolt']] },
  { id: 'kobold', script: 'katakana', row: 'k', element: 'steel', folklore: 'Mine spirit (kobold)',
    stages: [s('Kobo', 'コボ', 'kobold0'), s('Kobold', 'コボルト', 'kobold1'), s('Kingkobold', 'キングコボルト', 'kobold2')],
    base: { hp: 44, atk: 12, def: 14, spd: 7 }, moves: [['axeCleave'], ['guardian'], ['boulder']] },
  { id: 'sleip', script: 'katakana', row: 's', element: 'wind', folklore: 'Eight-legged storm horse',
    stages: [s('Sleip', 'スレイプ', 'sleip0'), s('Sleipnar', 'スレイプナー', 'sleip1'), s('Sunhoof', 'サンフーフ', 'sleip2')],
    base: { hp: 36, atk: 13, def: 8, spd: 16 }, moves: [['gale'], ['shuriken'], ['runebolt']] },
  { id: 'troll', script: 'katakana', row: 't', element: 'earth', folklore: 'Mountain troll (and the house-tomte)',
    stages: [s('Tomte', 'トムテ', 'troll0'), s('Troll', 'トロル', 'troll1'), s('Tundratroll', 'ツンドラトロル', 'troll2')],
    base: { hp: 54, atk: 14, def: 12, spd: 4 }, moves: [['boulder'], ['axeCleave'], ['guardian']] },
  { id: 'nokk', script: 'katakana', row: 'n', element: 'water', folklore: 'Water-horse of the fjords (nøkk)',
    stages: [s('Nix', 'ニクス', 'nokk0'), s('Nøkk', 'ノック', 'nokk1'), s('Näcken', 'ネッケン', 'nokk2')],
    base: { hp: 40, atk: 12, def: 10, spd: 12 }, moves: [['torrent'], ['frostbite'], ['tide']] },
  { id: 'hrafn', script: 'katakana', row: 'h', element: 'shadow', folklore: 'Rune raven',
    stages: [s('Hrafn', 'フラフン', 'hrafn0'), s('Hrafnar', 'フラフナル', 'hrafn1'), s('Heidrafn', 'ヘイドラフン', 'hrafn2')],
    base: { hp: 32, atk: 14, def: 7, spd: 15 }, moves: [['nightclaw'], ['gale'], ['runebolt']] },
  { id: 'muspel', script: 'katakana', row: 'm', element: 'fire', folklore: 'Imp of the fire realm (Muspelheim)',
    stages: [s('Muspel', 'ムスペル', 'muspel0'), s('Muspelling', 'ムスペリング', 'muspel1'), s('Magmajarl', 'マグマヤール', 'muspel2')],
    base: { hp: 36, atk: 15, def: 8, spd: 11 }, moves: [['ember'], ['foxfire'], ['berserk']] },
  { id: 'yulecat', script: 'katakana', row: 'y', element: 'shadow', folklore: 'The Yule Cat (jólakötturinn)',
    stages: [s('Yulekit', 'ユールキット', 'yulecat0'), s('Yulecat', 'ユールキャット', 'yulecat1'), s('Yolnir', 'ヨルニル', 'yulecat2')],
    base: { hp: 38, atk: 13, def: 9, spd: 13 }, moves: [['nightclaw'], ['smoke'], ['frostbite']] },
  { id: 'ratatosk', script: 'katakana', row: 'r', element: 'thunder', folklore: 'World-tree squirrel messenger (Ratatoskr)',
    stages: [s('Rata', 'ラタ', 'ratatosk0'), s('Ratatosk', 'ラタトスク', 'ratatosk1'), s('Runetosk', 'ルーントスク', 'ratatosk2')],
    base: { hp: 34, atk: 13, def: 8, spd: 15 }, moves: [['thunder'], ['runebolt'], ['gale']] },
  { id: 'wyrm', script: 'katakana', row: 'w', element: 'water', folklore: 'Sea serpent (wyrm)',
    stages: [s('Wyrmling', 'ワームリング', 'wyrm0'), s('Wyrm', 'ワーム', 'wyrm1'), s('Worldwyrm', 'ワールドワーム', 'wyrm2')],
    base: { hp: 50, atk: 13, def: 11, spd: 8 }, moves: [['torrent'], ['frostbite'], ['tide']] },
];

const BY_ID = new Map(SPIRIT_FAMILIES.map((f) => [f.id, f]));

export function getFamily(id: string): SpiritFamily {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`Unknown spirit family: ${id}`);
  return f;
}

/** ん has no family of its own; it trains with its script's w-row spirit. */
export function familyForRow(row: KanaRow, script: Script = 'hiragana'): SpiritFamily {
  const r = row === 'nn' ? 'w' : row;
  return SPIRIT_FAMILIES.find((f) => f.script === script && f.row === r) as SpiritFamily;
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
