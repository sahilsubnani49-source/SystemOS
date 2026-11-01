import { toHiragana, toRomaji } from '../util/romaji';

// The N5 kanji the game teaches (Arc 3: Castle Capital), in ten groups. Each group is
// one spirit family and one step of the curriculum.
//
//   on:  on'yomi in KATAKANA (Chinese-derived readings)
//   kun: kun'yomi in hiragana, okurigana after a '.' (た.べる = 食べる)
//   meaning: the first entry is the one battles ask for, so it must be unique.
//
// Ids are `j-<char>` and are save-file keys: never change a character.

export type KanjiLevel = 'N5' | 'N4' | 'N3';

export type KanjiGroup =
  // N5 (Arc 3: Castle Capital)
  | 'numbers' | 'days' | 'time' | 'people' | 'body' | 'directions' | 'nature' | 'actions' | 'adjectives' | 'places'
  // N4 (Arc 4: Mountain Temples)
  | 'n4family' | 'n4seasons' | 'n4food' | 'n4qualities' | 'n4study' | 'n4health' | 'n4movement' | 'n4town'
  | 'n4nature' | 'n4thought' | 'n4function'
  // N3 (Arc 5: Northern Runeforge), a curated core of ~150
  | 'n3conflict' | 'n3society' | 'n3emotion' | 'n3work' | 'n3weather' | 'n3action' | 'n3comm' | 'n3change'
  | 'n3abstract' | 'n3travel';

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

// N3 kanji NOT already in the N5 or N4 sets. A curated core: the full N3 list is ~370.
const N3: Partial<Record<KanjiGroup, Row[]>> = {
  n3conflict: [
    ['戦', 'war', 'セン', 'たたか.う いくさ'], ['争', 'conflict', 'ソウ', 'あらそ.う'], ['軍', 'army', 'グン', ''],
    ['兵', 'soldier', 'ヘイ ヒョウ', ''], ['勝', 'win', 'ショウ', 'か.つ'], ['負', 'lose', 'フ', 'ま.ける お.う'],
    ['守', 'protect', 'シュ ス', 'まも.る'], ['攻', 'attack', 'コウ', 'せ.める'], ['武', 'military', 'ブ ム', ''],
    ['敵', 'enemy', 'テキ', 'かたき'], ['険', 'steep', 'ケン', 'けわ.しい'], ['危', 'dangerous', 'キ', 'あぶ.ない あや.うい'],
    ['殺', 'kill', 'サツ', 'ころ.す'], ['破', 'tear; break', 'ハ', 'やぶ.る'], ['倒', 'fall over', 'トウ', 'たお.れる たお.す'],
  ],
  n3society: [
    ['民', 'the people (nation)', 'ミン', 'たみ'], ['法', 'law', 'ホウ', ''], ['王', 'king', 'オウ', ''],
    ['政', 'politics', 'セイ ショウ', 'まつりごと'], ['治', 'govern; cure', 'ジ チ', 'おさ.める なお.る'], ['決', 'decide', 'ケツ', 'き.める き.まる'],
    ['議', 'deliberation', 'ギ', ''], ['選', 'choose', 'セン', 'えら.ぶ'], ['制', 'system', 'セイ', ''],
    ['権', 'rights', 'ケン ゴン', ''], ['官', 'official', 'カン', ''], ['府', 'government office', 'フ', ''],
    ['歴', 'past history', 'レキ', ''], ['史', 'chronicle', 'シ', ''], ['個', 'individual', 'コ', ''],
  ],
  n3emotion: [
    ['感', 'feeling', 'カン', ''], ['情', 'emotion', 'ジョウ セイ', 'なさ.け'], ['愛', 'love', 'アイ', ''],
    ['怒', 'anger', 'ド', 'いか.る おこ.る'], ['喜', 'rejoice', 'キ', 'よろこ.ぶ'], ['悲', 'sad', 'ヒ', 'かな.しい'],
    ['笑', 'laugh', 'ショウ', 'わら.う え.む'], ['泣', 'cry', 'キュウ', 'な.く'], ['恥', 'shame', 'チ', 'は.じる はじ'],
    ['苦', 'suffering', 'ク', 'くる.しい にが.い'], ['幸', 'happiness', 'コウ', 'しあわ.せ さいわ.い'], ['願', 'request', 'ガン', 'ねが.う'],
    ['念', 'desire; sense', 'ネン', ''], ['疲', 'tired', 'ヒ', 'つか.れる'], ['驚', 'surprise', 'キョウ', 'おどろ.く'],
  ],
  n3work: [
    ['働', 'labour', 'ドウ', 'はたら.く'], ['給', 'salary', 'キュウ', ''], ['費', 'expense', 'ヒ', 'つい.やす'],
    ['払', 'pay', 'フツ', 'はら.う'], ['価', 'value', 'カ', 'あたい'], ['値', 'price', 'チ', 'ね あたい'],
    ['産', 'produce', 'サン', 'う.む う.まれる'], ['商', 'merchant', 'ショウ', 'あきな.う'], ['経', 'manage; sutra', 'ケイ キョウ', 'へ.る'],
    ['済', 'settle', 'サイ', 'す.む す.ます'], ['営', 'run (a business)', 'エイ', 'いとな.む'], ['職', 'employment', 'ショク', ''],
    ['損', 'loss', 'ソン', 'そこ.なう'], ['得', 'gain', 'トク', 'え.る'], ['貯', 'save (money)', 'チョ', 'た.める'],
  ],
  n3weather: [
    ['雪', 'snow', 'セツ', 'ゆき'], ['雲', 'cloud', 'ウン', 'くも'], ['晴', 'clear up', 'セイ', 'は.れる'],
    ['寒', 'cold (weather)', 'カン', 'さむ.い'], ['暑', 'hot (weather)', 'ショ', 'あつ.い'], ['暖', 'warm (weather)', 'ダン', 'あたた.かい'],
    ['冷', 'chilly', 'レイ', 'つめ.たい ひ.える'], ['温', 'warm (to the touch)', 'オン', 'あたた.かい'], ['季', 'season', 'キ', ''],
    ['節', 'joint; section', 'セツ', 'ふし'], ['氷', 'ice', 'ヒョウ', 'こおり'], ['波', 'wave', 'ハ', 'なみ'],
    ['島', 'island', 'トウ', 'しま'], ['星', 'star', 'セイ', 'ほし'], ['陽', 'sunshine', 'ヨウ', ''],
  ],
  n3action: [
    ['打', 'hit', 'ダ', 'う.つ'], ['投', 'throw', 'トウ', 'な.げる'], ['押', 'push', 'オウ', 'お.す'],
    ['引', 'pull', 'イン', 'ひ.く'], ['落', 'fall', 'ラク', 'お.ちる お.とす'], ['拾', 'pick up', 'シュウ', 'ひろ.う'],
    ['捨', 'throw away', 'シャ', 'す.てる'], ['降', 'descend', 'コウ', 'お.りる ふ.る'], ['登', 'climb', 'トウ ト', 'のぼ.る'],
    ['泳', 'swim', 'エイ', 'およ.ぐ'], ['飛', 'fly', 'ヒ', 'と.ぶ'], ['乗', 'ride', 'ジョウ', 'の.る'],
    ['遊', 'play', 'ユウ', 'あそ.ぶ'], ['寝', 'sleep', 'シン', 'ね.る'], ['座', 'sit', 'ザ', 'すわ.る'],
  ],
  n3comm: [
    ['伝', 'transmit', 'デン', 'つた.える'], ['報', 'report', 'ホウ', 'むく.いる'], ['告', 'announce', 'コク', 'つ.げる'],
    ['談', 'discuss', 'ダン', ''], ['調', 'investigate', 'チョウ', 'しら.べる'], ['記', 'record', 'キ', 'しる.す'],
    ['信', 'believe', 'シン', ''], ['達', 'reach; plural', 'タツ', ''], ['返', 'return (something)', 'ヘン', 'かえ.す'],
    ['連', 'connect', 'レン', 'つ.れる'], ['絡', 'entwine', 'ラク', 'から.む'], ['介', 'mediate', 'カイ', ''],
    ['相', 'mutual', 'ソウ ショウ', 'あい'], ['解', 'solve', 'カイ ゲ', 'と.く'], ['紹', 'introduce', 'ショウ', ''],
  ],
  n3change: [
    ['変', 'change', 'ヘン', 'か.わる か.える'], ['化', 'transform', 'カ ケ', 'ば.ける'], ['最', 'most', 'サイ', 'もっと.も'],
    ['初', 'first', 'ショ', 'はじ.め はつ'], ['末', 'tip; close', 'マツ', 'すえ'], ['未', 'not yet', 'ミ', 'いま.だ'],
    ['過', 'pass (time)', 'カ', 'す.ぎる'], ['去', 'leave; past', 'キョ コ', 'さ.る'], ['現', 'present; appear', 'ゲン', 'あらわ.れる'],
    ['在', 'reside', 'ザイ', 'あ.る'], ['続', 'continue', 'ゾク', 'つづ.く'], ['進', 'advance', 'シン', 'すす.む'],
    ['予', 'beforehand', 'ヨ', ''], ['定', 'determine', 'テイ ジョウ', 'さだ.める'], ['期', 'period', 'キ ゴ', ''],
  ],
  n3abstract: [
    ['由', 'grounds; reason', 'ユウ ユ', 'よし'], ['因', 'cause', 'イン', 'よ.る'], ['果', 'result; fruit', 'カ', 'は.たす'],
    ['結', 'tie', 'ケツ', 'むす.ぶ'], ['必', 'certain', 'ヒツ', 'かなら.ず'], ['要', 'need', 'ヨウ', 'い.る'],
    ['然', 'thus', 'ゼン ネン', ''], ['当', 'appropriate', 'トウ', 'あ.たる あ.てる'], ['実', 'reality', 'ジツ', 'み みの.る'],
    ['例', 'example', 'レイ', 'たと.える'], ['式', 'ceremony; style', 'シキ', ''], ['的', 'target', 'テキ', 'まと'],
    ['性', 'nature (quality)', 'セイ ショウ', ''], ['関', 'related', 'カン', 'せき'], ['術', 'technique', 'ジュツ', ''],
  ],
  n3travel: [
    ['旅', 'journey', 'リョ', 'たび'], ['港', 'harbour', 'コウ', 'みなと'], ['橋', 'bridge', 'キョウ', 'はし'],
    ['階', 'storey', 'カイ', ''], ['席', 'seat', 'セキ', ''], ['線', 'line', 'セン', ''],
    ['号', 'number; issue', 'ゴウ', ''], ['宿', 'inn', 'シュク', 'やど'], ['泊', 'stay overnight', 'ハク', 'と.まる'],
    ['路', 'route', 'ロ', 'じ'], ['船', 'ship', 'セン', 'ふね'], ['便', 'convenience; mail', 'ベン ビン', 'たよ.り'],
    ['局', 'bureau', 'キョク', ''], ['区', 'ward', 'ク', ''], ['県', 'prefecture', 'ケン', ''],
  ],
};

export const KANJI: readonly Kanji[] = [...build('N5', N5), ...build('N4', N4), ...build('N3', N3)];

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
  // N3
  ['戦', '単', '獣', '我'], ['勝', '騰', '券', '脇'], ['守', '寺', '宇', '字'], ['攻', '功', '巧', '項'],
  ['武', '式', '試', '弐'], ['敵', '適', '滴', '摘'], ['険', '験', '検', '倹'], ['殺', '設', '投', '役'],
  ['民', '氏', '紙', '低'], ['王', '玉', '主', '土'], ['政', '正', '征', '故'], ['治', '冶', '始', '台'],
  ['決', '快', '缺', '沢'], ['議', '義', '儀', '犠'], ['制', '製', '刺', '利'], ['官', '館', '宮', '管'],
  ['史', '吏', '使', '更'], ['感', '惑', '憾', '減'], ['情', '清', '晴', '精'], ['怒', '努', '恕', '奴'],
  ['悲', '非', '排', '罪'], ['笑', '咲', '芙', '竺'], ['苦', '若', '古', '芳'], ['幸', '辛', '達', '報'],
  ['願', '頭', '顔', '原'], ['念', '今', '含', '吟'], ['疲', '病', '痛', '波'], ['働', '動', '重', '勤'],
  ['給', '絡', '結', '終'], ['費', '貴', '貸', '買'], ['価', '西', '佃', '値'], ['商', '適', '滴', '高'],
  ['経', '軽', '径', '茎'], ['済', '剤', '斉', '清'], ['職', '識', '織', '聴'], ['損', '員', '貝', '捐'],
  ['雪', '雲', '電', '雷'], ['寒', '塞', '実', '容'], ['暑', '署', '著', '者'], ['暖', '援', '緩', '媛'],
  ['冷', '令', '鈴', '零'], ['温', '湿', '混', '湯'], ['季', '委', '李', '秀'], ['島', '鳥', '烏', '鳴'],
  ['星', '生', '性', '姓'], ['打', '灯', '丁', '町'], ['投', '没', '設', '役'], ['押', '抽', '油', '神'],
  ['落', '洛', '絡', '酪'], ['拾', '捨', '給', '恰'], ['登', '発', '燈', '橙'], ['泳', '永', '氷', '詠'],
  ['寝', '浸', '侵', '宿'], ['座', '庭', '唐', '坐'], ['伝', '転', '云', '会'],
  ['報', '幸', '服', '執'], ['調', '週', '周', '彫'], ['記', '紀', '起', '己'], ['信', '言', '計', '仁'],
  ['返', '反', '坂', '板'], ['連', '運', '軍', '車'], ['介', '今', '分', '尓'], ['相', '想', '箱', '霜'],
  ['変', '恋', '赤', '亦'], ['化', '花', '北', '比'], ['最', '取', '撮', '量'], ['初', '刀', '衣', '物'],
  ['末', '未', '本', '木'], ['過', '週', '遇', '禍'], ['去', '法', '云', '至'], ['現', '見', '規', '視'],
  ['在', '存', '左', '有'], ['続', '読', '売', '統'], ['進', '准', '集', '維'], ['予', '矛', '子', '了'],
  ['定', '宝', '宅', '走'], ['由', '田', '甲', '申'], ['因', '困', '囚', '団'], ['果', '菓', '課', '東'],
  ['要', '票', '西', '腰'], ['当', '雪', '急', '尚'], ['例', '列', '別', '倒'], ['的', '約', '白', '勺'],
  ['関', '開', '閉', '聞'], ['術', '述', '衛', '街'], ['旅', '族', '旋', '放'], ['港', '巷', '洪', '湾'],
  ['橋', '矯', '喬', '僑'], ['階', '陛', '皆', '偕'], ['席', '度', '庶', '帯'], ['線', '泉', '綿', '縁'],
  ['宿', '縮', '宮', '寝'], ['泊', '白', '拍', '迫'], ['路', '露', '各', '足'], ['船', '般', '舟', '沿'],
  ['便', '使', '更', '硬'], ['局', '居', '届', '屈'], ['区', '匹', '巨', '欧'], ['県', '具', '見', '貝'],
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
