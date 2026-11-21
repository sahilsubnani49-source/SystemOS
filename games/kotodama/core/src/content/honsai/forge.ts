import type { Sentence } from '../sentences';
import { conjugate, FORM_LABEL, ruleNote, wrongForms, isAdjClass, isVerbClass, type Form } from './conjugate';
import { HONSAI_WORDS, honsaiArea, type HonsaiWord } from './words';

// Honsai's sentence items (ids `q-`): Verb Forge conjugation questions generated from
// each district's verbs and adjectives, and hand-written grammar sentences. Both use
// the fill-in-the-blank card, which shows the rule once the answer is in.

/** Which forms each district's forge asks about. Later districts add て, ない, potential... */
export const FORGE_FORMS: Record<number, { verb: Form[]; adj: Form[] }> = {
  1: { verb: [], adj: [] },
  2: { verb: [], adj: ['adj-nai', 'adj-ta', 'adj-nakatta'] },
  3: { verb: ['masu', 'masen', 'mashita'], adj: ['adj-te'] },
  // Kakehashi: every bridge is a て-form.
  4: { verb: ['te', 'teiru'], adj: [] },
  // Manabi Hill: the plain forms a dictionary, a diary and a friend use.
  5: { verb: ['nai', 'ta', 'nakatta'], adj: [] },
  // Minato Harbour: "if" and "when", for travel plans.
  6: { verb: ['ba', 'tara'], adj: [] },
  // Kokoro Garden: what you want, what you mean to do, how someone looks.
  7: { verb: ['tai', 'volitional'], adj: ['adj-sou'] },
  // Kaze Valley: what you can do, what is done to you, and becoming (暖かくなる).
  8: { verb: ['potential', 'passive'], adj: ['adj-ku'] },
  // Matsuri Town: making and letting (させる), and the polite past negative.
  9: { verb: ['causative', 'masendeshita'], adj: [] },
  // Kotonoha Court: keigo is a set of special verbs, not a conjugation, so the court teaches it
  // in its grammar and its words (いらっしゃる, 申す...) rather than in the forge.
  10: { verb: [], adj: [] },
  // Kawaraban Row: too much of everything (高すぎる, 飲みすぎる).
  11: { verb: ['sugiru'], adj: ['adj-sugiru'] },
  // The Tower of Silence: what Wapul made everyone do (させられる).
  12: { verb: ['causpass'], adj: [] },
};

/**
 * Verbs that happen to you rather than being done: "want to rain", "let's be audible" or
 * "can be surprised" are not Japanese anyone says, so the forge never asks for these forms
 * of them.
 */
const WILL_FORMS = new Set<Form>(['tai', 'volitional', 'potential', 'passive', 'causative', 'causpass']);
/** Keigo verbs are already the polite form: "made to おっしゃる" or "いらっしゃりすぎる" are not Japanese. */
const KEIGO = new Set(['いらっしゃる', 'おっしゃる', '召し上がる', 'ご覧になる', 'なさる', 'くださる', '申す', '申し上げる', '参る', '伺う',
  '拝見する', '頂く', '存じる', '居る', '致す', '差し上げる', '承る', '頂戴する', '宜しい', '申し訳ない']);
const NOT_WILLED = new Set([
  '違う', '足りる', '要る', '分かる', 'ある', 'できる', '始まる', '落ちる', '転ぶ', '倒れる', '届く', '決まる', '開く',
  '閉まる', '付く', '消える', '壊れる', '直る', '割れる', '折れる', '掛かる', '切れる', '汚れる', '濡れる', '乾く', '冷える',
  '沸く', '燃える', '光る', '鳴る', '困る', '驚く', '疲れる', '見つかる', '間に合う', '遅れる', '流れる', '揺れる', '酔う',
  '混む', '空く', '治る', '生まれる', '晴れる', '曇る', '降る', '止む', '吹く', '積もる', '溶ける', '凍る', '咲く', '散る',
  '枯れる', '生える', '見える', '聞こえる', '当たる', '外れる', '盛り上がる', '転がる', '照れる', '飽きる', '気付く', '苦しむ',
  '悩む', '怖がる', '死ぬ', '育つ', '続く', '太る', '浮かぶ', '沈む', '過ぎる', '下がる', '変わる', '集まる', '動く',
]);
/** Adjectives a form does not suit: colours do not "look" (赤そう), and 可愛そう sounds like 可哀想. */
const NOT_FOR: Partial<Record<Form, Set<string>>> = {
  'adj-sou': new Set(['赤い', '青い', '白い', '黒い', '黄色い', '茶色い', '丸い', '四角い', '綺麗', '同じ', '可愛い', '本当', '必要', '反対', '急', '可哀想', '大丈夫']),
  'adj-ku': new Set(['同じ', '大丈夫', '嫌', '大好き', '大嫌い', '残念']),
  'adj-sugiru': new Set(['同じ', '大丈夫', '本当', '必要', '大好き', '大嫌い', '反対', '幸せ', '確か']),
};
const suits = (w: HonsaiWord, form: Form) =>
  !KEIGO.has(w.text) && !(WILL_FORMS.has(form) && NOT_WILLED.has(w.text)) && !NOT_FOR[form]?.has(w.text);

/** Stable pseudo-shuffle: the same three wrong answers every time for the same item. */
function pick3(id: string, options: string[]): [string, string, string] {
  let h = 2166136261;
  for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const sorted = [...options].sort((a, b) => ((Math.imul(h ^ a.length, 31) + a.charCodeAt(0)) % 97) - ((Math.imul(h ^ b.length, 31) + b.charCodeAt(0)) % 97));
  return [sorted[0], sorted[1], sorted[2]] as [string, string, string];
}

function forgeItem(w: HonsaiWord, form: Form, district: number): Sentence | null {
  const wrong = wrongForms(w.text, w.reading, w.cls, form);
  if (wrong.length < 3) return null;
  const id = `q-${form}-${w.id.slice(2)}`;
  const label = FORM_LABEL[form];
  return {
    id,
    text: `「${w.text}」→ ${label.ja}：＿＿`,
    en: `${label.en} of "${w.meaning}"`,
    answer: conjugate(w.text, w.reading, w.cls, form).text,
    wrong: pick3(id, wrong),
    area: honsaiArea(district),
    note: ruleNote(w.cls, form),
  };
}

const FORGE: Sentence[] = Object.entries(FORGE_FORMS).flatMap(([d, forms]) => {
  const district = Number(d);
  // A district forges its own words and every earlier district's: the old ones come back.
  const words = HONSAI_WORDS.filter((w) => w.district <= district);
  return words.flatMap((w) => {
    const list = isVerbClass(w.cls) ? forms.verb : isAdjClass(w.cls) ? forms.adj : [];
    return list.filter((f) => suits(w, f)).map((f) => forgeItem(w, f, district)).filter((s): s is Sentence => !!s);
  });
});

type G = [text: string, en: string, answer: string, wrong: [string, string, string], note: string];

/** Hand-written grammar, one set per district. Append only: ids are positions. */
const GRAMMAR_ROWS: Record<number, G[]> = {
  1: [
    ['わたし＿＿ がくせいです。', 'I am a student.', 'は', ['を', 'に', 'で'], 'は marks the topic: "as for me, ..."'],
    ['これは わたしの ほん＿＿。', 'This is my book.', 'です', ['ます', 'の', 'を'], 'です ends a polite sentence: "it is ~".'],
    ['あれは だれ＿＿ かさですか。', 'Whose umbrella is that?', 'の', ['を', 'は', 'が'], 'の joins nouns: だれの かさ, whose umbrella.'],
    ['あなたは にほんじんです＿＿。', 'Are you Japanese?', 'か', ['を', 'に', 'で'], 'か at the end turns a sentence into a question.'],
    ['たなかさん＿＿ がくせいです。', 'Mr Tanaka is a student too.', 'も', ['を', 'に', 'へ'], 'も means "also" and takes the place of は.'],
    ['だれ＿＿ きましたか。', 'Who came?', 'が', ['は', 'を', 'で'], 'Question words take が, never は: だれが.'],
    ['それは なん＿＿か。', 'What is that?', 'です', ['ます', 'を', 'が'], 'なんですか: what is it?'],
    ['ここ＿＿ わたしの へやです。', 'This is my room.', 'は', ['を', 'へ', 'で'], 'ここは: as for this place.'],
    ['りんごを ＿＿ ください。', 'Three apples, please.', 'みっつ', ['さんにん', 'さんまい', 'さんだい'], 'Small things are counted ひとつ, ふたつ, みっつ.'],
    ['ねこが ＿＿ います。', 'There are two cats.', 'にひき', ['にまい', 'ふたり', 'にだい'], 'Animals are counted with ひき: いっぴき, にひき, さんびき.'],
    ['かみが ＿＿ あります。', 'There are three sheets of paper.', 'さんまい', ['さんぼん', 'さんびき', 'さんだい'], 'Flat things are counted with まい.'],
    ['しちじ＿＿ おきます。', 'I get up at seven.', 'に', ['で', 'を', 'が'], 'に marks a clock time.'],
  ],
  2: [
    ['この りんごは ＿＿ です。', 'This apple is not expensive.', 'たかくない', ['たかいじゃない', 'たかいない', 'たかじゃない'], 'い-adjective negative: たかい → たかくない.'],
    ['きのうの さかなは ＿＿ です。', "Yesterday's fish was delicious.", 'おいしかった', ['おいしいでした', 'おいしいだった', 'おいしくた'], 'い-adjective past: おいしい → おいしかった (+ です to be polite).'],
    ['この みせは ＿＿。', 'This shop is not quiet.', 'しずかじゃない', ['しずかくない', 'しずかない', 'しずかだない'], 'な-adjective negative: しずか → しずかじゃない.'],
    ['パン＿＿ ください。', 'Bread, please.', 'を', ['が', 'で', 'に'], 'Xを ください: please give me X.'],
    ['この とけいは ＿＿ ですか。', 'How much is this watch?', 'いくら', ['いくつ', 'どこ', 'だれ'], 'いくら asks a price; いくつ asks how many.'],
    ['スーパー＿＿ やさいを かいます。', 'I buy vegetables at the supermarket.', 'で', ['に', 'を', 'が'], 'で marks where an action happens.'],
    ['あかい りんご＿＿ あおい りんご、どちらが いいですか。', 'The red apple or the green one: which is better?', 'と', ['も', 'を', 'が'], 'AとB、どちらが…: which of A and B...?'],
    ['この ケーキは ＿＿ おいしいです。', 'This cake is sweet and delicious.', 'あまくて', ['あまいで', 'あまいくて', 'あまくで'], 'Join い-adjectives with くて: あまい → あまくて.'],
    ['その みせは ＿＿ べんりです。', 'That shop is quiet and convenient.', 'しずかで', ['しずかくて', 'しずかて', 'しずかだで'], 'Join な-adjectives with で: しずかで.'],
    ['これは ＿＿ ほんです。', 'This is an old book.', 'ふるい', ['ふるいな', 'ふるいの', 'ふるく'], 'い-adjectives go straight before a noun: ふるい ほん.'],
    ['＿＿ へやですね。', 'What a pretty room.', 'きれいな', ['きれい', 'きれいい', 'きれいの'], 'な-adjectives take な before a noun: きれいな へや.'],
    ['ぜんぶで せんえん＿＿。', "That's 1,000 yen altogether.", 'です', ['ます', 'を', 'に'], 'ぜんぶで: altogether, in total.'],
  ],
  3: [
    ['まいあさ コーヒーを ＿＿。', 'I drink coffee every morning.', 'のみます', ['のみります', 'のまます', 'のむます'], '飲む is Group 1: む → み, then ます.'],
    ['きのう ともだちに ＿＿。', 'I met a friend yesterday.', 'あいました', ['あいます', 'あうました', 'あいりました'], 'Polite past: ます → ました.'],
    ['わたしは にくを ＿＿。', "I don't eat meat.", 'たべません', ['たべりません', 'たべまない', 'たべましない'], 'Polite negative: ます → ません.'],
    ['としょかん＿＿ ほんを よみます。', 'I read books at the library.', 'で', ['に', 'を', 'へ'], 'で: where an action happens.'],
    ['あした きょうと＿＿ いきます。', "Tomorrow I'm going to Kyoto.", 'へ', ['を', 'で', 'が'], 'へ (or に) marks where you are heading.'],
    ['まいばん じゅうじ＿＿ ねます。', 'I go to bed at ten every night.', 'に', ['で', 'を', 'が'], 'に marks a clock time.'],
    ['はを ＿＿。', 'I brush my teeth.', 'みがきます', ['みがります', 'みがいます', 'みがくます'], '磨く is Group 1: く → き, then ます.'],
    ['へやを ＿＿。', 'I clean my room.', 'そうじします', ['そうじります', 'そうじすます', 'そうじしります'], 'Noun + する: そうじ + します.'],
    ['いっしょに ＿＿か。', "Won't you eat with me?", 'たべません', ['たべりません', 'たべないません', 'たべまして'], '〜ませんか: a polite invitation.'],
    ['まどを ＿＿。', 'I open the window.', 'あけます', ['あきます', 'あけります', 'あくます'], '開ける takes を (窓を開ける). 開く is "to come open": 窓が開く.'],
    ['ははは だいどころ＿＿ りょうりを します。', 'My mother cooks in the kitchen.', 'で', ['に', 'を', 'へ'], 'で: the place of the action.'],
    ['にわに ねこが ＿＿。', 'There is a cat in the garden.', 'います', ['あります', 'いるます', 'いっます'], 'Living things: いる (います). Things: ある (あります).'],
  ],
  4: [
    ['ちょっと ＿＿ ください。', 'Please wait a moment.', 'まって', ['まちて', 'まっで', 'まんで'], 'て-form + ください: please do. 待つ → 待って.'],
    ['いま、そとで あめが ＿＿ います。', "It's raining outside right now.", 'ふって', ['ふりて', 'ふんで', 'ふいて'], 'て-form + いる: something going on right now.'],
    ['ここで しゃしんを ＿＿も いいですか。', 'May I take a photo here?', 'とって', ['とりて', 'とんで', 'といて'], 'て-form + もいいですか: may I...?'],
    ['ここで たばこを ＿＿は いけません。', 'You must not smoke here.', 'すって', ['すいて', 'すんで', 'すわて'], 'て-form + はいけません: you must not. 吸う → 吸って.'],
    ['あさ おきて、かおを ＿＿、ごはんを たべます。', 'In the morning I get up, wash my face and eat.', 'あらって', ['あらいて', 'あらんで', 'あらうて'], 'The て-form joins actions in order: A て, B て, C.'],
    ['ごはんを ＿＿から、しゅくだいを します。', 'After eating, I do my homework.', 'たべて', ['たべって', 'たべいて', 'たべんで'], 'て-form + から: after doing.'],
    ['あには とうきょうに ＿＿ います。', 'My brother lives in Tokyo.', 'すんで', ['すみて', 'すって', 'すいで'], '住んでいる: ている for a lasting state, not an action in progress.'],
    ['かぜで まどが ＿＿ います。', 'The wind has left the window open.', 'あいて', ['あけて', 'あいで', 'あって'], 'Intransitive + ている shows the result: 窓が開いている, the window is open.'],
    ['すみません、もう いちど ＿＿ ください。', 'Excuse me, please say it once more.', 'いって', ['いいて', 'いんで', 'いうて'], '言う → 言って (う → って).'],
    ['この ほんを ＿＿ みます。', "I'll try reading this book.", 'よんで', ['よみて', 'よって', 'よいて'], 'て-form + みる: try doing. 読む → 読んで.'],
    ['えきまで ＿＿ いきます。', "I'll walk to the station.", 'あるいて', ['あるって', 'あるきて', 'あるんで'], '歩く → 歩いて. 歩いて行く: go on foot.'],
    ['はしを ＿＿、むこうへ いきました。', 'I crossed the bridge and went to the other side.', 'わたって', ['わたりて', 'わたいて', 'わたんで'], '渡る → 渡って (る → って for Group 1).'],
  ],
  5: [
    ['にほんへ ＿＿ ことが あります。', 'I have been to Japan.', 'いった', ['いきた', 'いいた', 'いくた'], 'た-form + ことがある: have done before.'],
    ['きのうは ほんを ＿＿り、おんがくを きいたり しました。', 'Yesterday I did things like reading and listening to music.', 'よんだ', ['よみた', 'よった', 'よいた'], '〜たり〜たりする: do things like A and B.'],
    ['あしたは がっこうへ ＿＿。', "I'm not going to school tomorrow. (casual)", 'いかない', ['いきない', 'いくない', 'いかないだ'], 'Plain negative: the last kana moves to the あ-row + ない. 行く → 行かない.'],
    ['ゆうべは なにも ＿＿。', "I didn't eat anything last night. (casual)", 'たべなかった', ['たべないた', 'たべなくた', 'たべなかた'], 'Plain past negative: ない → なかった.'],
    ['あしたは あめが ＿＿と おもいます。', 'I think it will rain tomorrow.', 'ふる', ['ふります', 'ふって', 'ふれ'], 'Before と思う, use the plain form: 降ると思う.'],
    ['あの えいがは まだ ＿＿ ことが ありません。', "I haven't seen that film yet.", 'みた', ['みって', 'みいた', 'みった'], 'た-form + ことがない: have never done.'],
    ['しゅくだいを ＿＿ ほうが いいですよ。', "You'd better do your homework.", 'した', ['しって', 'すった', 'さった'], 'た-form + ほうがいい: you had better.'],
    ['ここで しゃしんを ＿＿で ください。', "Please don't take photos here.", 'とらない', ['とりない', 'とるない', 'とらなく'], 'ない-form + でください: please do not.'],
    ['かれは もう いえに ＿＿。', 'He has already gone home. (casual)', 'かえった', ['かえた', 'かえいた', 'かえりた'], '帰る is Group 1 (it only looks like Group 2): 帰った.'],
    ['あした テストが ある＿＿、こんばん べんきょうします。', "There's a test tomorrow, so I'll study tonight.", 'から', ['まで', 'より', 'ほど'], 'Plain form + から: because.'],
    ['らいねん にほんへ ＿＿ つもりです。', 'I plan to go to Japan next year.', 'いく', ['いきます', 'いって', 'いけ'], 'Dictionary form + つもり: plan to.'],
    ['せんせいは まだ ＿＿。', "The teacher hasn't come yet.", 'きていない', ['こていない', 'きないでいる', 'くていない'], 'まだ + ていない: not yet.'],
  ],
  6: [
    ['えきに ＿＿、でんわして ください。', 'Call me when you get to the station.', 'ついたら', ['つきたら', 'ついだら', 'つくたら'], 'たら: when A has happened, then B.'],
    ['まっすぐ いって、かどを みぎに ＿＿、えきが あります。', "Go straight; turn right at the corner and you'll see the station.", 'まがると', ['まがったと', 'まがりと', 'まがるば'], 'と: whenever A, B follows naturally. Directions use と.'],
    ['いそげば、でんしゃに ＿＿。', "If you hurry, you'll make the train.", 'まにあいます', ['まにあって', 'まにあえば', 'まにあうだ'], '〜ば、〜: if A, then B.'],
    ['やすければ、＿＿。', "If it's cheap, I'll buy it.", 'かいます', ['かえば', 'かって', 'かいたら'], 'い-adjective + ければ: やすい → やすければ.'],
    ['あした あめが ＿＿、しあいは ちゅうしです。', "If it rains tomorrow, the match is cancelled.", 'ふったら', ['ふりたら', 'ふるたら', 'ふっだら'], 'たら: if A happens.'],
    ['この ボタンを ＿＿、きっぷが でます。', 'Press this button and a ticket comes out.', 'おすと', ['おしと', 'おすたら', 'おせと'], 'と: every time A, B happens (machines, rules, nature).'],
    ['きっぷは どこで ＿＿ いいですか。', 'Where should I buy a ticket?', 'かえば', ['かいば', 'かえるば', 'かうば'], '〜ばいいですか: what should I do? (〜たらいいですか also works.)'],
    ['すみません、えきは どちら＿＿か。', 'Excuse me, which way is the station?', 'です', ['ます', 'を', 'に'], 'どちらですか: which way is it? (polite)'],
    ['つぎの えきで ＿＿ ください。', 'Please change trains at the next station.', 'のりかえて', ['のりかえって', 'のりかえいて', 'のりかって'], '乗り換える (Group 2): drop る, add て.'],
    ['もし じかんが ＿＿、きょうとも みたいです。', "If I have time, I'd like to see Kyoto too.", 'あったら', ['あるたら', 'あいたら', 'ありたら'], 'もし…たら: if, perhaps.'],
    ['この みちを ＿＿ いくと、うみに でます。', 'Go straight along this road and you come out at the sea.', 'まっすぐ', ['まっすぐな', 'まっすぐの', 'まっすぐで'], 'まっすぐ works as an adverb on its own: まっすぐ行く.'],
    ['でんしゃが ＿＿ いるので、すわれません。', "The train is crowded, so I can't sit down.", 'こんで', ['こみて', 'こって', 'こいて'], '混む → 混んでいる: is crowded (a state).'],
  ],
  7: [
    ['あたらしい くつが ＿＿です。', 'I want new shoes.', 'ほしい', ['ほしがる', 'ほしくて', 'ほしいな'], 'Xが ほしい: I want a thing. For an action, use たい.'],
    ['なつやすみに うみへ ＿＿です。', 'I want to go to the sea in the summer holidays.', 'いきたい', ['いくたい', 'いきほしい', 'いかたい'], 'ます-stem + たい: want to. 行きます → 行きたい.'],
    ['あしたから まいにち ＿＿と おもいます。', "I'm thinking of running every day from tomorrow.", 'はしろう', ['はしりよう', 'はしるう', 'はしれよう'], 'Volitional + と思う: I mean to. 走る → 走ろう (お-row + う).'],
    ['いっしょに ＿＿！', "Let's eat together!", 'たべよう', ['たべろう', 'たべるよう', 'たべおう'], "Volitional: let's. Group 2: drop る, add よう."],
    ['この ケーキ、＿＿ですね。', 'This cake looks delicious.', 'おいしそう', ['おいしくそう', 'おいしさそう', 'おいしなそう'], 'い-adjective: drop い, add そう: looks ~.'],
    ['あの こは ＿＿な かおを して いる。', 'That child has a sad-looking face.', 'かなしそう', ['かなしいそう', 'かなしくそう', 'かなしさそう'], 'そう works like a な-adjective: かなしそうな かお.'],
    ['あたまが ＿＿ので、きょうは やすみます。', "My head hurts, so I'm resting today.", 'いたい', ['いたくて', 'いたいな', 'いたく'], 'Plain form + ので: because (softer than から).'],
    ['くすりを のんだ＿＿、まだ ねつが あります。', 'Even though I took medicine, I still have a fever.', 'のに', ['ので', 'から', 'まで'], 'のに: even though (with surprise or disappointment).'],
    ['かぜを ひいたら、＿＿ ほうが いいですよ。', "If you catch a cold, you'd better rest.", 'やすんだ', ['やすみた', 'やすった', 'やすいた'], 'た-form + ほうがいい: you had better. 休む → 休んだ.'],
    ['いもうとは あたらしい ゲームを ＿＿ います。', 'My little sister wants the new game.', 'ほしがって', ['ほしくて', 'ほしいて', 'ほしかって'], "Someone else's wants take 〜がる: ほしがっている."],
    ['しけんに ごうかくして、とても ＿＿です。', "I passed the exam and I'm very happy.", 'うれしい', ['うれしく', 'うれしくて', 'うれしいな'], "Your own feelings: うれしい. Someone else's: うれしそう (looks happy)."],
    ['けがを しない ように、きを ＿＿ ください。', 'Be careful not to get hurt.', 'つけて', ['つける', 'つけ', 'つけた'], '〜ないように: so as not to. 気をつけてください: please be careful.'],
  ],
  8: [
    ['ここから ふじさんが ＿＿。', 'You can see Mt Fuji from here.', 'みえます', ['みせます', 'みます', 'みえられます'], '見える: to be visible, on its own. 見る needs を: ふじさんを みる.'],
    ['とおくで かみなりが ＿＿。', 'I can hear thunder in the distance.', 'きこえます', ['ききます', 'きかせます', 'きこえります'], '聞こえる: to be audible. 聞く needs を.'],
    ['わたしは およぐ ＿＿が できます。', 'I can swim.', 'こと', ['もの', 'ところ', 'ため'], 'Dictionary form + ことができる: can do.'],
    ['さかなは なまで ＿＿か。', 'Can you eat fish raw?', 'たべられます', ['たべらります', 'たべります', 'たべれられます'], 'Group 2 potential: drop る, add られる. (Casual speech often says たべれる.)'],
    ['きのう、かえりみちで あめに ＿＿。', 'Yesterday I got caught in the rain on the way home.', 'ふられました', ['ふりました', 'ふらせました', 'ふれました'], 'Suffering passive: 雨に降られた, the rain fell on me (and I minded).'],
    ['いぬに てを ＿＿。', 'I was bitten on the hand by a dog.', 'かまれました', ['かみました', 'かむれました', 'かめました'], 'Passive: Xに Yを 〜られる. 噛む → 噛まれる (あ-row + れる).'],
    ['はるに なると、＿＿ なります。', 'When spring comes, it gets warm.', 'あたたかく', ['あたたかい', 'あたたかで', 'あたたかいに'], 'い-adjective + なる: drop い, add く. あたたかく なる.'],
    ['あめが やんで、そらが ＿＿ なりました。', 'The rain stopped and the sky became clear.', 'きれいに', ['きれく', 'きれいく', 'きれいで'], 'な-adjective + なる: add に. きれいに なる.'],
    ['にほんごの しんぶんが ＿＿ように なりました。', 'I have become able to read Japanese newspapers.', 'よめる', ['よむれる', 'よみれる', 'よめれる'], 'Potential + ようになる: have become able to. 読む → 読める.'],
    ['にわに はなを ＿＿。', 'I plant flowers in the garden.', 'うえます', ['うえります', 'うわります', 'うえいます'], '植える is Group 2: drop る, add ます.'],
    ['そらが くらく なって、あめが ＿＿です。', 'The sky has gone dark; it looks like rain.', 'ふりそう', ['ふれそう', 'ふらそう', 'ふろそう'], 'ます-stem + そう: looks about to. 降ります → 降りそう.'],
    ['さくらの はなが ＿＿ はじめました。', 'The cherry blossoms have started to fall.', 'ちり', ['ちる', 'ちって', 'ちら'], 'ます-stem + はじめる: start to. 散ります → 散りはじめる.'],
  ],
  9: [
    ['ははは わたしに やさいを ＿＿。', 'My mother makes me eat vegetables.', 'たべさせます', ['たべらせます', 'たべさせります', 'たべさります'], 'Causative: make or let do. Group 2: drop る, add させる.'],
    ['せんせいは がくせいに ほんを ＿＿。', 'The teacher had the students read a book.', 'よませました', ['よまさせました', 'よみさせました', 'よめさせました'], 'Group 1 causative: あ-row + せる. 読む → 読ませる.'],
    ['すみません、ここで ＿＿ ください。', 'Excuse me, please let me rest here.', 'やすませて', ['やすまさせて', 'やすまれて', 'やすみさせて'], 'Causative て-form + ください: please let me.'],
    ['ともだちが まつりに ＿＿ くれました。', 'My friend invited me to the festival.', 'さそって', ['さそいて', 'さそんで', 'さそった'], 'て-form + くれる: someone does something for me.'],
    ['わたしは いもうとに おもちゃを ＿＿ あげました。', 'I bought a toy for my little sister.', 'かって', ['かうて', 'かんで', 'かいって'], 'て-form + あげる: I do something for someone.'],
    ['せんぱいに しゃしんを ＿＿ もらいました。', 'I had my senior take a photo for me.', 'とって', ['とりて', 'とんで', 'といて'], 'Xに て-form + もらう: have X do something for me.'],
    ['おんがくを ＿＿ながら、べんきょうします。', 'I study while listening to music.', 'きき', ['きく', 'きいて', 'きか'], 'ます-stem + ながら: while doing.'],
    ['みんなで はなびを ＿＿に いきましょう。', "Let's all go to see the fireworks.", 'み', ['みる', 'みて', 'みた'], 'ます-stem + に いく: go in order to do.'],
    ['こどもに すきな ことを ＿＿ あげたいです。', 'I want to let my children do what they like.', 'させて', ['すさせて', 'しさせて', 'しせて'], 'する → させる: let or make do. させてあげる: let someone do.'],
    ['しあいに ＿＿ ために、まいにち れんしゅうして います。', 'I practise every day in order to win the match.', 'かつ', ['かって', 'かち', 'かった'], 'Dictionary form + ために: in order to.'],
    ['きのうの パーティーには ＿＿。', "I didn't go to yesterday's party.", 'いきませんでした', ['いきませんだった', 'いかないでした', 'いきなかったです'], 'Polite past negative: ません + でした.'],
    ['まつりの よる、こどもたちを おそくまで ＿＿。', 'On the night of the festival we let the children play until late.', 'あそばせました', ['あそびさせました', 'あそべさせました', 'あそばさせました'], '遊ぶ → 遊ばせる: あ-row + せる.'],
  ],
  10: [
    ['しゃちょうは もう お＿＿に なりました。', 'The company president has already gone home.', 'かえり', ['かえる', 'かえって', 'かえら'], 'Honorific: お + ます-stem + になる. お帰りになる.'],
    ['せんせいは なんと ＿＿か。', 'What did the teacher say?', 'おっしゃいました', ['もうしました', 'おっしゃりました', 'もうしあげました'], "おっしゃる: honorific \"say\", for people above you. Its ます-form is おっしゃいます, not おっしゃります."],
    ['はじめまして。コンと ＿＿。', 'How do you do. My name is Kon.', 'もうします', ['おっしゃいます', 'いらっしゃいます', 'なさいます'], '申す: the humble "to be called", for yourself only.'],
    ['どうぞ ＿＿ ください。', 'Please, help yourself (do eat).', 'めしあがって', ['いただいて', 'めしあがりて', 'まいって'], "召し上がる: honorific \"eat\". Humble いただく is only for your own eating."],
    ['あした おたくへ ＿＿も よろしいですか。', 'May I visit your home tomorrow?', 'うかがって', ['いらっしゃって', 'うかがいて', 'めしあがって'], '伺う: humble "visit", for your own action.'],
    ['しゃちょうは いま かいぎしつに ＿＿。', 'The president is in the meeting room now.', 'いらっしゃいます', ['おります', 'まいります', 'いらっしゃります'], 'いらっしゃる: honorific "be". おる is the humble one, for yourself.'],
    ['わたしが にもつを お＿＿ します。', "I'll carry your bags for you.", 'もち', ['もつ', 'もって', 'もた'], 'Humble: お + ます-stem + する. お持ちします.'],
    ['しりょうを ＿＿ いただけますか。', 'Could you please show me the documents?', 'みせて', ['みえて', 'みせ', 'みせる'], 'て-form + いただけますか: could you kindly...? (a very polite request).'],
    ['すみませんが、ここで まって いて ＿＿か。', 'Excuse me, would you mind waiting here?', 'くださいません', ['もうしません', 'まいりません', 'いたしません'], '〜てくださいませんか: a polite request.'],
    ['きょうは わたくしが ごあんない ＿＿。', 'Today I will be your guide.', 'いたします', ['なさいます', 'いらっしゃいます', 'おっしゃいます'], 'ご + する-noun + いたす: humble "do". 致す is humble する.'],
    ['おきゃくさまは なにに ＿＿か。', 'What will you have, sir?', 'なさいます', ['いたします', 'もうします', 'まいります'], "なさる: honorific する, for the customer's choice."],
    ['では、しりょうを ＿＿ します。', 'Then I will take a look at the documents.', 'はいけん', ['ごらん', 'おみ', 'おめ'], '拝見する: humble "see". ご覧になる is the honorific, for others.'],
  ],
  11: [
    ['この まちは ひとが ＿＿すぎます。', 'This town has too many people.', 'おお', ['おおい', 'おおく', 'おおか'], 'い-adjective: drop い, add すぎる: too ~.'],
    ['ゆうべ、ちょっと ＿＿すぎました。', 'I drank a bit too much last night.', 'のみ', ['のむ', 'のんで', 'のま'], 'Verb ます-stem + すぎる: do too much.'],
    ['ニュースに よると、あした ゆきが ＿＿そうです。', 'According to the news, it will snow tomorrow.', 'ふる', ['ふって', 'ふれ', 'ふろ'], 'Hearsay: plain form + そうだ, "I hear that ~". (ふりそう would mean "looks like".)'],
    ['となりの へやに だれか いる＿＿です。', 'It seems someone is in the next room.', 'よう', ['ほう', 'まで', 'ごろ'], 'Plain form + ようだ: it seems (from what I can see or hear).'],
    ['あの みせは やすくて おいしい ＿＿。', 'Apparently that shop is cheap and good.', 'らしいです', ['らしくて', 'らしいので', 'みたく'], 'らしい: apparently, I hear (from what people say).'],
    ['けんこうの ＿＿、まいにち あるいて います。', 'I walk every day for my health.', 'ために', ['ように', 'ばかり', 'ところ'], 'Noun + の + ために: for the sake of.'],
    ['にほんごの しんぶんが よめる ＿＿、まいにち べんきょうして います。', 'I study every day so that I can read Japanese newspapers.', 'ように', ['ために', 'ばかり', 'まで'], 'Potential + ように: so that I can. ために needs a verb you control.'],
    ['いま ばんごはんを たべた ＿＿です。', 'I have just eaten dinner.', 'ばかり', ['ほう', 'まま', 'ごろ'], 'た-form + ばかり: have just done.'],
    ['じこが あって、でんしゃが ＿＿ います。', 'There was an accident, and the trains are stopped.', 'とまって', ['とめて', 'とまりて', 'とめって'], 'Intransitive + ている shows the state: 止まっている.'],
    ['ぶっかが どんどん ＿＿ いきます。', 'Prices keep going up and up.', 'あがって', ['あげて', 'あがりて', 'あがんで'], 'て-form + いく: a change that carries on into the future.'],
    ['もっと やさいを たべる ＿＿ して ください。', 'Please try to eat more vegetables.', 'ように', ['ために', 'ほうに', 'ばかり'], 'Dictionary form + ようにする: make an effort to.'],
    ['どろぼうに さいふを ＿＿。', 'My wallet was stolen by a thief.', 'ぬすまれました', ['ぬすみました', 'ぬすむれました', 'ぬすめました'], 'Passive of misfortune: Xに Yを 〜られる.'],
  ],
  12: [
    ['こどもの ころ、まいにち ピアノを ＿＿。', 'As a child I was made to practise piano every day.', 'れんしゅうさせられました', ['れんしゅうされさせました', 'れんしゅうしさせました', 'れんしゅうさせれました'], 'Causative-passive: させられる, "was made to do" (unwillingly).'],
    ['せんぱいに さけを ＿＿。', 'I was made to drink sake by my senior.', 'のまされました', ['のまさせました', 'のみされました', 'のませれました'], 'Group 1: あ-row + される. 飲む → 飲まされる.'],
    ['いくら ＿＿も、ワプルは こたえない。', 'No matter how much you shout, Wapul does not answer.', 'さけんで', ['さけびて', 'さけって', 'さけいて'], 'いくら + て-form + も: no matter how much.'],
    ['ことばを わすれた ＿＿では ありません。', "It's not that I have forgotten the words.", 'わけ', ['ほう', 'まま', 'ごろ'], 'わけではない: it is not (necessarily) that ~.'],
    ['やくそくは ＿＿べきです。', 'Promises should be kept.', 'まもる', ['まもり', 'まもって', 'まもら'], 'Dictionary form + べき: should, ought to.'],
    ['あめが ＿＿も、しあいは あります。', 'Even if it rains, the match is on.', 'ふって', ['ふり', 'ふる', 'ふった'], 'て-form + も: even if.'],
    ['かれは なにも ＿＿に でて いった。', 'He went out without saying anything.', 'いわず', ['いわない', 'いいず', 'いわなく'], 'ない-stem + ず(に): without doing (written style of ないで).'],
    ['ワプルを たおさない ＿＿、ことばは もどらない。', "Unless we defeat Wapul, the words won't come back.", 'かぎり', ['ばかり', 'ほど', 'ごろ'], 'ない-form + かぎり: unless, as long as not.'],
    ['ゆうきを だして、さいごまで ＿＿ ぬきました。', 'I found my courage and fought to the very end.', 'たたかい', ['たたかう', 'たたかって', 'たたかわ'], 'ます-stem + ぬく: do to the very end.'],
    ['にほんごは わかれば わかる ＿＿、おもしろく なる。', 'The more you understand Japanese, the more fun it gets.', 'ほど', ['ばかり', 'ため', 'まま'], '〜ば〜ほど: the more ~, the more ~.'],
    ['とうを のぼる ＿＿、こえが きこえなく なった。', 'The higher I climbed the tower, the fainter the voices became.', 'につれて', ['によって', 'について', 'にとって'], 'Verb + につれて: as one thing changes, so does another.'],
    ['ひとりで ＿＿ わけが ない。みんなが いたから かてた。', "There's no way I could have won alone. I won because everyone was there.", 'かてる', ['かつれる', 'かちる', 'かとう'], 'わけがない: there is no way that ~. 勝つ → 勝てる (potential).'],
  ],
};

const GRAMMAR: Sentence[] = Object.entries(GRAMMAR_ROWS).flatMap(([d, rows]) =>
  rows.map(([text, en, answer, wrong, note], i) => ({
    id: `q-g${d}-${i + 1}`, text, en, answer, wrong, note, area: honsaiArea(Number(d)),
  })),
);

export const HONSAI_SENTENCES: readonly Sentence[] = [...GRAMMAR, ...FORGE];
export const honsaiSentencesIn = (district: number) => HONSAI_SENTENCES.filter((s) => s.area === honsaiArea(district));
/** Only the conjugation questions: the Verb Forge smith's own battles. */
export const forgeIdsUpTo = (district: number) =>
  FORGE.filter((s) => Number(s.area.replace('honsai', '')) <= district).map((s) => s.id);
