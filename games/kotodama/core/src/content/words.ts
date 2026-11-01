import { toRomaji } from '../util/romaji';

// Words the game teaches as whole units. Multiple-choice only, never typed:
// "koohii / kōhī / kohi" would make typing a test of romanization, not reading.
//   - Loanwords (Arc 2): katakana gairaigo. Id `w-<romaji>`. Reading = spelling.
//   - Vocabulary (Arc 3): N5 words written with kanji. Id `v-<romaji>`.
// Ids are stable save-file keys: never rename one.

export type WordArea =
  | 'tower' | 'longship' // Arc 2 loanwords
  | 'castle' | 'market' | 'teahouse' | 'gardens' | 'keep' // Arc 3 N5
  | 'foothills' | 'village' | 'monastery' | 'forest' | 'peaks'; // Arc 4 N4

export interface Word {
  id: string;
  kind: 'loanword' | 'vocab';
  /** How it is written (katakana, or kanji + okurigana). */
  text: string;
  /** How it is read, in kana. Equals `text` for loanwords. */
  reading: string;
  /** Wāpuro romaji of the reading (コーヒー = koohii). Shown, never typed. */
  romaji: string;
  meaning: string;
  /** Loanwords: source language, shown as a fun fact. Vocab: 'Japanese'. */
  from: string;
  /** Curriculum area that introduces it. */
  area: WordArea;
}

type Row = [text: string, romaji: string, meaning: string, from?: string];

const TOWER: Row[] = [
  ['パン', 'pan', 'bread', 'Portuguese'], ['テレビ', 'terebi', 'television'], ['カメラ', 'kamera', 'camera'],
  ['ホテル', 'hoteru', 'hotel'], ['バス', 'basu', 'bus'], ['タクシー', 'takushii', 'taxi'],
  ['コーヒー', 'koohii', 'coffee', 'Dutch'], ['ジュース', 'juusu', 'juice'], ['ケーキ', 'keeki', 'cake'],
  ['アイス', 'aisu', 'ice cream'], ['ピアノ', 'piano', 'piano'], ['ギター', 'gitaa', 'guitar'],
  ['ノート', 'nooto', 'notebook'], ['ペン', 'pen', 'pen'], ['テスト', 'tesuto', 'test'],
  ['ゲーム', 'geemu', 'game'], ['ニュース', 'nyuusu', 'news'], ['メール', 'meeru', 'email'],
  ['パソコン', 'pasokon', 'computer (PC)'], ['スマホ', 'sumaho', 'smartphone'], ['レストラン', 'resutoran', 'restaurant'],
  ['トイレ', 'toire', 'toilet'], ['ドア', 'doa', 'door'], ['ベッド', 'beddo', 'bed'],
  ['コップ', 'koppu', 'cup', 'Dutch'], ['サッカー', 'sakkaa', 'soccer'], ['スポーツ', 'supootsu', 'sports'],
  ['チーズ', 'chiizu', 'cheese'], ['バター', 'bataa', 'butter'], ['ミルク', 'miruku', 'milk'],
];

const LONGSHIP: Row[] = [
  ['ビール', 'biiru', 'beer', 'Dutch'], ['ワイン', 'wain', 'wine'], ['アルバイト', 'arubaito', 'part-time job', 'German'],
  ['エレベーター', 'erebeetaa', 'elevator'], ['コンビニ', 'konbini', 'convenience store'], ['スーパー', 'suupaa', 'supermarket'],
  ['デパート', 'depaato', 'department store'], ['シャツ', 'shatsu', 'shirt'], ['スカート', 'sukaato', 'skirt'],
  ['ズボン', 'zubon', 'trousers', 'French'], ['ネクタイ', 'nekutai', 'necktie'], ['ボタン', 'botan', 'button', 'Portuguese'],
  ['カレンダー', 'karendaa', 'calendar'], ['ラジオ', 'rajio', 'radio'], ['ビデオ', 'bideo', 'video'],
  ['インターネット', 'intaanetto', 'internet'], ['コンピューター', 'konpyuutaa', 'computer'], ['プール', 'puuru', 'swimming pool'],
  ['ハンバーガー', 'hanbaagaa', 'hamburger'], ['サラダ', 'sarada', 'salad'], ['スープ', 'suupu', 'soup'],
  ['チョコレート', 'chokoreeto', 'chocolate'], ['アメリカ', 'amerika', 'America'], ['イギリス', 'igirisu', 'Britain', 'Portuguese'],
  ['フランス', 'furansu', 'France'], ['ドイツ', 'doitsu', 'Germany', 'Dutch'], ['ノルウェー', 'noruwee', 'Norway'],
  ['カナダ', 'kanada', 'Canada'], ['マラソン', 'marason', 'marathon'], ['ホッチキス', 'hotchikisu', 'stapler'],
];

const build = (rows: Row[], area: WordArea): Word[] =>
  rows.map(([text, romaji, meaning, from = 'English']) => ({ id: `w-${romaji}`, kind: 'loanword', text, reading: text, romaji, meaning, from, area }));

// ── Arc 3: N5 vocabulary. Every kanji used must already be taught by the word's
// area or an earlier one (checked by arc3.test.ts). ─────────────────────────
type VocabRow = [text: string, reading: string, meaning: string];

const VOCAB: Record<Exclude<WordArea, 'tower' | 'longship'>, VocabRow[]> = {
  // numbers + days
  castle: [
    ['一つ', 'ひとつ', 'one (thing)'], ['二つ', 'ふたつ', 'two (things)'], ['三つ', 'みっつ', 'three (things)'],
    ['四日', 'よっか', 'the 4th (day)'], ['五日', 'いつか', 'the 5th (day)'], ['十日', 'とおか', 'the 10th (day)'],
    ['四月', 'しがつ', 'April'], ['七月', 'しちがつ', 'July'], ['九月', 'くがつ', 'September'],
    ['百円', 'ひゃくえん', '100 yen'], ['千円', 'せんえん', '1,000 yen'], ['一万円', 'いちまんえん', '10,000 yen'],
    ['お金', 'おかね', 'money'],
  ],
  // + time + people
  market: [
    ['日曜日', 'にちようび', 'Sunday'], ['月曜日', 'げつようび', 'Monday'], ['火曜日', 'かようび', 'Tuesday'],
    ['水曜日', 'すいようび', 'Wednesday'], ['木曜日', 'もくようび', 'Thursday'], ['金曜日', 'きんようび', 'Friday'],
    ['土曜日', 'どようび', 'Saturday'], ['毎日', 'まいにち', 'every day'], ['毎週', 'まいしゅう', 'every week'],
    ['今日', 'きょう', 'today'], ['今年', 'ことし', 'this year'], ['今月', 'こんげつ', 'this month'],
    ['今週', 'こんしゅう', 'this week'], ['午前', 'ごぜん', 'a.m. (morning)'], ['午後', 'ごご', 'p.m. (afternoon)'],
    ['半分', 'はんぶん', 'half'], ['一人', 'ひとり', 'one person; alone'], ['二人', 'ふたり', 'two people'],
    ['男の子', 'おとこのこ', 'boy'], ['女の子', 'おんなのこ', 'girl'], ['先生', 'せんせい', 'teacher'],
    ['学生', 'がくせい', 'student'], ['先月', 'せんげつ', 'last month'], ['先週', 'せんしゅう', 'last week'],
    ['名前', 'なまえ', 'name'], ['子ども', 'こども', 'child (kid)'],
  ],
  // + body + directions
  teahouse: [
    ['上手', 'じょうず', 'skilful'], ['下手', 'へた', 'unskilful'], ['右手', 'みぎて', 'right hand'],
    ['左手', 'ひだりて', 'left hand'], ['人口', 'じんこう', 'population'], ['北口', 'きたぐち', 'north exit'],
    ['南口', 'みなみぐち', 'south exit'], ['東口', 'ひがしぐち', 'east exit'], ['西口', 'にしぐち', 'west exit'],
    ['中学生', 'ちゅうがくせい', 'junior-high student'], ['時間', 'じかん', 'time (duration)'], ['一時間', 'いちじかん', 'one hour'],
    ['一週間', 'いっしゅうかん', 'one week (period)'], ['目上', 'めうえ', 'one\'s superior'], ['上下', 'じょうげ', 'up and down'],
  ],
  // + nature + actions
  gardens: [
    ['天気', 'てんき', 'weather'], ['花見', 'はなみ', 'flower viewing'], ['火山', 'かざん', 'volcano'],
    ['空気', 'くうき', 'air'], ['人気', 'にんき', 'popularity'], ['気分', 'きぶん', 'mood'],
    ['休日', 'きゅうじつ', 'holiday'], ['休み', 'やすみ', 'rest; day off'], ['一休み', 'ひとやすみ', 'a short break'],
    ['飲み水', 'のみみず', 'drinking water'], ['出口', 'でぐち', 'exit'], ['入口', 'いりぐち', 'entrance'],
    ['来年', 'らいねん', 'next year'], ['来月', 'らいげつ', 'next month'], ['来週', 'らいしゅう', 'next week'],
    ['会話', 'かいわ', 'conversation'], ['読書', 'どくしょ', 'reading (books)'], ['外出', 'がいしゅつ', 'going out'],
  ],
  // + adjectives + places
  keep: [
    ['大学', 'だいがく', 'university'], ['大人', 'おとな', 'adult'], ['小学生', 'しょうがくせい', 'elementary pupil'],
    ['高校', 'こうこう', 'high school'], ['学校', 'がっこう', 'school'], ['外国', 'がいこく', 'foreign country'],
    ['外国人', 'がいこくじん', 'foreigner'], ['日本', 'にほん', 'Japan'], ['日本語', 'にほんご', 'Japanese (language)'],
    ['電車', 'でんしゃ', 'train'], ['電気', 'でんき', 'electricity; lights'], ['電話', 'でんわ', 'telephone'],
    ['会社', 'かいしゃ', 'company'], ['社長', 'しゃちょう', 'company president'], ['店長', 'てんちょう', 'store manager'],
    ['新年', 'しんねん', 'New Year'], ['古本', 'ふるほん', 'second-hand book'], ['少し', 'すこし', 'a little'],
    ['白い', 'しろい', 'white (adj.)'], ['高い', 'たかい', 'tall; expensive (adj.)'], ['安い', 'やすい', 'cheap (adj.)'],
    ['新しい', 'あたらしい', 'new (adj.)'], ['古い', 'ふるい', 'old (adj.)'], ['大きい', 'おおきい', 'big (adj.)'],
    ['小さい', 'ちいさい', 'small (adj.)'], ['長い', 'ながい', 'long (adj.)'], ['早い', 'はやい', 'early (adj.)'],
    ['中国', 'ちゅうごく', 'China'], ['入学', 'にゅうがく', 'starting school'], ['国語', 'こくご', 'national language (class)'],
  ],
  // ── Arc 4: N4. Same rule: only kanji taught by this area or earlier. ──
  // + family + seasons
  foothills: [
    ['お兄さん', 'おにいさん', 'older brother (polite)'], ['お姉さん', 'おねえさん', 'older sister (polite)'], ['兄弟', 'きょうだい', 'siblings'],
    ['姉妹', 'しまい', 'sisters'], ['家族', 'かぞく', 'family'], ['医者', 'いしゃ', 'doctor'],
    ['会社員', 'かいしゃいん', 'office worker'], ['店員', 'てんいん', 'shop clerk'], ['主人', 'しゅじん', 'husband; master'],
    ['春休み', 'はるやすみ', 'spring break'], ['夏休み', 'なつやすみ', 'summer holidays'], ['冬休み', 'ふゆやすみ', 'winter break'],
    ['今朝', 'けさ', 'this morning'], ['毎朝', 'まいあさ', 'every morning'], ['昼休み', 'ひるやすみ', 'lunch break'],
    ['今夜', 'こんや', 'tonight'], ['夜中', 'よなか', 'middle of the night'], ['始める', 'はじめる', 'to begin (something)'],
    ['終わる', 'おわる', 'to end'], ['急ぐ', 'いそぐ', 'to hurry'], ['待つ', 'まつ', 'to wait'],
  ],
  // + food + qualities
  village: [
    ['牛肉', 'ぎゅうにく', 'beef'], ['お茶', 'おちゃ', 'green tea'], ['茶色', 'ちゃいろ', 'brown'],
    ['料理', 'りょうり', 'cooking; cuisine'], ['ご飯', 'ごはん', 'cooked rice; a meal'], ['食べ物', 'たべもの', 'food'],
    ['飲み物', 'のみもの', 'a drink'], ['品物', 'しなもの', 'goods; merchandise'], ['売る', 'うる', 'to sell'],
    ['買い物', 'かいもの', 'shopping'], ['赤い', 'あかい', 'red (adj.)'], ['青い', 'あおい', 'blue (adj.)'],
    ['黒い', 'くろい', 'black (adj.)'], ['強い', 'つよい', 'strong (adj.)'], ['弱い', 'よわい', 'weak (adj.)'],
    ['重い', 'おもい', 'heavy (adj.)'], ['軽い', 'かるい', 'light (adj.)'], ['近い', 'ちかい', 'near (adj.)'],
    ['遠い', 'とおい', 'far (adj.)'], ['広い', 'ひろい', 'wide; spacious (adj.)'], ['悪い', 'わるい', 'bad (adj.)'],
  ],
  // + study + health
  monastery: [
    ['勉強', 'べんきょう', 'study'], ['教える', 'おしえる', 'to teach'], ['習う', 'ならう', 'to learn (from someone)'],
    ['研究', 'けんきゅう', 'research'], ['試験', 'しけん', 'examination'], ['答え', 'こたえ', 'an answer'],
    ['問題', 'もんだい', 'problem; question'], ['文字', 'もじ', 'written character'], ['英語', 'えいご', 'English (language)'],
    ['漢字', 'かんじ', 'kanji'], ['文学', 'ぶんがく', 'literature'], ['病気', 'びょうき', 'illness'],
    ['病院', 'びょういん', 'hospital'], ['大学院', 'だいがくいん', 'graduate school'], ['死ぬ', 'しぬ', 'to die'],
  ],
  // + movement + nature
  forest: [
    ['歩く', 'あるく', 'to walk'], ['走る', 'はしる', 'to run'], ['起きる', 'おきる', 'to get up'],
    ['着る', 'きる', 'to wear'], ['帰る', 'かえる', 'to go home'], ['送る', 'おくる', 'to send'],
    ['運動', 'うんどう', 'exercise'], ['運転', 'うんてん', 'driving'], ['動く', 'うごく', 'to move'],
    ['止まる', 'とまる', 'to come to a stop'], ['使う', 'つかう', 'to use'], ['持つ', 'もつ', 'to hold'],
    ['借りる', 'かりる', 'to borrow'], ['貸す', 'かす', 'to lend'], ['西洋', 'せいよう', 'the West'],
    ['子犬', 'こいぬ', 'puppy'], ['海外', 'かいがい', 'overseas'],
  ],
  // + town + thought + function
  peaks: [
    ['東京', 'とうきょう', 'Tokyo'], ['京都', 'きょうと', 'Kyoto'], ['図書館', 'としょかん', 'library'],
    ['映画館', 'えいがかん', 'cinema'], ['本屋', 'ほんや', 'bookshop'], ['食堂', 'しょくどう', 'dining hall'],
    ['教室', 'きょうしつ', 'classroom'], ['会場', 'かいじょう', 'venue'], ['地図', 'ちず', 'map'],
    ['世界', 'せかい', 'the world'], ['思う', 'おもう', 'to think'], ['考える', 'かんがえる', 'to consider'],
    ['知る', 'しる', 'to come to know'], ['歌う', 'うたう', 'to sing'], ['音楽', 'おんがく', 'music'],
    ['楽しい', 'たのしい', 'fun; enjoyable (adj.)'], ['映画', 'えいが', 'film'], ['時計', 'とけい', 'clock; watch'],
    ['用事', 'ようじ', 'errand'], ['注意', 'ちゅうい', 'caution'], ['意味', 'いみ', 'meaning'],
    ['自分', 'じぶん', 'oneself'], ['同じ', 'おなじ', 'the same'], ['仕事', 'しごと', 'job; work'],
    ['有名', 'ゆうめい', 'famous'], ['無理', 'むり', 'impossible; unreasonable'], ['以上', 'いじょう', 'or more; above'],
    ['出発', 'しゅっぱつ', 'departure'], ['開ける', 'あける', 'to open (something)'], ['作る', 'つくる', 'to make'],
    ['大事', 'だいじ', 'important'],
  ],
};

const buildVocab = (area: keyof typeof VOCAB): Word[] =>
  VOCAB[area].map(([text, reading, meaning]) => {
    const romaji = toRomaji(reading);
    return { id: `v-${romaji}`, kind: 'vocab', text, reading, romaji, meaning, from: 'Japanese', area };
  });

export const LOANWORDS: readonly Word[] = [...build(TOWER, 'tower'), ...build(LONGSHIP, 'longship')];
export const VOCABULARY: readonly Word[] = (Object.keys(VOCAB) as (keyof typeof VOCAB)[]).flatMap(buildVocab);
export const WORDS: readonly Word[] = [...LOANWORDS, ...VOCABULARY];

const BY_ID = new Map(WORDS.map((w) => [w.id, w]));

export function getWord(id: string): Word {
  const w = BY_ID.get(id);
  if (!w) throw new Error(`Unknown word id: ${id}`);
  return w;
}

export function wordsForArea(area: WordArea): Word[] {
  return WORDS.filter((w) => w.area === area);
}
