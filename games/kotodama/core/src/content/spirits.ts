import type { Element } from './elements';
import { kanaWhere, type KanaRow, type Script } from './kana';
import { kanjiInGroup, type KanjiGroup } from './kanji';
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
  /** What this family embodies (and evolves from): a kana row, or a kanji group. */
  script: Script | 'kanji';
  /** Kana families: their row. */
  row?: KanaRow;
  /** Kanji families: their group. */
  kanjiGroup?: KanjiGroup;
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
  // ── Arc 3: castle-town spirits (tsukumogami and guardians), bound to KANJI groups.
  // Every Japanese name contains a kanji from its own group.
  { id: 'soroban', script: 'kanji', kanjiGroup: 'numbers', element: 'steel', folklore: 'Abacus-bead spirit (tsukumogami)',
    stages: [s('Hitotsudama', '一つ玉', 'soroban0'), s('Hyakudama', '百玉', 'soroban1'), s('Mandama', '万玉', 'soroban2')],
    base: { hp: 42, atk: 13, def: 13, spd: 8 }, moves: [['abacus'], ['inkBrush'], ['boulder']] },
  { id: 'koyomi', script: 'kanji', kanjiGroup: 'days', element: 'fire', folklore: 'Almanac spirit of the days',
    stages: [s('Hikoyomi', '日暦', 'koyomi0'), s('Tsukigoyomi', '月暦', 'koyomi1'), s('Kingoyomi', '金暦', 'koyomi2')],
    base: { hp: 36, atk: 14, def: 8, spd: 12 }, moves: [['ember'], ['sunflare'], ['foxfire']] },
  { id: 'hansho', script: 'kanji', kanjiGroup: 'time', element: 'thunder', folklore: 'Fire-watch bell (tsukumogami)',
    stages: [s('Hansho', '半鐘', 'hansho0'), s('Jisho', '時鐘', 'hansho1'), s('Shusho', '週鐘', 'hansho2')],
    base: { hp: 40, atk: 13, def: 10, spd: 10 }, moves: [['bellToll'], ['thunder'], ['runebolt']] },
  { id: 'hina', script: 'kanji', kanjiGroup: 'people', element: 'shadow', folklore: 'Hina dolls that walk at night',
    stages: [s('Kohina', '子雛', 'hina0'), s('Mebina', '女雛', 'hina1'), s('Obina', '男雛', 'hina2')],
    base: { hp: 34, atk: 13, def: 8, spd: 14 }, moves: [['inkBrush'], ['nightclaw'], ['smoke']] },
  { id: 'ashigaru', script: 'kanji', kanjiGroup: 'body', element: 'earth', folklore: 'Clockwork karakuri foot-soldier',
    stages: [s('Teguruma', '手車', 'ashigaru0'), s('Ashigaru', '足軽', 'ashigaru1'), s('Taijutsu', '体術', 'ashigaru2')],
    base: { hp: 50, atk: 14, def: 12, spd: 6 }, moves: [['boulder'], ['axeCleave'], ['guardian']] },
  { id: 'kazamuki', script: 'kanji', kanjiGroup: 'directions', element: 'wind', folklore: 'Weathervane spirit',
    stages: [s('Kitamuki', '北向き', 'kazamuki0'), s('Kochi', '東風', 'kazamuki1'), s('Nanboku', '南北', 'kazamuki2')],
    base: { hp: 34, atk: 13, def: 8, spd: 15 }, moves: [['gale'], ['shuriken'], ['inkBrush']] },
  { id: 'karakasa', script: 'kanji', kanjiGroup: 'nature', element: 'water', folklore: 'One-eyed paper umbrella (kasa-obake)',
    stages: [s('Amagasa', '雨傘', 'karakasa0'), s('Hanagasa', '花笠', 'karakasa1'), s('Tengasa', '天傘', 'karakasa2')],
    base: { hp: 40, atk: 12, def: 10, spd: 11 }, moves: [['umbrellaSpin'], ['torrent'], ['tide']] },
  { id: 'zori', script: 'kanji', kanjiGroup: 'actions', element: 'fire', folklore: 'Running straw sandal (bake-zori)',
    stages: [s('Detachi', '出立', 'zori0'), s('Tachimi', '立見', 'zori1'), s('Angya', '行脚', 'zori2')],
    base: { hp: 36, atk: 14, def: 8, spd: 14 }, moves: [['ember'], ['kunai'], ['sunflare']] },
  { id: 'kagami', script: 'kanji', kanjiGroup: 'adjectives', element: 'light', folklore: 'Mirror that shows true natures (ungaikyo)',
    stages: [s('Shirokagami', '白鏡', 'kagami0'), s('Kokagami', '古鏡', 'kagami1'), s('Okagami', '大鏡', 'kagami2')],
    base: { hp: 40, atk: 12, def: 12, spd: 9 }, moves: [['blossom'], ['inkBrush'], ['sunflare']] },
  { id: 'dosojin', script: 'kanji', kanjiGroup: 'places', element: 'steel', folklore: 'Roadside guardian of travellers (dosojin)',
    stages: [s('Monban', '門番', 'dosojin0'), s('Doso', '道祖', 'dosojin1'), s('Dosojin', '道祖神', 'dosojin2')],
    base: { hp: 52, atk: 12, def: 14, spd: 5 }, moves: [['guardian'], ['abacus'], ['boulder']] },
  // ── Arc 4: mountain yokai, bound to N4 KANJI groups. Every Japanese name
  // contains a kanji from its own group.
  { id: 'yamanba', script: 'kanji', kanjiGroup: 'n4family', element: 'earth', folklore: 'Mountain hag who guards the household (yamanba)',
    stages: [s('Iemori', '家守', 'yamanba0'), s('Ienushi', '家主', 'yamanba1'), s('Nushibaba', '主婆', 'yamanba2')],
    base: { hp: 50, atk: 13, def: 13, spd: 6 }, moves: [['boulder'], ['guardian'], ['echoCall']] },
  { id: 'yukionna', script: 'kanji', kanjiGroup: 'n4seasons', element: 'water', folklore: 'Snow woman of the winter passes (yuki-onna)',
    stages: [s('Yugiri', '夕霧', 'yukionna0'), s('Fuyume', '冬女', 'yukionna1'), s('Fuyuhime', '冬姫', 'yukionna2')],
    base: { hp: 38, atk: 14, def: 9, spd: 13 }, moves: [['frostBreath'], ['frostbite'], ['tide']] },
  { id: 'azukiarai', script: 'kanji', kanjiGroup: 'n4food', element: 'fire', folklore: 'Bean-washer of the mountain streams (azukiarai)',
    stages: [s('Chabozu', '茶坊主', 'azukiarai0'), s('Meshimori', '飯盛', 'azukiarai1'), s('Ajinushi', '味主', 'azukiarai2')],
    base: { hp: 40, atk: 13, def: 10, spd: 11 }, moves: [['ember'], ['sunflare'], ['echoCall']] },
  { id: 'nue', script: 'kanji', kanjiGroup: 'n4qualities', element: 'shadow', folklore: 'Night chimera of many parts (nue)',
    stages: [s('Kuroko', '黒子', 'nue0'), s('Akaoni', '赤鬼', 'nue1'), s('Aonue', '青鵺', 'nue2')],
    base: { hp: 44, atk: 15, def: 10, spd: 10 }, moves: [['nightclaw'], ['berserk'], ['thunder']] },
  { id: 'hitotsume', script: 'kanji', kanjiGroup: 'n4study', element: 'light', folklore: 'One-eyed temple boy (hitotsume-kozo)',
    stages: [s('Mojibo', '文字坊', 'hitotsume0'), s('Kanjibo', '漢字坊', 'hitotsume1'), s('Mondoki', '問答鬼', 'hitotsume2')],
    base: { hp: 36, atk: 13, def: 9, spd: 13 }, moves: [['inkBrush'], ['echoCall'], ['blossom']] },
  { id: 'noppera', script: 'kanji', kanjiGroup: 'n4health', element: 'shadow', folklore: 'Faceless wanderer (noppera-bo)',
    stages: [s('Zukinbo', '頭巾坊', 'noppera0'), s('Koemori', '声守', 'noppera1'), s('Shingan', '心眼', 'noppera2')],
    base: { hp: 40, atk: 13, def: 11, spd: 11 }, moves: [['nightclaw'], ['smoke'], ['inkBrush']] },
  { id: 'kamaitachi', script: 'kanji', kanjiGroup: 'n4movement', element: 'wind', folklore: 'Sickle weasels riding the wind (kamaitachi)',
    stages: [s('Hashiriitachi', '走鼬', 'kamaitachi0'), s('Korobiitachi', '転鼬', 'kamaitachi1'), s('Okuriitachi', '送り鼬', 'kamaitachi2')],
    base: { hp: 34, atk: 15, def: 8, spd: 16 }, moves: [['sickleWind'], ['gale'], ['shuriken']] },
  { id: 'warashi', script: 'kanji', kanjiGroup: 'n4town', element: 'steel', folklore: 'House-spirit child who brings fortune (zashiki-warashi)',
    stages: [s('Murawarashi', '村童', 'warashi0'), s('Yashikiwarashi', '屋敷童', 'warashi1'), s('Miyakowarashi', '都童', 'warashi2')],
    base: { hp: 42, atk: 12, def: 13, spd: 10 }, moves: [['guardian'], ['abacus'], ['echoCall']] },
  { id: 'inugami', script: 'kanji', kanjiGroup: 'n4nature', element: 'thunder', folklore: 'Loyal dog spirit (inugami)',
    stages: [s('Noinu', '野犬', 'inugami0'), s('Moriinu', '森犬', 'inugami1'), s('Inugami', '犬神', 'inugami2')],
    base: { hp: 42, atk: 14, def: 10, spd: 12 }, moves: [['thunder'], ['nightclaw'], ['runebolt']] },
  { id: 'yamabiko', script: 'kanji', kanjiGroup: 'n4thought', element: 'light', folklore: 'Mountain echo spirit (yamabiko)',
    stages: [s('Otohiko', '音彦', 'yamabiko0'), s('Utahiko', '歌彦', 'yamabiko1'), s('Gakuhiko', '楽彦', 'yamabiko2')],
    base: { hp: 36, atk: 13, def: 9, spd: 14 }, moves: [['echoCall'], ['blossom'], ['bellToll']] },
  { id: 'baku', script: 'kanji', kanjiGroup: 'n4function', element: 'water', folklore: 'Dream-eating beast (baku)',
    stages: [s('Mumu', '無夢', 'baku0'), s('Fumin', '不眠', 'baku1'), s('Gobaku', '業獏', 'baku2')],
    base: { hp: 52, atk: 12, def: 13, spd: 6 }, moves: [['torrent'], ['echoCall'], ['tide']] },
  // ── Arc 5: Norse rune spirits, bound to N3 KANJI groups. Same rule: every
  // Japanese name contains a kanji from its own group.
  { id: 'einherjar', script: 'kanji', kanjiGroup: 'n3conflict', element: 'steel', folklore: "Odin's chosen dead warriors (einherjar)",
    stages: [s('Heirei', '兵霊', 'einherjar0'), s('Senrei', '戦霊', 'einherjar1'), s('Bushin', '武神', 'einherjar2')],
    base: { hp: 46, atk: 13, def: 13, spd: 7 }, moves: [['axeCleave'], ['shieldBash'], ['runeScroll']] },
  { id: 'valkyrja', script: 'kanji', kanjiGroup: 'n3society', element: 'light', folklore: 'Choosers of the slain (valkyrja)',
    stages: [s('Erime', '選女', 'valkyrja0'), s('Erihime', '選姫', 'valkyrja1'), s('Ōsenki', '王選姫', 'valkyrja2')],
    base: { hp: 34, atk: 14, def: 9, spd: 15 }, moves: [['valkyrieDive'], ['blossom'], ['runeScroll']] },
  { id: 'mare', script: 'kanji', kanjiGroup: 'n3emotion', element: 'shadow', folklore: 'The mare that rides sleepers into nightmares',
    stages: [s('Himu', '悲夢', 'mare0'), s('Domu', '怒夢', 'mare1'), s('Kyōmu', '驚夢', 'mare2')],
    base: { hp: 36, atk: 13, def: 10, spd: 13 }, moves: [['nightclaw'], ['runeScroll'], ['berserk']] },
  { id: 'dvergr', script: 'kanji', kanjiGroup: 'n3work', element: 'fire', folklore: 'Dwarf smiths under the mountain (dvergr)',
    stages: [s('Shokunin', '職人', 'dvergr0'), s('Eikō', '営工', 'dvergr1'), s('Keishō', '経匠', 'dvergr2')],
    base: { hp: 48, atk: 13, def: 14, spd: 5 }, moves: [['forgeHammer'], ['guardian'], ['runeScroll']] },
  { id: 'jotunn', script: 'kanji', kanjiGroup: 'n3weather', element: 'earth', folklore: 'Frost giants of Jötunheim (jötnar)',
    stages: [s('Hyōko', '氷子', 'jotunn0'), s('Hyōkyojin', '氷巨人', 'jotunn1'), s('Sekkyoshin', '雪巨神', 'jotunn2')],
    base: { hp: 52, atk: 14, def: 12, spd: 4 }, moves: [['frostBreath'], ['boulder'], ['runeScroll']] },
  { id: 'selkie', script: 'kanji', kanjiGroup: 'n3action', element: 'water', folklore: 'Seal-folk who shed their skins (selkie)',
    stages: [s('Oyogiko', '泳子', 'selkie0'), s('Naminori', '波乗', 'selkie1'), s('Hikai', '飛海', 'selkie2')],
    base: { hp: 38, atk: 12, def: 11, spd: 13 }, moves: [['torrent'], ['sealSong'], ['tide']] },
  { id: 'huldra', script: 'kanji', kanjiGroup: 'n3comm', element: 'wind', folklore: 'Forest siren with a hidden tail (huldra)',
    stages: [s('Tsutaeme', '伝女', 'huldra0'), s('Tsugeme', '告女', 'huldra1'), s('Hōhime', '報姫', 'huldra2')],
    base: { hp: 34, atk: 13, def: 10, spd: 15 }, moves: [['gale'], ['runeScroll'], ['sickleWind']] },
  { id: 'myling', script: 'kanji', kanjiGroup: 'n3change', element: 'shadow', folklore: 'Restless child-ghost of the past (myling)',
    stages: [s('Kako', '過子', 'myling0'), s('Kyorei', '去霊', 'myling1'), s('Mirenrei', '未練霊', 'myling2')],
    base: { hp: 32, atk: 14, def: 9, spd: 14 }, moves: [['smoke'], ['nightclaw'], ['runeScroll']] },
  { id: 'volva', script: 'kanji', kanjiGroup: 'n3abstract', element: 'light', folklore: 'Seeress who reads fate in runes (völva)',
    stages: [s('Jutsume', '術女', 'volva0'), s('Musubime', '結女', 'volva1'), s('Ingafu', '因果巫', 'volva2')],
    base: { hp: 36, atk: 13, def: 11, spd: 12 }, moves: [['runeScroll'], ['inkBrush'], ['runebolt']] },
  { id: 'nykr', script: 'kanji', kanjiGroup: 'n3travel', element: 'thunder', folklore: 'Shape-shifting water horse of fords and bridges (nykr)',
    stages: [s('Funauma', '船馬', 'nykr0'), s('Kyōba', '橋馬', 'nykr1'), s('Tabikoma', '旅駒', 'nykr2')],
    base: { hp: 40, atk: 14, def: 10, spd: 14 }, moves: [['thunder'], ['valkyrieDive'], ['runeScroll']] },
];

const BY_ID = new Map(SPIRIT_FAMILIES.map((f) => [f.id, f]));

export function getFamily(id: string): SpiritFamily {
  const f = BY_ID.get(id);
  if (!f) throw new Error(`Unknown spirit family: ${id}`);
  return f;
}

/**
 * The study items a family embodies: its kana row (w-row families also take ん),
 * or its kanji group. Evolution reads mastery of exactly these, and a wild member's
 * true name is drawn from them.
 */
export function familyItemIds(f: SpiritFamily): string[] {
  if (f.kanjiGroup) return kanjiInGroup(f.kanjiGroup).map((k) => k.id);
  const rows: KanaRow[] = f.row === 'w' ? ['w', 'nn'] : [f.row as KanaRow];
  return rows.flatMap((row) => kanaWhere({ script: f.script as Script, row, kind: 'basic' }).map((k) => k.id));
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
