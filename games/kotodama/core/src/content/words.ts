// Everyday loanwords (gairaigo), taught in Arc 2 after the basic katakana. Words
// are multiple-choice only, never typed: "koohii / kōhī / kohi" would make typing
// a test of romanization rather than reading.
//
// Ids are stable save-file keys: never rename one.

export interface Word {
  id: string;
  /** Katakana spelling. */
  text: string;
  /** Wāpuro romaji with doubled long vowels (コーヒー = koohii). Shown, never typed. */
  romaji: string;
  meaning: string;
  /** Source language, shown as a fun fact on reveal. */
  from: string;
  /** Curriculum area that introduces it. */
  area: 'tower' | 'longship';
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

const build = (rows: Row[], area: Word['area']): Word[] =>
  rows.map(([text, romaji, meaning, from = 'English']) => ({ id: `w-${romaji}`, text, romaji, meaning, from, area }));

export const WORDS: readonly Word[] = [...build(TOWER, 'tower'), ...build(LONGSHIP, 'longship')];

const BY_ID = new Map(WORDS.map((w) => [w.id, w]));

export function getWord(id: string): Word {
  const w = BY_ID.get(id);
  if (!w) throw new Error(`Unknown word id: ${id}`);
  return w;
}

export function wordsForArea(area: Word['area']): Word[] {
  return WORDS.filter((w) => w.area === area);
}
