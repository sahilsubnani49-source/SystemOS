import { toRomaji } from '../util/romaji';

// Words the game teaches as whole units. Multiple-choice only, never typed:
// "koohii / kōhī / kohi" would make typing a test of romanization, not reading.
//   - Loanwords (Arc 2): katakana gairaigo. Id `w-<romaji>`. Reading = spelling.
//   - Vocabulary (Arc 3): N5 words written with kanji. Id `v-<romaji>`.
// Ids are stable save-file keys: never rename one.

export type WordArea =
  | 'tower' | 'longship' // Arc 2 loanwords
  | 'castle' | 'market' | 'teahouse' | 'gardens' | 'keep' // Arc 3 N5
  | 'foothills' | 'village' | 'monastery' | 'forest' | 'peaks' // Arc 4 N4
  | 'coast' | 'glacier' | 'forge' | 'valor' | 'runeforge' // Arc 5 N3
  | WellArea // The Well of Old Tales (hiragana only)
  | LessonArea; // The Terakoya, Castle Town's school (kana only)

/**
 * The Terakoya's eleven classrooms, in the order the two standard beginners'
 * courses teach (Genki I-II and Minna no Nihongo I-II): rooms 1-6 are the N5
 * year, rooms 7-11 the N4 year. Only the ORDER and the grammar points follow
 * the courses; every word choice and sentence here was written for this game.
 */
export type LessonArea =
  | 'lesson1' | 'lesson2' | 'lesson3' | 'lesson4' | 'lesson5' | 'lesson6' // N5 wing
  | 'lesson7' | 'lesson8' | 'lesson9' | 'lesson10' | 'lesson11'; // N4 wing

/** The four floors of the Well of Old Tales, the hiragana-only dungeon under Sakura Village. */
export type WellArea = 'well1' | 'well2' | 'well3' | 'well4';

export interface Word {
  id: string;
  kind: 'loanword' | 'vocab' | 'native';
  /** How it is written (katakana, kanji + okurigana, or plain hiragana for native words). */
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

const VOCAB: Record<Exclude<WordArea, 'tower' | 'longship' | WellArea | LessonArea>, VocabRow[]> = {
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
  // ── Arc 5: N3. Same rule: only kanji taught by this area or earlier. ──
  // + conflict + society
  coast: [
    ['戦争', 'せんそう', 'war'], ['戦う', 'たたかう', 'to fight'], ['勝つ', 'かつ', 'to win'],
    ['負ける', 'まける', 'to lose (a match)'], ['守る', 'まもる', 'to protect'], ['攻める', 'せめる', 'to attack'],
    ['危ない', 'あぶない', 'dangerous (adj.)'], ['危険', 'きけん', 'danger'], ['破る', 'やぶる', 'to break (a promise); to tear'],
    ['倒れる', 'たおれる', 'to collapse'], ['軍人', 'ぐんじん', 'soldier (military person)'], ['勝負', 'しょうぶ', 'contest; match'],
    ['国民', 'こくみん', 'citizens of a nation'], ['女王', 'じょおう', 'queen'], ['王子', 'おうじ', 'prince'],
    ['政治', 'せいじ', 'politics'], ['政府', 'せいふ', 'the government'], ['治る', 'なおる', 'to recover (from illness)'],
    ['決める', 'きめる', 'to decide'], ['会議', 'かいぎ', 'a meeting'], ['選ぶ', 'えらぶ', 'to choose'],
    ['選手', 'せんしゅ', 'athlete'], ['歴史', 'れきし', 'history'], ['自治', 'じち', 'self-government'],
  ],
  // + emotion + work
  glacier: [
    ['感じる', 'かんじる', 'to feel'], ['感情', 'かんじょう', 'emotions'], ['怒る', 'おこる', 'to get angry'],
    ['喜ぶ', 'よろこぶ', 'to be glad'], ['悲しい', 'かなしい', 'sad (adj.)'], ['笑う', 'わらう', 'to laugh'],
    ['泣く', 'なく', 'to cry'], ['恥ずかしい', 'はずかしい', 'embarrassed (adj.)'], ['苦しい', 'くるしい', 'painful (adj.)'],
    ['苦い', 'にがい', 'bitter (adj.)'], ['幸せ', 'しあわせ', 'happiness'], ['願う', 'ねがう', 'to wish for'],
    ['疲れる', 'つかれる', 'to get tired'], ['驚く', 'おどろく', 'to be surprised'], ['働く', 'はたらく', 'to work (labour)'],
    ['給料', 'きゅうりょう', 'salary'], ['費用', 'ひよう', 'cost; expenses'], ['払う', 'はらう', 'to pay'],
    ['物価', 'ぶっか', 'prices of goods'], ['生産', 'せいさん', 'production'], ['商品', 'しょうひん', 'product (for sale)'],
    ['商売', 'しょうばい', 'trade; business'], ['経済', 'けいざい', 'the economy'], ['経験', 'けいけん', 'experience'],
    ['営業', 'えいぎょう', 'sales; business operations'], ['職業', 'しょくぎょう', 'occupation'], ['貯金', 'ちょきん', 'savings'],
  ],
  // + weather + action
  forge: [
    ['晴れ', 'はれ', 'sunny weather'], ['晴れる', 'はれる', 'to clear up (weather)'], ['寒い', 'さむい', 'cold (adj.)'],
    ['暑い', 'あつい', 'hot (adj.)'], ['暖かい', 'あたたかい', 'warm (adj.)'], ['冷たい', 'つめたい', 'cold to the touch (adj.)'],
    ['季節', 'きせつ', 'season of the year'], ['打つ', 'うつ', 'to strike'], ['投げる', 'なげる', 'to throw'],
    ['押す', 'おす', 'to push'], ['引く', 'ひく', 'to pull'], ['落ちる', 'おちる', 'to fall; to drop'],
    ['落とす', 'おとす', 'to drop (something)'], ['拾う', 'ひろう', 'to pick up'], ['捨てる', 'すてる', 'to throw away'],
    ['降る', 'ふる', 'to fall (rain, snow)'], ['降りる', 'おりる', 'to get off (a vehicle)'], ['登る', 'のぼる', 'to climb'],
    ['泳ぐ', 'およぐ', 'to swim'], ['飛ぶ', 'とぶ', 'to fly'], ['乗る', 'のる', 'to ride'],
    ['遊ぶ', 'あそぶ', 'to play'], ['寝る', 'ねる', 'to sleep'], ['座る', 'すわる', 'to sit'],
  ],
  // + communication + change
  valor: [
    ['伝える', 'つたえる', 'to convey'], ['報告', 'ほうこく', 'a report'], ['天気予報', 'てんきよほう', 'weather forecast'],
    ['相談', 'そうだん', 'consultation'], ['調べる', 'しらべる', 'to look into'], ['日記', 'にっき', 'diary'],
    ['記事', 'きじ', 'news article'], ['信じる', 'しんじる', 'to believe'], ['友達', 'ともだち', 'friend'],
    ['返す', 'かえす', 'to give back'], ['連れる', 'つれる', 'to take (someone) along'], ['連絡', 'れんらく', 'contact; getting in touch'],
    ['紹介', 'しょうかい', 'introduction'], ['相手', 'あいて', 'partner; opponent'], ['変わる', 'かわる', 'to change'],
    ['化学', 'かがく', 'chemistry'], ['最初', 'さいしょ', 'the very beginning'], ['最後', 'さいご', 'the very end'],
    ['最近', 'さいきん', 'recently'], ['初めて', 'はじめて', 'for the first time'], ['週末', 'しゅうまつ', 'weekend'],
    ['未来', 'みらい', 'the future'], ['過去', 'かこ', 'the past'], ['現在', 'げんざい', 'the present'],
    ['続く', 'つづく', 'to continue'], ['進む', 'すすむ', 'to advance'], ['予定', 'よてい', 'plan; schedule'],
    ['期間', 'きかん', 'term; period'],
  ],
  // + abstract + travel
  runeforge: [
    ['理由', 'りゆう', 'reason'], ['結果', 'けっか', 'result'], ['必ず', 'かならず', 'without fail'],
    ['必要', 'ひつよう', 'necessary'], ['自然', 'しぜん', 'nature'], ['本当', 'ほんとう', 'truth; really'],
    ['実は', 'じつは', 'actually; to tell the truth'], ['例えば', 'たとえば', 'for example'], ['目的', 'もくてき', 'purpose'],
    ['旅行', 'りょこう', 'travel; a trip'], ['空港', 'くうこう', 'airport'], ['二階', 'にかい', 'second floor'],
    ['宿題', 'しゅくだい', 'homework'], ['不便', 'ふべん', 'inconvenient'], ['結局', 'けっきょく', 'after all; in the end'],
    ['道路', 'どうろ', 'road (for traffic)'], ['区別', 'くべつ', 'distinction'], ['当たる', 'あたる', 'to hit (a target); to win (a prize)'],
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

// ── The Well of Old Tales: everyday words in plain hiragana. Id `n-<romaji>`.
// Kept OUT of `WORDS` (whose meanings are unique across loanwords and kanji
// vocabulary) so 'water' can be both 水 in Arc 3 and みず here.
type NativeRow = [text: string, meaning: string];

const NATIVE: Record<Exclude<WellArea, 'well4'>, NativeRow[]> = {
  // Floor 1: the things the old tales are made of.
  well1: [
    ['いぬ', 'dog'], ['ねこ', 'cat'], ['さる', 'monkey'], ['とり', 'bird'], ['うま', 'horse'], ['さかな', 'fish'],
    ['かめ', 'turtle'], ['つる', 'crane'], ['もも', 'peach'], ['みず', 'water'], ['やま', 'mountain'], ['かわ', 'river'],
    ['うみ', 'sea'], ['そら', 'sky'], ['つき', 'moon'], ['ほし', 'star'], ['はな', 'flower'], ['たけ', 'bamboo'],
    ['むら', 'village'], ['おに', 'ogre'], ['ゆき', 'snow'], ['かぜ', 'wind'], ['あめ', 'rain'], ['ひかり', 'light'],
  ],
  // Floor 2: people and feelings.
  well2: [
    ['こころ', 'heart'], ['ともだち', 'friend'], ['かぞく', 'family'], ['おじいさん', 'old man'], ['おばあさん', 'old woman'],
    ['こども', 'child'], ['ゆめ', 'dream'], ['ちから', 'strength'], ['たから', 'treasure'], ['やくそく', 'promise'],
    ['うれしい', 'happy'], ['かなしい', 'sad'], ['やさしい', 'kind'], ['こわい', 'scary'], ['おもしろい', 'interesting'],
    ['うつくしい', 'beautiful'],
  ],
  // Floor 3: the verbs the grammar sentences are built from.
  well3: [
    ['たべる', 'to eat'], ['のむ', 'to drink'], ['みる', 'to see'], ['きく', 'to listen'], ['いく', 'to go'], ['くる', 'to come'],
    ['かえる', 'to return'], ['あるく', 'to walk'], ['およぐ', 'to swim'], ['ねる', 'to sleep'], ['おきる', 'to wake up'],
    ['はなす', 'to speak'], ['よむ', 'to read'], ['かく', 'to write'], ['あける', 'to open'], ['たすける', 'to help'],
  ],
};

// The Terakoya's classrooms: the everyday words a first-year course starts with.
// Plain hiragana, so they share the `n-` namespace with the well's words; a word
// may be taught in only one place (a test keeps the ids unique).
const LESSON: Record<LessonArea, NativeRow[]> = {
  // Classroom 1: introductions, things and prices.
  lesson1: [
    ['がくせい', 'student'], ['せんせい', 'teacher'], ['だいがく', 'university'], ['なまえ', 'name'],
    ['せんこう', 'major (subject)'], ['でんわ', 'telephone'], ['ばんごう', 'number'], ['ほん', 'book'],
    ['かさ', 'umbrella'], ['かばん', 'bag'], ['とけい', 'watch; clock'], ['くつ', 'shoes'],
    ['さいふ', 'wallet'], ['ぼうし', 'hat'], ['いくら', 'how much'], ['だれ', 'who'],
  ],
  // Classroom 2: the day, from getting up to going to bed.
  lesson2: [
    ['する', 'to do'], ['べんきょうする', 'to study'], ['はたらく', 'to work'], ['あう', 'to meet'],
    ['かう', 'to buy'], ['まつ', 'to wait'], ['あそぶ', 'to play'], ['つくる', 'to make'],
    ['あさごはん', 'breakfast'], ['ばんごはん', 'dinner'], ['まいにち', 'every day'], ['しゅうまつ', 'weekend'],
    ['がっこう', 'school'], ['うち', 'home'], ['としょかん', 'library'], ['えいが', 'movie'],
  ],
  // Classroom 3: describing things, liking them, and asking for them.
  lesson3: [
    ['たかい', 'expensive; tall'], ['やすい', 'cheap'], ['あたらしい', 'new'], ['ふるい', 'old (things)'],
    ['あつい', 'hot'], ['さむい', 'cold (weather)'], ['いそがしい', 'busy'], ['むずかしい', 'difficult'],
    ['たのしい', 'fun'], ['おいしい', 'delicious'], ['しずか', 'quiet'], ['にぎやか', 'lively'],
    ['げんき', 'healthy; energetic'], ['ひま', 'free (not busy)'], ['すき', 'liked'], ['きらい', 'disliked'],
  ],
  // Classroom 4: people, what they are doing, and what they have done.
  lesson4: [
    ['きる', 'to wear (on the body)'], ['はく', 'to wear (on the legs)'], ['すむ', 'to live (somewhere)'], ['しる', 'to come to know'],
    ['おぼえる', 'to memorize'], ['わすれる', 'to forget'], ['おもう', 'to think'], ['いう', 'to say'],
    ['やすむ', 'to rest; to be absent'], ['ならう', 'to learn (from someone)'], ['のる', 'to ride'], ['てつだう', 'to help (with a task)'],
    ['しゅくだい', 'homework'], ['びょうき', 'illness'], ['りょこう', 'trip'], ['しごと', 'job'],
  ],
  // Classroom 5: colours, seasons, getting about, holiday plans.
  lesson5: [
    ['あかい', 'red'], ['あおい', 'blue'], ['くろい', 'black'], ['しろい', 'white'],
    ['はる', 'spring'], ['なつ', 'summer'], ['あき', 'autumn'], ['ふゆ', 'winter'],
    ['でんしゃ', 'train'], ['ひこうき', 'airplane'], ['ふね', 'ship'], ['じてんしゃ', 'bicycle'],
    ['えき', 'station'], ['きっぷ', 'ticket'], ['やすみ', 'holiday; break'], ['よてい', 'plan; schedule'],
  ],
  // Classroom 6: the body, and feeling ill.
  lesson6: [
    ['あたま', 'head'], ['おなか', 'stomach'], ['のど', 'throat'], ['め', 'eye'],
    ['みみ', 'ear'], ['あし', 'leg; foot'], ['ねつ', 'fever'], ['くすり', 'medicine'],
    ['びょういん', 'hospital'], ['いしゃ', 'doctor'], ['いたい', 'painful'], ['つかれる', 'to get tired'],
    ['なおる', 'to get better'], ['しんぱい', 'worry'], ['だいじょうぶ', 'all right'], ['ちょうし', 'condition; shape'],
  ],
  // Classroom 7: what you can do, and giving and receiving.
  lesson7: [
    ['できる', 'to be able to'], ['うたう', 'to sing'], ['おどる', 'to dance'], ['ひく', 'to play (piano, guitar)'],
    ['ほしい', 'wanted'], ['あげる', 'to give'], ['くれる', 'to give (to me)'], ['もらう', 'to receive'],
    ['おくる', 'to send'], ['てがみ', 'letter'], ['おかし', 'sweets'], ['ゆびわ', 'ring (jewellery)'],
    ['じょうず', 'skilful'], ['へた', 'unskilful'], ['けっこん', 'marriage'], ['おれい', 'thanks; a thank-you gift'],
  ],
  // Classroom 8: trips, favours, and things lost and found.
  lesson8: [
    ['りょかん', 'Japanese inn'], ['よやく', 'reservation'], ['しらべる', 'to look up'], ['じゅんび', 'preparation'],
    ['おみやげ', 'souvenir'], ['わすれもの', 'something left behind'], ['さがす', 'to look for'], ['みつける', 'to find'],
    ['おしえる', 'to teach; to tell'], ['かす', 'to lend'], ['かりる', 'to borrow'], ['おこす', 'to wake (someone) up'],
    ['まにあう', 'to be in time'], ['おそい', 'late; slow'], ['はやい', 'early; fast'], ['ちず', 'map'],
  ],
  // Classroom 9: gossip, and things that happen by themselves.
  lesson9: [
    ['うわさ', 'rumour'], ['てんきよほう', 'weather forecast'], ['あく', 'to open (by itself)'], ['しまる', 'to close (by itself)'],
    ['つく', 'to come on (a light)'], ['きえる', 'to go out (a light)'], ['こわれる', 'to break (by itself)'], ['こわす', 'to break (something)'],
    ['おちる', 'to fall'], ['よごれる', 'to get dirty'], ['あらう', 'to wash'], ['りょうり', 'cooking'],
    ['ちこく', 'being late'], ['けんか', 'quarrel'], ['わかれる', 'to part; to break up'], ['おどろく', 'to be surprised'],
  ],
  // Classroom 10: polite Japanese, for raising others and lowering yourself.
  lesson10: [
    ['いらっしゃる', 'to be, come, go (honorific)'], ['めしあがる', 'to eat, drink (honorific)'], ['おっしゃる', 'to say (honorific)'], ['なさる', 'to do (honorific)'],
    ['くださる', 'to give me (honorific)'], ['ごぞんじ', 'knowing (honorific)'], ['まいる', 'to go, come (humble)'], ['もうす', 'to say (humble)'],
    ['いたす', 'to do (humble)'], ['いただく', 'to receive (humble)'], ['うかがう', 'to visit; to ask (humble)'], ['おる', 'to be (humble)'],
    ['しゃちょう', 'company president'], ['ぶちょう', 'department head'], ['おきゃくさま', 'customer; guest'], ['しつれい', 'rudeness'],
  ],
  // Classroom 11: things done to you, things you are made to do, decisions.
  lesson11: [
    ['どろぼう', 'thief'], ['ぬすむ', 'to steal'], ['しかる', 'to scold'], ['ほめる', 'to praise'],
    ['ふむ', 'to step on'], ['こまる', 'to be in trouble'], ['やめる', 'to quit'], ['つづける', 'to continue'],
    ['きめる', 'to decide'], ['がまんする', 'to put up with'], ['しゅうかん', 'habit'], ['しょうらい', 'the future'],
    ['けいけん', 'experience'], ['せいせき', 'grades'], ['しけん', 'exam'], ['わかれ', 'farewell'],
  ],
};

export const NATIVE_WORDS: readonly Word[] = [...(Object.keys(NATIVE) as (keyof typeof NATIVE)[]), ...(Object.keys(LESSON) as LessonArea[])].flatMap((area) =>
  (area in NATIVE ? NATIVE[area as keyof typeof NATIVE] : LESSON[area as LessonArea]).map(([text, meaning]): Word => {
    const romaji = toRomaji(text);
    return { id: `n-${romaji}`, kind: 'native', text, reading: text, romaji, meaning, from: 'Japanese', area };
  }),
);

/** Every word of every kind. `WORDS` stays loanwords + kanji vocabulary only. */
export const EVERY_WORD: readonly Word[] = [...WORDS, ...NATIVE_WORDS];

const BY_ID = new Map(EVERY_WORD.map((w) => [w.id, w]));

export function getWord(id: string): Word {
  const w = BY_ID.get(id);
  if (!w) throw new Error(`Unknown word id: ${id}`);
  return w;
}

export function wordsForArea(area: WordArea): Word[] {
  return EVERY_WORD.filter((w) => w.area === area);
}
