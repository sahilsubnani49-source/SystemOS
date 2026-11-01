import { toHiragana, toRomaji } from '../util/romaji';

// The N5 kanji the game teaches (Arc 3: Castle Capital), in ten groups. Each group is
// one spirit family and one step of the curriculum.
//
//   on:  on'yomi in KATAKANA (Chinese-derived readings)
//   kun: kun'yomi in hiragana, okurigana after a '.' (た.べる = 食べる)
//   meaning: the first entry is the one battles ask for, so it must be unique.
//
// Ids are `j-<char>` and are save-file keys: never change a character.

export type KanjiGroup =
  | 'numbers' | 'days' | 'time' | 'people' | 'body' | 'directions' | 'nature' | 'actions' | 'adjectives' | 'places';

export interface Kanji {
  id: string;
  char: string;
  meanings: string[];
  on: string[];
  kun: string[];
  group: KanjiGroup;
}

type Row = [char: string, meanings: string, on: string, kun: string];

const DATA: Record<KanjiGroup, Row[]> = {
  numbers: [
    ['一', 'one', 'イチ イツ', 'ひと ひと.つ'], ['二', 'two', 'ニ', 'ふた ふた.つ'], ['三', 'three', 'サン', 'み み.つ'],
    ['四', 'four', 'シ', 'よ よ.つ よん'], ['五', 'five', 'ゴ', 'いつ いつ.つ'], ['六', 'six', 'ロク', 'む む.つ'],
    ['七', 'seven', 'シチ', 'なな なな.つ'], ['八', 'eight', 'ハチ', 'や や.つ'], ['九', 'nine', 'キュウ ク', 'ここの ここの.つ'],
    ['十', 'ten', 'ジュウ', 'とお'], ['百', 'hundred', 'ヒャク', ''], ['千', 'thousand', 'セン', 'ち'],
    ['万', 'ten thousand', 'マン バン', ''], ['円', 'yen; circle', 'エン', 'まる.い'],
  ],
  days: [
    ['日', 'day; sun', 'ニチ ジツ', 'ひ か'], ['月', 'moon; month', 'ゲツ ガツ', 'つき'], ['火', 'fire', 'カ', 'ひ'],
    ['水', 'water', 'スイ', 'みず'], ['木', 'tree', 'モク ボク', 'き'], ['金', 'gold; money', 'キン コン', 'かね'],
    ['土', 'earth; soil', 'ド ト', 'つち'],
  ],
  time: [
    ['年', 'year', 'ネン', 'とし'], ['時', 'time; hour', 'ジ', 'とき'], ['分', 'minute; part', 'ブン フン', 'わ.かる わ.ける'],
    ['半', 'half', 'ハン', 'なか.ば'], ['今', 'now', 'コン キン', 'いま'], ['午', 'noon', 'ゴ', ''],
    ['前', 'before; front', 'ゼン', 'まえ'], ['後', 'after; behind', 'ゴ コウ', 'あと うし.ろ のち'], ['毎', 'every', 'マイ', ''],
    ['週', 'week', 'シュウ', ''], ['曜', 'weekday', 'ヨウ', ''],
  ],
  people: [
    ['人', 'person', 'ジン ニン', 'ひと'], ['男', 'man', 'ダン ナン', 'おとこ'], ['女', 'woman', 'ジョ ニョ', 'おんな'],
    ['子', 'child', 'シ ス', 'こ'], ['父', 'father', 'フ', 'ちち'], ['母', 'mother', 'ボ', 'はは'],
    ['友', 'friend', 'ユウ', 'とも'], ['先', 'ahead; previous', 'セン', 'さき'], ['生', 'life; birth', 'セイ ショウ', 'い.きる う.まれる なま'],
    ['学', 'study; learning', 'ガク', 'まな.ぶ'], ['名', 'name', 'メイ ミョウ', 'な'],
  ],
  body: [
    ['口', 'mouth', 'コウ ク', 'くち'], ['目', 'eye', 'モク', 'め'], ['耳', 'ear', 'ジ', 'みみ'],
    ['手', 'hand', 'シュ', 'て'], ['足', 'foot; leg', 'ソク', 'あし た.りる'], ['体', 'body', 'タイ', 'からだ'],
  ],
  directions: [
    ['上', 'up; above', 'ジョウ', 'うえ あ.がる'], ['下', 'down; below', 'カ ゲ', 'した さ.がる くだ.る'], ['左', 'left', 'サ', 'ひだり'],
    ['右', 'right', 'ウ ユウ', 'みぎ'], ['中', 'middle; inside', 'チュウ', 'なか'], ['外', 'outside', 'ガイ ゲ', 'そと'],
    ['東', 'east', 'トウ', 'ひがし'], ['西', 'west', 'セイ サイ', 'にし'], ['南', 'south', 'ナン', 'みなみ'],
    ['北', 'north', 'ホク', 'きた'], ['間', 'between; interval', 'カン ケン', 'あいだ ま'],
  ],
  nature: [
    ['山', 'mountain', 'サン', 'やま'], ['川', 'river', 'セン', 'かわ'], ['田', 'rice field', 'デン', 'た'],
    ['天', 'heaven', 'テン', 'あま'], ['気', 'spirit; mind', 'キ ケ', ''], ['雨', 'rain', 'ウ', 'あめ'],
    ['花', 'flower', 'カ', 'はな'], ['空', 'sky; empty', 'クウ', 'そら あ.く'],
  ],
  actions: [
    ['見', 'see', 'ケン', 'み.る'], ['行', 'go', 'コウ ギョウ', 'い.く おこな.う'], ['来', 'come', 'ライ', 'く.る'],
    ['出', 'exit; go out', 'シュツ', 'で.る だ.す'], ['入', 'enter', 'ニュウ', 'はい.る い.れる'], ['休', 'rest', 'キュウ', 'やす.む'],
    ['言', 'say', 'ゲン ゴン', 'い.う'], ['話', 'talk', 'ワ', 'はな.す はなし'], ['読', 'read', 'ドク', 'よ.む'],
    ['書', 'write', 'ショ', 'か.く'], ['聞', 'hear; ask', 'ブン', 'き.く'], ['食', 'eat', 'ショク', 'た.べる'],
    ['飲', 'drink', 'イン', 'の.む'], ['買', 'buy', 'バイ', 'か.う'], ['立', 'stand', 'リツ', 'た.つ'],
    ['会', 'meet', 'カイ', 'あ.う'],
  ],
  adjectives: [
    ['大', 'big', 'ダイ タイ', 'おお.きい'], ['小', 'small', 'ショウ', 'ちい.さい こ'], ['高', 'tall; expensive', 'コウ', 'たか.い'],
    ['安', 'cheap; peaceful', 'アン', 'やす.い'], ['新', 'new', 'シン', 'あたら.しい'], ['古', 'old', 'コ', 'ふる.い'],
    ['長', 'long', 'チョウ', 'なが.い'], ['多', 'many', 'タ', 'おお.い'], ['少', 'few', 'ショウ', 'すく.ない すこ.し'],
    ['早', 'early', 'ソウ', 'はや.い'], ['白', 'white', 'ハク', 'しろ しろ.い'],
  ],
  places: [
    ['国', 'country', 'コク', 'くに'], ['店', 'shop', 'テン', 'みせ'], ['駅', 'station', 'エキ', ''],
    ['社', 'company; shrine', 'シャ', 'やしろ'], ['校', 'school', 'コウ', ''], ['道', 'road; way', 'ドウ', 'みち'],
    ['車', 'car; vehicle', 'シャ', 'くるま'], ['電', 'electricity', 'デン', ''], ['本', 'book; origin', 'ホン', 'もと'],
    ['語', 'language; word', 'ゴ', 'かた.る'], ['門', 'gate', 'モン', 'かど'],
  ],
};

const split = (s: string) => s.split(' ').filter(Boolean);

export const KANJI_GROUPS = Object.keys(DATA) as KanjiGroup[];

export const KANJI: readonly Kanji[] = KANJI_GROUPS.flatMap((group) =>
  (DATA[group] as Row[]).map(([char, meanings, on, kun]) => ({
    id: `j-${char}`,
    char,
    meanings: meanings.split('; '),
    on: split(on),
    kun: split(kun),
    group,
  })),
);

const BY_ID = new Map(KANJI.map((k) => [k.id, k]));
const BY_CHAR = new Map(KANJI.map((k) => [k.char, k]));

export function getKanji(id: string): Kanji {
  const k = BY_ID.get(id);
  if (!k) throw new Error(`Unknown kanji id: ${id}`);
  return k;
}

export const kanjiByChar = (char: string) => BY_CHAR.get(char);

export function kanjiInGroup(group: KanjiGroup): Kanji[] {
  return KANJI.filter((k) => k.group === group);
}

/**
 * Every reading as it is SPOKEN, in hiragana: on'yomi converted from katakana, and
 * kun'yomi with their okurigana joined (た.べる → たべる). Bare kun stems (た) are
 * included too, since compounds use them (休日 is きゅうじつ, 田中 is たなか).
 */
export function kanjiReadings(k: Kanji): string[] {
  const out = new Set<string>();
  for (const on of k.on) out.add(toHiragana(on));
  for (const kun of k.kun) {
    out.add(kun.replace('.', ''));
    out.add(kun.split('.')[0] as string);
  }
  return [...out];
}

/** The reading said aloud and shown on reveal: the first kun'yomi if any, else on'yomi. */
export function primaryReading(k: Kanji): string {
  return k.kun[0] ? (k.kun[0] as string).replace('.', '') : toHiragana(k.on[0] as string);
}

/** Romaji accepted when TYPING a kanji's reading (purification). */
export function acceptedKanjiRomaji(k: Kanji): string[] {
  return kanjiReadings(k).map(toRomaji);
}

/**
 * Kanji learners mix up. Wrong answers for "which kanji means X?" come from here
 * first. Characters outside the N5 set (犬, 石...) are allowed as decoys.
 */
export const KANJI_LOOKALIKES: readonly string[][] = [
  ['日', '目', '白', '田', '旧'], ['木', '本', '休', '体', '末'], ['人', '入', '八', '大'], ['大', '犬', '太', '天'],
  ['土', '士', '王', '工'], ['千', '干', '午', '牛'], ['右', '石', '左', '名'], ['力', '刀', '九', '万'],
  ['口', '日', '田', '回'], ['手', '毛', '午', '千'], ['見', '貝', '目', '買'], ['話', '語', '読', '言'],
  ['聞', '間', '門', '開'], ['東', '車', '束', '果'], ['西', '四', '酉', '両'], ['男', '田', '町', '思'],
  ['子', '字', '学', '了'], ['今', '会', '金', '合'], ['生', '先', '牛', '星'], ['上', '下', '止', '土'],
  ['小', '少', '水', '木'], ['火', '大', '人', '灰'], ['母', '毎', '海', '女'], ['北', '比', '化', '此'],
  ['早', '草', '旱', '白'], ['天', '夫', '大', '矢'], ['雨', '両', '電', '雪'], ['気', '汽', '元', '丸'],
  ['飲', '食', '飯', '欠'], ['店', '広', '庄', '占'], ['校', '交', '木', '枚'], ['国', '困', '固', '玉'],
  ['友', '反', '左', '有'], ['出', '山', '凸', '缶'], ['円', '内', '丹', '同'], ['川', '州', '三', '小'],
  ['山', '出', '岩', '仙'], ['半', '羊', '平', '午'], ['長', '帳', '張', '辰'], ['道', '首', '通', '近'],
];

const LOOKS = new Map<string, Set<string>>();
for (const group of KANJI_LOOKALIKES) {
  for (const c of group) {
    const set = LOOKS.get(c) ?? new Set<string>();
    group.forEach((o) => o !== c && set.add(o));
    LOOKS.set(c, set);
  }
}

export function kanjiLookalikes(char: string): string[] {
  return [...(LOOKS.get(char) ?? [])];
}
