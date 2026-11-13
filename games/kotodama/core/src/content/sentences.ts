import type { LessonArea, WellArea, WordArea } from './words';

// Arc 4 context sentences: read a whole sentence and pick the word for the blank.
// Each sentence lists its OWN wrong answers, chosen by hand so that none of them
// could also complete it. Random decoys would sometimes fit, and a learner
// marked wrong for a valid answer learns the wrong lesson.
//
// Ids are `c-<n>` and are save-file keys: append new sentences, never renumber.

export interface Sentence {
  id: string;
  /** Japanese with exactly one ＿＿ blank. */
  text: string;
  /** English translation (shown as a hint under the sentence). */
  en: string;
  answer: string;
  wrong: [string, string, string];
  area: Extract<WordArea, 'foothills' | 'village' | 'monastery' | 'forest' | 'peaks'> | WellArea | LessonArea;
  /** Grammar sentences only: the rule the blank tests, shown when the answer is revealed. */
  note?: string;
}

type N4Area = Exclude<Sentence['area'], WellArea | LessonArea>;

type Row = [text: string, en: string, answer: string, wrong: [string, string, string]];

const DATA: Record<N4Area, Row[]> = {
  foothills: [
    ['わたしの＿＿は医者です。', 'My older brother is a doctor.', '兄', ['夏', '朝', '夜']],
    ['＿＿はさくらがきれいです。', 'In spring, the cherry blossoms are beautiful.', '春', ['家族', '医者', '店員']],
    ['父は＿＿です。', 'My father is an office worker.', '会社員', ['夏休み', '今夜', '冬']],
    ['ちょっと＿＿ください。', 'Please wait a moment.', '待って', ['夜中', '兄弟', '春休み']],
    ['＿＿、テレビを見ました。', 'This morning, I watched TV.', '今朝', ['待つ', '急ぐ', '始める']],
    ['＿＿は五人です。', 'My family is five people.', '家族', ['毎朝', '急ぐ', '冬休み']],
  ],
  village: [
    ['この＿＿はとてもおいしいです。', 'This cooking is very tasty.', '料理', ['黒い', '売る', '遠い']],
    ['＿＿を飲みませんか。', 'Won\'t you drink some green tea?', 'お茶', ['牛肉', '品物', '茶色']],
    ['駅はここから＿＿です。', 'The station is far from here.', '遠い', ['ご飯', '料理', '牛肉']],
    ['このかばんは＿＿です。', 'This bag is heavy.', '重い', ['飲み物', '買い物', 'お茶']],
    ['あの店で＿＿をしました。', 'I did some shopping at that shop.', '買い物', ['赤い', '弱い', '近い']],
    ['空が＿＿です。', 'The sky is blue.', '青い', ['食べ物', '品物', '牛肉']],
  ],
  monastery: [
    ['毎日、日本語を＿＿しています。', 'I study Japanese every day.', '勉強', ['病院', '答え', '頭']],
    ['この＿＿はむずかしいです。', 'This problem is difficult.', '問題', ['教える', '死ぬ', '習う']],
    ['先生に＿＿を習います。', 'I learn English from the teacher.', '英語', ['病気', '大学院', '病院']],
    ['あしたは＿＿があります。', 'There is an exam tomorrow.', '試験', ['教える', '習う', '死ぬ']],
    ['母は＿＿で入院しています。', 'My mother is in hospital with an illness.', '病気', ['答え', '文字', '漢字']],
    ['かれは子どもに日本語を＿＿。', 'He teaches Japanese to children.', '教えます', ['病院', '問題', '文学']],
  ],
  forest: [
    ['毎朝、この道を＿＿。', 'Every morning, I walk along this road.', '歩きます', ['子犬', '海外', '西洋']],
    ['六時に＿＿。', 'I get up at six.', '起きます', ['西洋', '子犬', '運転']],
    ['友だちに本を＿＿。', 'I borrow a book from a friend.', '借ります', ['走ります', '起きます', '止まります']],
    ['かれは車の＿＿が上手です。', 'He is good at driving a car.', '運転', ['子犬', '借りる', '帰る']],
    ['かぜをひいたので、早く家に＿＿。', 'I caught a cold, so I will go home early.', '帰ります', ['子犬', '西洋', '運動']],
    ['バスはここに＿＿か。', 'Does the bus stop here?', '止まります', ['歩きます', '貸します', '持ちます']],
  ],
  peaks: [
    ['この漢字の＿＿はなんですか。', 'What is the meaning of this kanji?', '意味', ['作る', '同じ', '歌う']],
    ['日曜日に＿＿を見に行きました。', 'On Sunday I went to see a film.', '映画', ['思う', '知る', '開ける']],
    ['＿＿で本を借ります。', 'I borrow books at the library.', '図書館', ['考える', '楽しい', '自分']],
    ['かれは＿＿な歌手です。', 'He is a famous singer.', '有名', ['地図', '時計', '出発']],
    ['あしたは＿＿があるので、行けません。', 'I have an errand tomorrow, so I can\'t go.', '用事', ['楽しい', '同じ', '開ける']],
    ['車に＿＿してください。', 'Please watch out for cars.', '注意', ['世界', '本屋', '映画館']],
  ],
};

export const SENTENCES: readonly Sentence[] = (Object.keys(DATA) as N4Area[])
  .flatMap((area) => (DATA[area] as Row[]).map(([text, en, answer, wrong]) => ({ text, en, answer, wrong, area })))
  .map((s, n) => ({ ...s, id: `c-${n + 1}` }));

// ── The Well of Old Tales, floor 3: grammar in plain hiragana. ─────────────
// One particle or one verb ending per sentence. Ids are `g-<n>` (append, never
// renumber) and are kept OUT of `SENTENCES`, which is exactly the N4 exam set.
// Same rule as above: no wrong answer may also complete the sentence.
type GrammarRow = [text: string, en: string, answer: string, wrong: [string, string, string], note: string];

const GRAMMAR_DATA: GrammarRow[] = [
  ['ねこ＿＿さかなをたべます。', 'The cat eats fish.', 'は', ['を', 'に', 'で'], 'は marks the topic: what the sentence is about.'],
  ['みず＿＿のみます。', 'I drink water.', 'を', ['に', 'へ', 'や'], 'を marks the thing the verb acts on.'],
  ['やま＿＿いきます。', 'I go to the mountain.', 'に', ['が', 'や', 'の'], 'に marks where you are going.'],
  ['うみ＿＿およぎます。', 'I swim in the sea.', 'で', ['が', 'の', 'や'], 'で marks where an action happens.'],
  ['ともだち＿＿はなします。', 'I talk with a friend.', 'と', ['を', 'で', 'や'], 'と means "with" a person.'],
  ['これはわたし＿＿ほんです。', 'This is my book.', 'の', ['を', 'に', 'で'], 'の joins owner and thing: わたしの = my.'],
  ['いぬ＿＿ねこがいます。', 'There are a dog and a cat.', 'と', ['を', 'で', 'に'], 'と also joins two nouns: A and B.'],
  ['あさ＿＿よるまでねます。', 'I sleep from morning until night.', 'から', ['を', 'が', 'へ'], 'から = from, まで = until.'],
  ['わたし＿＿いきます。', 'I will go too.', 'も', ['を', 'に', 'で'], 'も means "too", and replaces は.'],
  ['これはなんです＿＿。', 'What is this?', 'か', ['を', 'に', 'で'], 'か at the end turns a sentence into a question.'],
  ['きのう、ももを＿＿。', 'Yesterday, I ate a peach.', 'たべました', ['たべます', 'たべません', 'たべましょう'], 'ました is the polite past.'],
  ['あした、うみへ＿＿。', 'Tomorrow, I will go to the sea.', 'いきます', ['いきました', 'いきませんでした', 'きました'], 'ます covers the present and the future.'],
  ['さかなはぜんぜん＿＿。', 'I do not eat fish at all.', 'たべません', ['たべます', 'たべました', 'たべましょう'], 'ません is the polite negative; ぜんぜん needs it.'],
  ['さあ、いっしょに＿＿！', "Come on, let's go together!", 'いきましょう', ['いきました', 'いきません', 'いきませんでした'], 'ましょう means "let\'s".'],
  ['みずを＿＿ください。', 'Please drink water.', 'のんで', ['のむ', 'のみます', 'のんだ'], 'The て-form + ください makes a polite request.'],
  ['ここで＿＿ください。', 'Please wait here.', 'まって', ['まつ', 'まちます', 'まった'], 'まつ becomes まって: つ turns into って.'],
  ['つきが＿＿です。', 'The moon is beautiful.', 'きれい', ['きれいな', 'きれいに', 'きれいの'], 'きれい drops its な before です.'],
  ['このももは＿＿です。', 'This peach is big.', 'おおきい', ['おおきく', 'おおきな', 'おおきくて'], 'An い-adjective goes straight before です.'],
  ['やまにねこが＿＿。', 'There is a cat on the mountain.', 'います', ['あります', 'です', 'します'], 'います is "there is" for living things.'],
  ['むらにかわが＿＿。', 'There is a river in the village.', 'あります', ['います', 'です', 'します'], 'あります is "there is" for things.'],
  ['おにがこわい＿＿、かえります。', "Because the ogre is scary, I'm going home.", 'から', ['を', 'に', 'へ'], 'After a sentence, から means "because".'],
  ['あめです＿＿、いきます。', 'It is raining, but I will go.', 'が', ['を', 'に', 'の'], 'After です or ます, が means "but".'],
  ['ゆきは＿＿ないです。', 'The snow is not scary.', 'こわく', ['こわい', 'こわくて', 'こわいの'], 'い becomes く before ない: こわい, こわくない.'],
  ['みずがのみ＿＿です。', 'I want to drink water.', 'たい', ['ます', 'ました', 'ません'], 'Verb stem + たい means "want to".'],
];

export const GRAMMAR: readonly Sentence[] = GRAMMAR_DATA.map(([text, en, answer, wrong, note], n) => ({
  id: `g-${n + 1}`, text, en, answer, wrong, note, area: 'well3',
}));

// ── The Terakoya: one grammar point per sentence, in course order. ─────────────
// Written in kana with a space between words, the way first-year textbooks print
// them, so the neural voice can read every one. Ids are `b-<n>` (bunpou): append,
// never renumber. Same rule again: no wrong answer may also complete the sentence
// once the English is read.
const LESSON_GRAMMAR_DATA: Record<LessonArea, GrammarRow[]> = {
  lesson1: [
    ['わたし＿＿ がくせいです。', 'I am a student.', 'は', ['を', 'に', 'で'], 'は (said "wa") marks the topic: as for me...'],
    ['たなかさんは せんせい＿＿。', 'Mr. Tanaka is not a teacher.', 'じゃありません', ['です', 'でした', 'ですか'], 'じゃありません is the polite "is not".'],
    ['これは だれ＿＿ かさですか。', 'Whose umbrella is this?', 'の', ['を', 'に', 'が'], 'だれの = whose. の joins an owner to a thing.'],
    ['すみません、 いま なんじ＿＿か。', 'Excuse me, what time is it now?', 'です', ['ます', 'が', 'を'], 'A question is a sentence + か: なんじですか.'],
    ['＿＿は わたしの かばんです。', 'That (near you) is my bag.', 'それ', ['その', 'あの', 'どの'], 'それ stands alone; その needs a noun after it.'],
    ['＿＿ とけいは いくらですか。', 'How much is that watch over there?', 'あの', ['あれ', 'あそこ', 'どれ'], 'あの + noun: that thing over there.'],
    ['トイレは ＿＿ですか。', 'Where is the toilet?', 'どこ', ['だれ', 'なん', 'いくら'], 'どこ asks where; ここ, そこ, あそこ answer it.'],
    ['その かばんは ＿＿ですか。', 'How much is that bag?', 'いくら', ['どこ', 'だれ', 'なんじ'], 'いくら asks a price.'],
    ['たなかさんは にほんじん＿＿。', 'Is Mr. Tanaka Japanese?', 'ですか', ['です', 'じゃありません', 'でした'], 'か at the end makes it a question.'],
    ['これは にほんご＿＿ ほんです。', 'This is a Japanese-language book.', 'の', ['が', 'を', 'で'], 'の joins two nouns: a book OF Japanese.'],
    ['わたしの せんこうは けいざい＿＿。', 'My major is economics.', 'です', ['ます', 'を', 'に'], 'Noun + です: A is B.'],
    ['ごご さんじ＿＿ ろくじまで はたらきます。', 'I work from 3 p.m. to 6 p.m.', 'から', ['まで', 'を', 'が'], 'から = from, まで = until.'],
  ],
  lesson2: [
    ['まいにち しちじ＿＿ おきます。', 'I get up at seven every day.', 'に', ['で', 'を', 'が'], 'に marks a clock time: しちじに = at seven.'],
    ['としょかん＿＿ ほんを よみます。', 'I read books at the library.', 'で', ['を', 'が', 'の'], 'で marks where an action happens.'],
    ['あさごはん＿＿ たべません。', "I don't eat breakfast.", 'を', ['で', 'へ', 'が'], 'を marks what you eat, drink, read or watch.'],
    ['しゅうまつ、 ともだちと えいがを ＿＿。', 'At the weekend, I saw a movie with a friend.', 'みました', ['みます', 'みません', 'みましょう'], 'ました is the polite past.'],
    ['いっしょに コーヒーを ＿＿か。', "Won't you have a coffee with me?", 'のみません', ['のみました', 'のみたい', 'のんで'], 'ませんか is a polite invitation: won\'t you...?'],
    ['がっこう＿＿ いきます。', 'I go to school.', 'へ', ['を', 'で', 'が'], 'へ (said "e") marks the direction you go. に works too.'],
    ['つくえの うえに ねこが ＿＿。', 'There is a cat on the desk.', 'います', ['あります', 'です', 'いきます'], 'います for living things, あります for objects.'],
    ['きのうは しゅくだいを ＿＿。', "Yesterday, I didn't do my homework.", 'しませんでした', ['しません', 'しました', 'します'], 'ませんでした is the polite past negative.'],
    ['たなかさん＿＿ いっしょに かえります。', 'I go home together with Mr. Tanaka.', 'と', ['を', 'で', 'へ'], 'と = with a person: たなかさんと.'],
    ['えいがを みに ＿＿。', "I'm going to go and see a movie.", 'いきます', ['たべます', 'のみます', 'あります'], 'Verb stem + に いきます = go to do it.'],
    ['わたしは にほんごを べんきょう＿＿。', 'I study Japanese.', 'します', ['です', 'あります', 'います'], 'べんきょう + します = to study.'],
    ['こうえんで ともだち＿＿ あいました。', 'I met a friend at the park.', 'に', ['を', 'が', 'で'], 'あう takes に: ともだちに あう = meet a friend.'],
  ],
  lesson3: [
    ['この ほんは ＿＿です。', 'This book is interesting.', 'おもしろい', ['おもしろく', 'おもしろな', 'おもしろくて'], 'An い-adjective goes straight before です.'],
    ['この まちは ＿＿です。', 'This town is quiet.', 'しずか', ['しずかな', 'しずかに', 'しずかい'], 'A な-adjective drops な before です.'],
    ['げんき＿＿ こどもですね。', 'What a lively child.', 'な', ['の', 'い', 'に'], 'な-adjective + な + noun: げんきな こども.'],
    ['きのうは ＿＿です。', 'Yesterday was cold.', 'さむかった', ['さむい', 'さむく', 'さむくない'], 'Past of an い-adjective: い becomes かった.'],
    ['テストは むずかしく＿＿です。', "The test wasn't difficult.", 'なかった', ['ない', 'かった', 'くない'], 'くなかった = was not: むずかしくなかった.'],
    ['わたしは ねこ＿＿ すきです。', 'I like cats.', 'が', ['を', 'に', 'で'], 'すき and きらい take が.'],
    ['まどを ＿＿ ください。', 'Please open the window.', 'あけて', ['あける', 'あけます', 'あけた'], 'て-form + ください: a polite request.'],
    ['ここで しゃしんを とって＿＿ですか。', 'May I take a photo here?', 'もいい', ['ください', 'います', 'から'], 'て-form + も いいですか = may I...?'],
    ['ここで たべては ＿＿。', "You mustn't eat here.", 'いけません', ['ください', 'います', 'いいです'], 'て-form + は いけません = must not.'],
    ['あさ おきて、 シャワーを ＿＿、 がっこうへ いきます。', 'In the morning I get up, shower, and go to school.', 'あびて', ['あびます', 'あびる', 'あびた'], 'The て-form joins actions in order.'],
    ['ひま＿＿、 えいがを みましょう。', "Since we're free, let's watch a movie.", 'だから', ['から', 'です', 'な'], 'A な-adjective or noun needs だ before から.'],
    ['やす＿＿ おいしい みせです。', "It's a cheap and tasty shop.", 'くて', ['い', 'の', 'な'], 'An い-adjective joins the next with くて: やすくて.'],
  ],
  lesson4: [
    ['いま、 ともだちと はなして＿＿。', "I'm talking with a friend now.", 'います', ['あります', 'ください', 'ました'], 'て-form + いる = doing it right now.'],
    ['あには とうきょうに ＿＿ います。', 'My older brother lives in Tokyo.', 'すんで', ['すむ', 'すみ', 'すんだ'], 'すんで いる = lives there (an ongoing state).'],
    ['あしたは あめが ふる＿＿ おもいます。', 'I think it will rain tomorrow.', 'と', ['を', 'が', 'に'], 'Plain form + と おもいます = I think that...'],
    ['すしを たべた＿＿が ありますか。', 'Have you ever eaten sushi?', 'こと', ['もの', 'とき', 'ところ'], 'た-form + ことが ある = have done it before.'],
    ['しゅうまつは えいがを みたり、 ほんを よんだり ＿＿。', 'At weekends I do things like watching movies and reading books.', 'します', ['です', 'います', 'あります'], '～たり ～たり する = do things like A and B.'],
    ['いぬ＿＿ ねこの ほうが すきです。', 'I like cats more than dogs.', 'より', ['から', 'まで', 'を'], 'A より B の ほうが = B more than A.'],
    ['でんわばんごうを ＿＿ ください。', "Please don't forget the phone number.", 'わすれないで', ['わすれて', 'わすれない', 'わすれなくて'], 'ない-form + で ください = please don\'t.'],
    ['きのう、 がっこうへ ＿＿。', 'I went to school yesterday. (casual)', 'いった', ['いく', 'いかない', 'いって'], 'The plain past of いく is いった (it breaks the rule).'],
    ['たなかさんは あした こない＿＿ いって いました。', "Mr. Tanaka said he won't come tomorrow.", 'と', ['を', 'が', 'に'], '～と いって いました reports what someone said.'],
    ['あめが ＿＿、 うちに います。', "If it rains, I'll stay home.", 'ふったら', ['ふって', 'ふる', 'ふった'], 'た-form + ら = if, or when.'],
    ['この なかで なに＿＿ いちばん すきですか。', 'Of these, which do you like most?', 'が', ['を', 'は', 'で'], 'A question word takes が, never は.'],
    ['あの あかい シャツを ＿＿ いる ひとは だれですか。', 'Who is that person wearing a red shirt?', 'きて', ['はいて', 'きる', 'きた'], 'きる is for the body (shirts); はく is for the legs.'],
  ],  // ── N5 wing, continued ──
  lesson5: [
    ['きのう ともだちと えいがを ＿＿。', 'I saw a movie with a friend yesterday. (casual)', 'みた', ['みる', 'みない', 'みて'], 'The plain past of みる is みた: drop る, add た.'],
    ['しゅくだいは もう ＿＿か。', 'Have you done the homework already?', 'しました', ['します', 'しません', 'して'], 'もう + past = already.'],
    ['いいえ、 まだ ＿＿。', "No, I haven't done it yet.", 'していません', ['しました', 'します', 'していました'], 'まだ ～て いません = not yet.'],
    ['でんしゃと バスと どちら＿＿ はやいですか。', 'Which is faster, the train or the bus?', 'が', ['を', 'は', 'に'], 'どちらが: which of two. A question word takes が.'],
    ['きせつの なかで ＿＿ いちばん すきですか。', 'Of the seasons, which do you like best?', 'いつが', ['どちらが', 'だれが', 'どこが'], 'For three or more, ask with なに, どれ or いつ, not どちら.'],
    ['なつやすみに ほっかいどうへ いく ＿＿です。', 'I plan to go to Hokkaido in the summer holidays.', 'つもり', ['ため', 'こと', 'ほう'], 'Plain form + つもりです = I plan to.'],
    ['へやが ＿＿ なりました。', 'The room became clean.', 'きれいに', ['きれい', 'きれいな', 'きれく'], 'な-adjective + に なる = become; い-adjectives take く.'],
    ['あそこで ほんを ＿＿ ひとは だれですか。', 'Who is the person reading a book over there?', 'よんでいる', ['よみ', 'よんで', 'よむの'], 'A verb phrase right before a noun describes it.'],
    ['やすみに どこか＿＿ いきましたか。', 'Did you go anywhere on your holiday?', 'へ', ['を', 'で', 'と'], 'どこか = somewhere.'],
    ['いいえ、 どこにも ＿＿。', "No, I didn't go anywhere.", 'いきませんでした', ['いきました', 'いきます', 'いって'], 'どこにも needs a negative verb: nowhere.'],
    ['じてんしゃ＿＿ がっこうへ いきます。', 'I go to school by bicycle.', 'で', ['を', 'が', 'の'], 'で marks the means: by bicycle, by train.'],
    ['しろい かばんと くろい かばんが あります。 くろい＿＿ を ください。', "There's a white bag and a black bag. The black one, please.", 'の', ['を', 'が', 'に'], 'の stands in for a noun already mentioned: くろいの = the black one.'],
  ],
  lesson6: [
    ['どうしたんですか。 あたまが いたい＿＿。', "What's wrong? / I've got a headache, you see.", 'んです', ['ます', 'でした', 'ましょう'], '～んです explains the situation: it is that...'],
    ['ケーキを たべ＿＿ました。', 'I ate too much cake.', 'すぎ', ['たい', 'ながら', 'そう'], 'Verb stem + すぎる = too much: たべすぎる = overeat.'],
    ['この くつは ＿＿すぎます。', 'These shoes are too big.', 'おおき', ['おおきい', 'おおきく', 'おおきな'], 'An い-adjective drops い before すぎる.'],
    ['ねつが あるなら、 くすりを ＿＿ ほうが いいですよ。', "If you have a fever, you'd better take medicine.", 'のんだ', ['のんで', 'のみ', 'のめ'], 'た-form + ほうが いい = you had better.'],
    ['ねつが ある＿＿、 きょうは やすみます。', "Since I have a fever, I'll rest today.", 'ので', ['のに', 'のは', 'のを'], '～ので gives a reason, softer than から.'],
    ['あしたは テストなので、 べんきょうし＿＿ いけません。', 'There is a test tomorrow, so I must study.', 'なければ', ['ても', 'たら', 'ないで'], 'ない-stem + なければ いけません = must.'],
    ['あしたは あめが ふる＿＿か。', 'Do you think it will rain tomorrow?', 'でしょう', ['ます', 'ません', 'ました'], 'でしょうか asks politely for a guess.'],
    ['こどもの ＿＿、 よく かぜを ひきました。', 'When I was a child, I often caught colds.', 'とき', ['まえ', 'ほう', 'こと'], 'Noun + の とき = when (I was) ...'],
    ['きょうは なにも たべたく＿＿。', "I don't want to eat anything today.", 'ありません', ['です', 'います', 'ました'], 'たい bends like an い-adjective: たべたく ありません.'],
    ['びょういんへ いった ほうが いいですか。 いいえ、 いかなくても ＿＿。', "Should I go to hospital? / No, you don't have to.", 'いいです', ['いけません', 'だめです', 'ください'], 'ない-form: い → くても いい = you don\'t have to.'],
    ['ねる まえに、 くすりを ＿＿ ください。', 'Please take the medicine before going to bed.', 'のんで', ['のむ', 'のんだ', 'のみ'], 'Dictionary form + まえに = before doing.'],
    ['めが ＿＿ので、 めがねを かけます。', 'My eyes are weak, so I wear glasses.', 'わるい', ['わるく', 'わるくて', 'わるいの'], 'Before ので, an い-adjective stays as it is.'],
  ],
  // ── N4 wing ──
  lesson7: [
    ['わたしは ピアノが ＿＿。', 'I can play the piano.', 'ひけます', ['ひきます', 'ひいて', 'ひけ'], 'Potential form: ひく → ひける. Its object usually takes が.'],
    ['にほんごで てがみが ＿＿。', 'I can write a letter in Japanese.', 'かけます', ['かきます', 'かいて', 'かかせます'], 'う-verbs: last sound u → e, then る: かく → かける.'],
    ['なっとうが たべ＿＿か。', 'Can you eat natto?', 'られます', ['られて', 'させます', 'ろ'], 'る-verbs: drop る, add られる: たべられる.'],
    ['この へやは ひろい＿＿、 あかるいし、 いい へやです。', 'This room is spacious, bright too; a good room.', 'し', ['を', 'に', 'の'], '～し lists reasons: and what is more...'],
    ['この ケーキは おいし＿＿です。', 'This cake looks delicious.', 'そう', ['よう', 'らしい', 'みたい'], 'い-adjective minus い + そう = looks...'],
    ['あめが ふり＿＿です。', 'It looks like it is about to rain.', 'そう', ['よう', 'たい', 'ます'], 'Verb stem + そうです = looks about to.'],
    ['この ふくを きて ＿＿ いいですか。', 'May I try this on?', 'みても', ['いても', 'あっても', 'しても'], '～て みる = try doing it.'],
    ['すし＿＿、 あの みせが おいしいですよ。', "If it's sushi you want, that shop is good.", 'なら', ['から', 'まで', 'ので'], 'Noun + なら: if it is ~, then here is a suggestion.'],
    ['わたしは あたらしい じてんしゃが ＿＿です。', 'I want a new bicycle.', 'ほしい', ['たい', 'ほしく', 'ほしさ'], 'ほしい = want a thing; たい = want to do.'],
    ['あしたは あめが ふる＿＿ しれません。', 'It might rain tomorrow.', 'かも', ['から', 'まで', 'より'], '～かもしれません = maybe, might.'],
    ['ともだちが わたしに ほんを ＿＿。', 'My friend gave me a book.', 'くれました', ['あげました', 'もらいました', 'いただきました'], 'くれる: someone gives to me. あげる: I give to someone.'],
    ['つかれたなら、 すこし やすんだら ＿＿ですか。', "If you're tired, why not rest a little?", 'どう', ['なに', 'どこ', 'いつ'], '～たら どうですか = why don\'t you...?'],
  ],
  lesson8: [
    ['いっしょに ＿＿。', "Let's go together. (casual)", 'いこう', ['いく', 'いけ', 'いきょう'], 'Volitional form: いく → いこう, the casual "let\'s".'],
    ['らいねん にほんへ ＿＿と おもって います。', "I'm thinking of going to Japan next year.", 'いこう', ['いけ', 'いき', 'いって'], 'Volitional + と おもって いる = I\'m thinking of doing.'],
    ['りょこうの まえに、 ホテルを よやくして ＿＿。', "Before the trip, I'll book the hotel in advance.", 'おきます', ['あります', 'いました', 'しまいました'], '～て おく = do it in advance, ready for later.'],
    ['これは ははが ＿＿ セーターです。', 'This is a sweater my mother knitted.', 'あんだ', ['あんで', 'あみ', 'あむ'], 'A whole sentence can describe a noun: ははが あんだ セーター.'],
    ['ともだちが にもつを もって ＿＿。', 'My friend carried my luggage for me.', 'くれました', ['あげました', 'もらいました', 'いただきました'], '～て くれる: someone does something for me.'],
    ['わたしは あねに しゅくだいを てつだって ＿＿。', 'I had my older sister help me with my homework.', 'もらいました', ['くれました', 'あげました', 'ください'], '～て もらう: I get someone to do it for me.'],
    ['すみません、 しゃしんを とって ＿＿か。', 'Excuse me, could you take a photo for me?', 'いただけません', ['いただきません', 'あげません', 'くれました'], '～て いただけませんか: a very polite request.'],
    ['あしたは はれる＿＿ いいですね。', 'I hope it is sunny tomorrow.', 'と', ['が', 'を', 'に'], '～と いいですね = I hope that...'],
    ['にほんへ いく ＿＿、 カメラを かいました。', 'I bought a camera when I was about to go to Japan.', 'とき', ['あと', 'ほう', 'こと'], 'いく とき: before arriving. いった とき: after arriving.'],
    ['おそく なって、 ＿＿。', 'Sorry for being late.', 'すみませんでした', ['ください', 'ましょう', 'ません'], '～て すみませんでした = sorry for doing...'],
    ['きのう ＿＿ ひとは やまださんです。', 'The person I met yesterday is Mr. Yamada.', 'あった', ['あう', 'あって', 'あい'], 'た-form before a noun: きのう あった ひと.'],
    ['わすれものを ＿＿ ひとは、 じむしょへ きて ください。', 'Anyone who left something behind, please come to the office.', 'した', ['する', 'して', 'しよう'], 'わすれものを した ひと = the person who left something.'],
  ],
  lesson9: [
    ['てんきよほうに よると、 あしたは ゆきが ふる＿＿です。', 'According to the forecast, it will snow tomorrow.', 'そう', ['ため', 'まま', 'つもり'], 'Plain form + そうです = I hear that (hearsay).'],
    ['たなかさん、 らいげつ けっこんする＿＿。', "I heard Tanaka's getting married next month. (casual)", 'って', ['を', 'に', 'へ'], '～って is the casual way to pass on news.'],
    ['あした ＿＿、 こうえんへ いきましょう。', "If it's sunny tomorrow, let's go to the park.", 'はれたら', ['はれて', 'はれる', 'はれた'], 'た-form + ら = if, or when.'],
    ['あしたは はやく ＿＿ いいです。', "You don't have to come early tomorrow.", 'こなくても', ['きても', 'こないで', 'きて'], 'ない-form: い → くても いい = no need to.'],
    ['あの ひとは がくせい＿＿ ですね。', 'That person looks like a student, right?', 'みたい', ['そう', 'らしく', 'ように'], 'Noun + みたい = seems like, looks like.'],
    ['ねる ＿＿、 はを みがきます。', 'I brush my teeth before going to bed.', 'まえに', ['あとで', 'てから', 'ながら'], 'Dictionary form + まえに = before.'],
    ['ばんごはんを たべて＿＿、 しゅくだいを します。', 'After eating dinner, I do my homework.', 'から', ['まで', 'ので', 'まえに'], '～て から = after doing.'],
    ['かぜで ドアが ＿＿。', 'The door opened in the wind.', 'あきました', ['あけました', 'あけます', 'あけて'], 'あく (opens by itself) takes が; あける (someone opens it) takes を.'],
    ['でんきを ＿＿ ください。', 'Please turn off the light.', 'けして', ['きえて', 'けす', 'けした'], 'けす: turn something off (を). きえる: go out by itself (が).'],
    ['さいふを わすれて ＿＿。', 'Oh no, I forgot my wallet.', 'しまいました', ['あげました', 'くれました', 'おきました'], '～て しまう = did it, and regret it (or: did it completely).'],
    ['この ボタンを おす＿＿、 ドアが あきます。', 'When you press this button, the door opens.', 'と', ['を', 'に', 'の'], 'Dictionary form + と = whenever (a natural result follows).'],
    ['おんがくを きき＿＿、 べんきょうします。', 'I study while listening to music.', 'ながら', ['たり', 'そう', 'て'], 'Verb stem + ながら = while doing.'],
  ],
  lesson10: [
    ['しゃちょうは もう おかえり＿＿か。', 'Has the president gone home already?', 'になりました', ['しました', 'いたしました', 'ください'], 'お + stem + に なる: the honorific, raising the other person.'],
    ['せんせいは なにを ＿＿か。', 'What will you have, Sensei?', 'めしあがります', ['いただきます', 'もうします', 'まいります'], 'めしあがる honours the eater; いただく lowers yourself.'],
    ['わたしは すずきと ＿＿。', 'My name is Suzuki. (humble)', 'もうします', ['おっしゃいます', 'いらっしゃいます', 'なさいます'], 'もうす is humble いう: use it about yourself.'],
    ['あした せんせいの おたくへ ＿＿。', "I'll call at your house tomorrow, Sensei. (humble)", 'うかがいます', ['いらっしゃいます', 'めしあがります', 'おっしゃいます'], 'うかがう: the humble "visit".'],
    ['てつだって ＿＿ ありがとう。', 'Thank you for helping me.', 'くれて', ['あげて', 'おいて', 'しまって'], '～て くれて ありがとう = thank you for doing it (for me).'],
    ['しけんに ごうかく できて ＿＿。', "I'm glad I passed the exam.", 'よかったです', ['ください', 'いけません', 'ほしいです'], '～て よかった = I\'m glad that...'],
    ['かれは にほんに ながく すんで いたから、 にほんごが じょうずな ＿＿です。', 'He lived in Japan a long time, so he should be good at Japanese.', 'はず', ['つもり', 'ため', 'ばかり'], '～はずです = it should be so (I expect).'],
    ['さとうを ＿＿ コーヒーを のみます。', 'I drink coffee without sugar.', 'いれないで', ['いれて', 'いれなくて', 'いれない'], 'ない-form + で = without doing.'],
    ['かいぎが なんじに おわる＿＿ わかりません。', "I don't know what time the meeting ends.", 'か', ['を', 'が', 'に'], 'A question inside a sentence ends with か.'],
    ['あした くるか ＿＿、 おしえて ください。', 'Please tell me whether you will come tomorrow.', 'どうか', ['なにか', 'だれか', 'いつか'], '～か どうか = whether or not.'],
    ['これは 「ふろしき」＿＿ ぬのです。', 'This is a cloth called a furoshiki.', 'という', ['といって', 'をいう', 'にいう'], 'Name + という + noun = a noun called Name.'],
    ['この ペンは かき＿＿です。', 'This pen is easy to write with.', 'やすい', ['にくい', 'たい', 'ながら'], 'Stem + やすい = easy to; + にくい = hard to.'],
  ],
  lesson11: [
    ['でんしゃで あしを ＿＿。', 'Someone stepped on my foot on the train.', 'ふまれました', ['ふみました', 'ふませました', 'ふんで'], 'Passive: done to you. ふむ → ふまれる.'],
    ['わたしは せんせいに ＿＿。', 'I was praised by the teacher.', 'ほめられました', ['ほめました', 'ほめさせました', 'ほめて'], 'The doer of a passive takes に: せんせいに ほめられる.'],
    ['まどが あけて ＿＿。', 'The window has been left open.', 'あります', ['います', 'おきます', 'しまいます'], 'Transitive verb + て ある = it was done and stays so.'],
    ['ははが ねて いる ＿＿、 そうじを しました。', 'While my mother was asleep, I cleaned.', 'あいだに', ['ながら', 'まえに', 'あとで'], '～あいだに = while (something else is going on).'],
    ['おとを ちいさく ＿＿ ください。', 'Please turn the sound down.', 'して', ['なって', 'あって', 'いて'], 'Adjective (く / に) + する = make it so.'],
    ['ともだちに もっと べんきょうして ＿＿です。', 'I want my friend to study more.', 'ほしい', ['たい', 'ください', 'もらい'], '～て ほしい = I want someone to do it.'],
    ['ははは わたしに やさいを ＿＿。', 'My mother made me eat vegetables.', 'たべさせました', ['たべられました', 'たべました', 'たべて'], 'Causative: make or let someone do. たべる → たべさせる.'],
    ['すこし やすませて ＿＿か。', 'Could you let me rest a little?', 'くれません', ['あげません', 'おきません', 'しまいません'], 'Causative て + くれませんか = please let me.'],
    ['はやく ＿＿なさい。', 'Go to bed early!', 'ね', ['ねる', 'ねて', 'ねた'], 'Verb stem + なさい: a parent\'s or teacher\'s command.'],
    ['くすりを ＿＿、 なおりますよ。', "If you take the medicine, you'll get better.", 'のめば', ['のんで', 'のむ', 'のめ'], 'ば-form: のむ → のめば = if you drink it.'],
    ['たくさん べんきょうした＿＿、 しけんに おちました。', 'Even though I studied a lot, I failed the exam.', 'のに', ['ので', 'から', 'ために'], '～のに = even though (and I am unhappy about it).'],
    ['こどもの ころ、 まいにち ピアノを ＿＿。', 'As a child, I was made to practise piano every day.', 'れんしゅうさせられました', ['れんしゅうさせました', 'れんしゅうしました', 'れんしゅうしたかった'], 'Causative-passive: させられる = was made to (unwillingly).'],
  ],
};

export const LESSON_GRAMMAR: readonly Sentence[] = (Object.keys(LESSON_GRAMMAR_DATA) as LessonArea[])
  .flatMap((area) => LESSON_GRAMMAR_DATA[area].map(([text, en, answer, wrong, note]) => ({ text, en, answer, wrong, note, area })))
  .map((s, n) => ({ ...s, id: `b-${n + 1}` }));

export function lessonGrammarFor(area: LessonArea): Sentence[] {
  return LESSON_GRAMMAR.filter((s) => s.area === area);
}

const BY_ID = new Map([...SENTENCES, ...GRAMMAR, ...LESSON_GRAMMAR].map((s) => [s.id, s]));

export function getSentence(id: string): Sentence {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown sentence id: ${id}`);
  return s;
}

export function sentencesForArea(area: Sentence['area']): Sentence[] {
  return SENTENCES.filter((s) => s.area === area);
}
