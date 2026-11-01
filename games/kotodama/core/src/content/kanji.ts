import { toHiragana, toRomaji } from '../util/romaji';

// The N5 kanji the game teaches (Arc 3: Castle Capital), in ten groups. Each group is
// one spirit family and one step of the curriculum.
//
//   on:  on'yomi in KATAKANA (Chinese-derived readings)
//   kun: kun'yomi in hiragana, okurigana after a '.' (た.べる = 食べる)
//   meaning: the first entry is the one battles ask for, so it must be unique.
//
// Ids are `j-<char>` and are save-file keys: never change a character.

export type KanjiLevel = 'N5' | 'N4';

export type KanjiGroup =
  // N5 (Arc 3: Castle Capital)
  | 'numbers' | 'days' | 'time' | 'people' | 'body' | 'directions' | 'nature' | 'actions' | 'adjectives' | 'places'
  // N4 (Arc 4: Mountain Temples)
  | 'n4family' | 'n4seasons' | 'n4food' | 'n4qualities' | 'n4study' | 'n4health' | 'n4movement' | 'n4town'
  | 'n4nature' | 'n4thought' | 'n4function';

export interface Kanji {
  id: string;
  char: string;
  meanings: string[];
  on: string[];
  kun: string[];
  group: KanjiGroup;
  level: KanjiLevel;
}

type Row = [char: string, meanings: string, on: string, kun: string];

const N5: Partial<Record<KanjiGroup, Row[]>> = {
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

// N4 kanji NOT already in the N5 set above.
const N4: Partial<Record<KanjiGroup, Row[]>> = {
  n4family: [
    ['兄', 'older brother', 'キョウ ケイ', 'あに'], ['姉', 'older sister', 'シ', 'あね'], ['弟', 'younger brother', 'ダイ テイ デ', 'おとうと'],
    ['妹', 'younger sister', 'マイ', 'いもうと'], ['私', 'I; private', 'シ', 'わたくし わたし'], ['家', 'house', 'カ ケ', 'いえ や'],
    ['族', 'tribe; family', 'ゾク', ''], ['親', 'parent', 'シン', 'おや した.しい'], ['主', 'master; main', 'シュ', 'ぬし おも'],
    ['者', 'someone', 'シャ', 'もの'], ['員', 'member', 'イン', ''], ['仕', 'serve', 'シ', 'つか.える'],
    ['医', 'medicine', 'イ', ''],
  ],
  n4seasons: [
    ['春', 'spring', 'シュン', 'はる'], ['夏', 'summer', 'カ', 'なつ'], ['秋', 'autumn', 'シュウ', 'あき'],
    ['冬', 'winter', 'トウ', 'ふゆ'], ['朝', 'morning', 'チョウ', 'あさ'], ['昼', 'daytime; noon meal', 'チュウ', 'ひる'],
    ['夜', 'night', 'ヤ', 'よる よ'], ['夕', 'evening', 'セキ', 'ゆう'], ['始', 'begin', 'シ', 'はじ.める はじ.まる'],
    ['終', 'end', 'シュウ', 'お.わる お.える'], ['急', 'hurry', 'キュウ', 'いそ.ぐ'], ['待', 'wait', 'タイ', 'ま.つ'],
  ],
  n4food: [
    ['肉', 'meat', 'ニク', ''], ['魚', 'fish', 'ギョ', 'さかな うお'], ['牛', 'cow', 'ギュウ', 'うし'],
    ['鳥', 'bird', 'チョウ', 'とり'], ['茶', 'tea', 'チャ サ', ''], ['飯', 'meal; cooked rice', 'ハン', 'めし'],
    ['料', 'fee; ingredients', 'リョウ', ''], ['理', 'reason; logic', 'リ', ''], ['味', 'taste', 'ミ', 'あじ'],
    ['品', 'goods', 'ヒン', 'しな'], ['売', 'sell', 'バイ', 'う.る'], ['物', 'thing', 'ブツ モツ', 'もの'],
  ],
  n4qualities: [
    ['赤', 'red', 'セキ', 'あか あか.い'], ['青', 'blue', 'セイ', 'あお あお.い'], ['黒', 'black', 'コク', 'くろ くろ.い'],
    ['色', 'colour', 'ショク シキ', 'いろ'], ['強', 'strong', 'キョウ', 'つよ.い'], ['弱', 'weak', 'ジャク', 'よわ.い'],
    ['重', 'heavy', 'ジュウ チョウ', 'おも.い'], ['軽', 'lightweight', 'ケイ', 'かる.い'], ['近', 'near', 'キン', 'ちか.い'],
    ['遠', 'far', 'エン', 'とお.い'], ['広', 'wide', 'コウ', 'ひろ.い'], ['悪', 'bad', 'アク', 'わる.い'],
  ],
  n4study: [
    ['勉', 'exertion', 'ベン', ''], ['教', 'teach', 'キョウ', 'おし.える'], ['習', 'learn', 'シュウ', 'なら.う'],
    ['研', 'sharpen', 'ケン', 'と.ぐ'], ['究', 'research', 'キュウ', 'きわ.める'], ['試', 'try; attempt', 'シ', 'ため.す こころ.みる'],
    ['験', 'examination', 'ケン', ''], ['答', 'answer', 'トウ', 'こた.える'], ['問', 'question', 'モン', 'と.う'],
    ['題', 'topic', 'ダイ', ''], ['文', 'writing; sentence', 'ブン モン', 'ふみ'], ['字', 'letter; character', 'ジ', 'あざ'],
    ['英', 'England; excellent', 'エイ', ''], ['漢', 'Han China', 'カン', ''],
  ],
  n4health: [
    ['心', 'heart; mind', 'シン', 'こころ'], ['頭', 'head', 'トウ ズ', 'あたま'], ['顔', 'face', 'ガン', 'かお'],
    ['声', 'voice', 'セイ', 'こえ'], ['病', 'illness', 'ビョウ', 'や.む やまい'], ['院', 'institution', 'イン', ''],
    ['死', 'death', 'シ', 'し.ぬ'],
  ],
  n4movement: [
    ['歩', 'walk', 'ホ', 'ある.く'], ['走', 'run', 'ソウ', 'はし.る'], ['起', 'wake up', 'キ', 'お.きる お.こす'],
    ['着', 'wear; arrive', 'チャク', 'き.る つ.く'], ['帰', 'return home', 'キ', 'かえ.る'], ['送', 'send', 'ソウ', 'おく.る'],
    ['運', 'carry; luck', 'ウン', 'はこ.ぶ'], ['転', 'roll over', 'テン', 'ころ.ぶ'], ['動', 'move', 'ドウ', 'うご.く'],
    ['通', 'pass through', 'ツウ', 'とお.る かよ.う'], ['止', 'stop', 'シ', 'と.まる と.める'], ['使', 'use', 'シ', 'つか.う'],
    ['持', 'hold', 'ジ', 'も.つ'], ['借', 'borrow', 'シャク', 'か.りる'], ['貸', 'lend', 'タイ', 'か.す'],
    ['写', 'copy', 'シャ', 'うつ.す'],
  ],
  n4town: [
    ['町', 'town', 'チョウ', 'まち'], ['村', 'village', 'ソン', 'むら'], ['京', 'capital', 'キョウ ケイ', ''],
    ['都', 'metropolis', 'ト ツ', 'みやこ'], ['館', 'public building', 'カン', ''], ['屋', 'roof; dealer', 'オク', 'や'],
    ['堂', 'hall', 'ドウ', ''], ['室', 'room', 'シツ', ''], ['場', 'place', 'ジョウ', 'ば'],
    ['地', 'ground', 'チ ジ', ''], ['図', 'diagram; map', 'ズ ト', 'はか.る'], ['世', 'generation; world', 'セ セイ', 'よ'],
    ['界', 'boundary', 'カイ', ''],
  ],
  n4nature: [
    ['海', 'sea', 'カイ', 'うみ'], ['風', 'wind', 'フウ フ', 'かぜ'], ['野', 'field', 'ヤ', 'の'],
    ['洋', 'ocean; Western', 'ヨウ', ''], ['光', 'light; shine', 'コウ', 'ひか.る ひかり'], ['林', 'grove', 'リン', 'はやし'],
    ['森', 'forest', 'シン', 'もり'], ['犬', 'dog', 'ケン', 'いぬ'],
  ],
  n4thought: [
    ['思', 'think', 'シ', 'おも.う'], ['考', 'consider', 'コウ', 'かんが.える'], ['知', 'know', 'チ', 'し.る'],
    ['歌', 'song', 'カ', 'うた うた.う'], ['音', 'sound', 'オン イン', 'おと ね'], ['楽', 'fun; music', 'ガク ラク', 'たの.しい'],
    ['映', 'reflect; project', 'エイ', 'うつ.る'], ['画', 'picture', 'ガ カク', ''], ['説', 'explain', 'セツ', 'と.く'],
    ['計', 'measure', 'ケイ', 'はか.る'], ['用', 'errand; use', 'ヨウ', 'もち.いる'], ['意', 'intention', 'イ', ''],
    ['注', 'pour; note', 'チュウ', 'そそ.ぐ'], ['別', 'separate', 'ベツ', 'わか.れる'],
  ],
  n4function: [
    ['自', 'self', 'ジ シ', 'みずか.ら'], ['同', 'same', 'ドウ', 'おな.じ'], ['事', 'matter', 'ジ', 'こと'],
    ['不', 'not; un-', 'フ ブ', ''], ['有', 'possess; exist', 'ユウ ウ', 'あ.る'], ['無', 'nothing', 'ム ブ', 'な.い'],
    ['以', 'by means of', 'イ', ''], ['方', 'direction; way', 'ホウ', 'かた'], ['発', 'depart; emit', 'ハツ ホツ', ''],
    ['開', 'open', 'カイ', 'ひら.く あ.く あ.ける'], ['作', 'make', 'サク サ', 'つく.る'], ['業', 'industry', 'ギョウ ゴウ', 'わざ'],
  ],
};

const split = (s: string) => s.split(' ').filter(Boolean);

const build = (level: KanjiLevel, data: Partial<Record<KanjiGroup, Row[]>>): Kanji[] =>
  (Object.keys(data) as KanjiGroup[]).flatMap((group) =>
    (data[group] as Row[]).map(([char, meanings, on, kun]) => ({
      id: `j-${char}`,
      char,
      meanings: meanings.split('; '),
      on: split(on),
      kun: split(kun),
      group,
      level,
    })),
  );

export const KANJI: readonly Kanji[] = [...build('N5', N5), ...build('N4', N4)];

/** Groups in teaching order (N5 first). */
export const KANJI_GROUPS: readonly KanjiGroup[] = [...new Set(KANJI.map((k) => k.group))];

export function kanjiGroupsAt(level: KanjiLevel): KanjiGroup[] {
  return KANJI_GROUPS.filter((g) => KANJI.find((k) => k.group === g)?.level === level);
}

export function kanjiAt(level: KanjiLevel): Kanji[] {
  return KANJI.filter((k) => k.level === level);
}

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
  // N4
  ['待', '持', '特', '時'], ['借', '昔', '惜', '措'], ['貸', '代', '袋', '資'], ['問', '間', '聞', '門'],
  ['鳥', '烏', '島', '馬'], ['夕', '名', '多', '外'], ['洋', '海', '羊', '注'], ['林', '森', '木', '村'],
  ['頭', '顔', '題', '願'], ['走', '起', '足', '赴'], ['送', '迷', '逆', '途'], ['着', '看', '差', '若'],
  ['運', '連', '軍', '道'], ['転', '伝', '軽', '輪'], ['重', '動', '働', '里'], ['野', '理', '里', '予'],
  ['試', '識', '式', '話'], ['験', '駅', '険', '検'], ['楽', '薬', '率', '業'], ['音', '暗', '意', '立'],
  ['思', '恩', '田', '心'], ['考', '老', '孝', '者'], ['知', '和', '短', '矢'], ['画', '面', '両', '西'],
  ['写', '与', '字', '学'], ['教', '数', '孝', '効'], ['答', '合', '塔', '茶'], ['文', '父', '交', '又'],
  ['英', '央', '映', '奥'], ['計', '許', '言', '針'], ['説', '話', '読', '税'], ['注', '柱', '住', '主'],
  ['別', '列', '刑', '則'], ['自', '目', '白', '百'], ['同', '向', '何', '洞'], ['事', '争', '書', '妻'],
  ['有', '右', '布', '友'], ['方', '万', '力', '刀'], ['開', '間', '閉', '関'], ['作', '昨', '件', '休'],
  ['町', '田', '丁', '男'], ['村', '材', '林', '杖'], ['京', '景', '涼', '高'], ['都', '部', '者', '郡'],
  ['館', '飯', '官', '舘'], ['屋', '室', '層', '尾'], ['場', '湯', '陽', '揚'], ['地', '池', '他', '也'],
  ['海', '毎', '悔', '梅'], ['兄', '見', '元', '児'], ['姉', '妹', '市', '柿'], ['弟', '第', '剃', '涕'],
  ['春', '香', '泰', '奉'], ['夏', '憂', '夜', '夢'], ['秋', '和', '利', '科'], ['冬', '各', '終', '久'],
  ['朝', '期', '潮', '月'], ['昼', '書', '尽', '屋'], ['肉', '内', '肖', '円'], ['魚', '角', '黒', '色'],
  ['赤', '亦', '変', '恋'], ['青', '清', '晴', '静'], ['強', '弱', '引', '張'], ['近', '遠', '辺', '返'],
  ['広', '店', '庄', '応'], ['悪', '亜', '恵', '憲'], ['勉', '免', '晩', '勤'], ['心', '必', '忘', '志'],
  ['声', '売', '吉', '壱'], ['病', '痛', '疲', '症'], ['死', '列', '歹', '残'], ['使', '便', '更', '例'],
  ['帰', '掃', '婦', '師'], ['光', '先', '元', '米'],
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
