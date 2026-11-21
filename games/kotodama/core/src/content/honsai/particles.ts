import type { DialogueLine } from '../../world/types';
import type { Sentence } from '../sentences';

// The Hall of Joints (かんせつの ま): Honsai's particle school. Wapul's lieutenant,
// Kansetsu-nashi, stole the particles here, and every sentence fell apart into a heap
// of words. Six keepers each TEACH one group of particles (their dialogue explains the
// rules with examples) before a practice board tests it.
//
// Particles are slippery: often two fit, with different meanings. Every item here has
// one answer that fits the English, and any other particle that would ALSO be
// grammatical is left out of the wrong choices. Ids `q-p<group>-<n>`: append only.

type P = [text: string, en: string, answer: string, wrong: [string, string, string], note: string];

export interface ParticleGroup {
  n: number;
  title: string;
  keeper: { id: string; name: string; sprite: string };
  teach: DialogueLine[];
  rows: P[];
}

export const PARTICLE_GROUPS: readonly ParticleGroup[] = [
  {
    n: 1, title: 'は and が', keeper: { id: 'kanade', name: 'Kanade, keeper of は and が', sprite: 'folk:woman:kanade_waga' },
    teach: [
      { ja: 'は = わだい、が = しゅご', text: 'は (said "wa") marks the TOPIC: "as for X...". が marks the SUBJECT: who or what does it, or is it.' },
      { ja: 'だれが きましたか。', text: 'Question words always take が: だれが, なにが, どれが. And the answer takes が too: たなかさんが きました.' },
      { ja: 'ねこが います。すしが すきです。', text: 'が also goes with being somewhere (ねこが いる), liking (すしが すき), wanting (くるまが ほしい), understanding (にほんごが わかる) and ability (ピアノが できる).' },
      { ja: 'ぞうは はなが ながい。', text: 'And the pair: ぞうは はなが ながい, "as for elephants, the trunk is long". は frames it, が picks out the part. は also contrasts: さかなは たべますが、にくは たべません.' },
    ],
    rows: [
      ['たなかさん＿＿ いしゃです。', 'Mr Tanaka is a doctor.', 'は', ['を', 'に', 'で'], 'は marks the topic: "as for Mr Tanaka..."'],
      ['だれ＿＿ まどを あけましたか。', 'Who opened the window?', 'が', ['は', 'を', 'で'], 'Question words take が, never は: だれが.'],
      ['つくえの うえに ねこ＿＿ います。', 'There is a cat on the desk.', 'が', ['を', 'で', 'へ'], 'Existence: [place]に [thing]が いる / ある.'],
      ['わたしは すし＿＿ すきです。', 'I like sushi.', 'が', ['に', 'で', 'へ'], 'すき takes が: すしが すき.'],
      ['あには にほんご＿＿ わかります。', 'My brother understands Japanese.', 'が', ['に', 'で', 'へ'], 'わかる takes が: にほんごが わかる.'],
      ['さかなは たべますが、にく＿＿ たべません。', "I eat fish, but meat I don't.", 'は', ['が', 'に', 'で'], 'は for contrast: this one, not that one.'],
      ['ぞう＿＿ はなが ながいです。', 'Elephants have long trunks.', 'は', ['を', 'に', 'で'], 'XはYが: as for X, its Y is ~.'],
      ['ぞうは はな＿＿ ながいです。', 'Elephants have long trunks.', 'が', ['を', 'に', 'で'], 'In XはYが, the part (Y) takes が.'],
      ['あめ＿＿ ふって います。', "It's raining.", 'が', ['を', 'に', 'で'], 'Weather and things you notice take が: あめが ふる.'],
      ['これは わたし＿＿ つくった ケーキです。', 'This is a cake I made.', 'が', ['を', 'で', 'へ'], 'In a clause that describes a noun, the doer takes が (never は).'],
      ['どれ＿＿ あなたの かばんですか。', 'Which one is your bag?', 'が', ['は', 'を', 'に'], 'どれが: a question word as subject takes が.'],
      ['こんにちは。きょう＿＿ いい てんきですね。', "Hello. Nice weather today, isn't it.", 'は', ['を', 'で', 'へ'], 'きょうは: today as the topic.'],
      ['ピアノ＿＿ できますか。', 'Can you play the piano?', 'が', ['に', 'で', 'へ'], 'できる takes が: ピアノが できる.'],
      ['あたらしい くるま＿＿ ほしいです。', 'I want a new car.', 'が', ['に', 'で', 'へ'], 'ほしい takes が: くるまが ほしい.'],
      ['なに＿＿ いちばん すきですか。', 'What do you like best?', 'が', ['は', 'を', 'で'], 'なにが: question word + が.'],
      ['この へやに まど＿＿ ありません。', 'This room has no windows.', 'が', ['を', 'で', 'へ'], 'ある / ない take が: まどが ない.'],
    ],
  },
  {
    n: 2, title: 'を', keeper: { id: 'mokuteki', name: 'Mokuteki, keeper of を', sprite: 'folk:man:mokuteki_wo' },
    teach: [
      { ja: 'パンを たべます。', text: 'を (said "o") marks the thing a verb acts on: パンを たべる, eat bread. も and は can take its place: パンも たべる.' },
      { ja: 'こうえんを あるく。はしを わたる。', text: 'With verbs of movement, を marks the space you move THROUGH or along: walk through the park, cross the bridge, turn the corner.' },
      { ja: 'へやを でる。バスを おりる。', text: 'And the place you LEAVE: leave the room, get off the bus, graduate from school (がっこうを そつぎょうする).' },
      { ja: 'まどを あける / まどが あく', text: 'Verb pairs: あける (open something) takes を; あく (come open by itself) takes が. しめる/しまる, つける/つく work the same way.' },
    ],
    rows: [
      ['まいにち しんぶん＿＿ よみます。', 'I read the newspaper every day.', 'を', ['が', 'に', 'へ'], 'を marks what the verb acts on.'],
      ['こうえん＿＿ さんぽします。', 'I take a walk through the park.', 'を', ['が', 'の', 'へ'], 'を: the space you move through.'],
      ['はし＿＿ わたります。', 'I cross the bridge.', 'を', ['が', 'の', 'へ'], 'わたる: を marks what you cross.'],
      ['へや＿＿ でます。', 'I leave the room.', 'を', ['が', 'の', 'と'], 'を marks the place you leave.'],
      ['つぎの えきで バス＿＿ おります。', 'I get off the bus at the next stop.', 'を', ['が', 'の', 'と'], 'おりる: を marks what you get off.'],
      ['コーヒー＿＿ ください。', 'A coffee, please.', 'を', ['が', 'に', 'で'], 'Xを ください: please give me X.'],
      ['ははに てがみ＿＿ かきました。', 'I wrote a letter to my mother.', 'を', ['が', 'で', 'へ'], 'The letter is what is written: を.'],
      ['えきで ともだち＿＿ まちます。', 'I wait for my friend at the station.', 'を', ['が', 'で', 'の'], 'まつ takes を: ともだちを まつ.'],
      ['かぎ＿＿ なくしました。', 'I lost my key.', 'を', ['が', 'で', 'へ'], 'なくす (lose something) takes を.'],
      ['だいがくで れきし＿＿ べんきょうして います。', 'I study history at university.', 'を', ['が', 'で', 'へ'], 'What you study takes を.'],
      ['ドア＿＿ しめて ください。', 'Please close the door.', 'を', ['が', 'で', 'の'], 'しめる (close something) takes を.'],
      ['つぎの かど＿＿ みぎに まがって ください。', 'Please turn right at the next corner.', 'を', ['が', 'で', 'の'], 'まがる: を marks the corner you go round.'],
      ['かぜで まど＿＿ あきました。', 'The window blew open in the wind.', 'が', ['を', 'で', 'へ'], 'あく (come open by itself) takes が.'],
      ['あつかったので、まど＿＿ あけました。', 'It was hot, so I opened the window.', 'を', ['が', 'で', 'へ'], 'あける (open something) takes を.'],
    ],
  },
  {
    n: 3, title: 'に and で', keeper: { id: 'basho', name: 'Basho, keeper of に and で', sprite: 'folk:oldman:basho_nide' },
    teach: [
      { ja: 'に: とき・いきさき・ばしょ・あいて', text: 'に is a point: a clock time (しちじに), where you go (がっこうに いく), where something IS (いえに いる), who receives (ともだちに あげる), and why you go (かいものに いく).' },
      { ja: 'で: どうさの ばしょ・どうぐ', text: 'で is a stage and a tool: where an action HAPPENS (としょかんで べんきょうする), by what means (はしで, バスで, にほんごで), a cause (かぜで やすむ), and "altogether" (ぜんぶで).' },
      { ja: 'こうえんに いる / こうえんで あそぶ', text: 'The test: is it just BEING there (に) or DOING something there (で)? こうえんに こどもが いる. こうえんで こどもが あそぶ.' },
      { ja: 'にちようびに / きょう', text: 'Days and dates take に (にちようびに). Words relative to now take nothing: きょう, あした, まいにち, らいしゅう.' },
    ],
    rows: [
      ['まいあさ ろくじ＿＿ おきます。', 'I get up at six every morning.', 'に', ['で', 'を', 'が'], 'A clock time takes に.'],
      ['としょかん＿＿ べんきょうします。', 'I study at the library.', 'で', ['に', 'を', 'が'], 'で: where the action happens.'],
      ['としょかん＿＿ ほんが たくさん あります。', 'There are lots of books in the library.', 'に', ['で', 'を', 'が'], 'Existence takes に: where something IS.'],
      ['すしは はし＿＿ たべます。', 'I eat sushi with chopsticks.', 'で', ['に', 'を', 'が'], 'で: the tool or means.'],
      ['まいにち バス＿＿ がっこうへ いきます。', 'Every day I go to school by bus.', 'で', ['に', 'を', 'が'], 'で: how you travel.'],
      ['ゆっくり にほんご＿＿ はなして ください。', 'Please speak slowly, in Japanese.', 'で', ['に', 'を', 'が'], 'で: the language you use.'],
      ['ともだち＿＿ はなを あげました。', 'I gave a friend some flowers.', 'に', ['で', 'を', 'が'], 'に: the one who receives.'],
      ['デパート＿＿ くつを かいました。', 'I bought shoes at the department store.', 'で', ['に', 'を', 'が'], 'で: where you did the buying.'],
      ['デパートへ かいもの＿＿ いきます。', 'I am going to the department store to shop.', 'に', ['で', 'を', 'が'], 'Purpose: [noun/verb stem]に いく.'],
      ['こうえん＿＿ こどもが あそんで います。', 'Children are playing in the park.', 'で', ['に', 'を', 'が'], 'Doing something there: で.'],
      ['こうえん＿＿ こどもが たくさん います。', 'There are lots of children in the park.', 'に', ['で', 'を', 'が'], 'Just being there: に.'],
      ['かぜ＿＿ がっこうを やすみました。', 'I missed school because of a cold.', 'で', ['に', 'を', 'が'], 'で can mark a cause.'],
      ['ぜんぶ＿＿ いくらですか。', 'How much is it altogether?', 'で', ['に', 'を', 'が'], 'ぜんぶで: altogether.'],
      ['わからない ことを せんせい＿＿ ききました。', 'I asked the teacher what I did not understand.', 'に', ['で', 'を', 'が'], 'に: the person you ask or tell.'],
      ['にちようび＿＿ えいがを みます。', "On Sunday I'll watch a film.", 'に', ['で', 'を', 'が'], 'Days of the week take に.'],
      ['きょう＿＿ がっこうへ いきません。', "Today I'm not going to school.", 'は', ['に', 'で', 'を'], 'きょう, あした, まいにち never take に. Here は makes today the topic.'],
      ['えきで でんしゃ＿＿ のります。', 'I get on the train at the station.', 'に', ['で', 'を', 'が'], 'のる takes に: でんしゃに のる.'],
      ['どうぞ、きょうしつ＿＿ はいって ください。', 'Please come into the classroom.', 'に', ['で', 'を', 'が'], 'はいる takes に: へやに はいる.'],
    ],
  },
  {
    n: 4, title: 'へ, から, まで', keeper: { id: 'michi', name: 'Michi, keeper of the road', sprite: 'folk:girl:michi_road' },
    teach: [
      { ja: 'にほんへ いく', text: 'へ (said "e") points TOWARD a place: にほんへ いく. に also works for destinations; へ puts the stress on the direction.' },
      { ja: 'くじから ごじまで', text: 'から is "from", まで is "until" or "as far as": くじから ごじまで はたらく, とうきょうから おおさかまで.' },
      { ja: 'あしたまで / あしたまでに', text: 'まで is a stretch that lasts UNTIL a point. までに is a deadline: BY then. あしたまで やすむ (off until tomorrow), あしたまでに だす (hand in by tomorrow).' },
      { ja: 'くがつから すんで いる', text: 'から also means "since" (くがつから) and marks where something comes from (ははから てがみが きた).' },
    ],
    rows: [
      ['らいねん にほん＿＿ いきます。', "Next year I'm going to Japan.", 'へ', ['を', 'で', 'が'], 'へ: toward a destination (に also works).'],
      ['くじ＿＿ ごじまで はたらきます。', 'I work from nine to five.', 'から', ['まで', 'に', 'で'], 'から: from.'],
      ['くじから ごじ＿＿ はたらきます。', 'I work from nine to five.', 'まで', ['から', 'に', 'で'], 'まで: until.'],
      ['えき＿＿ あるいて じゅっぷんです。', "It's a ten-minute walk from the station.", 'から', ['に', 'を', 'が'], 'から: the starting point.'],
      ['しゅくだいは あした＿＿ だして ください。', 'Please hand in your homework by tomorrow.', 'までに', ['まで', 'から', 'に'], 'までに: by (a deadline).'],
      ['あした＿＿ やすみです。', "I'm off until tomorrow.", 'まで', ['までに', 'を', 'へ'], 'まで: a stretch lasting until.'],
      ['とうきょう＿＿ おおさかまで しんかんせんで いきます。', "I'll take the bullet train from Tokyo to Osaka.", 'から', ['まで', 'へ', 'を'], 'AからBまで: from A to B.'],
      ['はは＿＿ てがみが きました。', 'A letter came from my mother.', 'から', ['まで', 'を', 'で'], 'から: where something comes from.'],
      ['ちょっと こっち＿＿ きて ください。', 'Come over here a moment, please.', 'へ', ['を', 'で', 'が'], 'へ: toward.'],
      ['この みちを まっすぐ えき＿＿ いって ください。', 'Go straight along this road as far as the station.', 'まで', ['までに', 'から', 'を'], 'まで: as far as.'],
      ['きのうは あさ＿＿ ばんまで ねました。', 'Yesterday I slept from morning till night.', 'から', ['まで', 'に', 'を'], 'AからBまで.'],
      ['くがつ＿＿ ここに すんで います。', "I've lived here since September.", 'から', ['まで', 'に', 'を'], 'から: since.'],
      ['この みせは なんじ＿＿ あいて いますか。', 'Until what time is this shop open?', 'まで', ['までに', 'を', 'が'], 'まで: until.'],
      ['いぬが わたしの ほう＿＿ はしって きました。', 'The dog came running toward me.', 'へ', ['を', 'で', 'が'], 'へ: the direction something heads.'],
    ],
  },
  {
    n: 5, title: 'と, や, も', keeper: { id: 'tomo', name: 'Tomo, keeper of と, や and も', sprite: 'folk:boy:tomo_friend' },
    teach: [
      { ja: 'りんごと みかん / りんごや みかん', text: 'と joins a COMPLETE list: りんごと みかん, just those two. や gives examples: りんごや みかん (など), apples, oranges and so on.' },
      { ja: 'ともだちと いく。「はい」と いう。', text: 'と is also "together with" (ともだちと いく), and it marks a quote or a thought: 「はい」と いった, あめが ふると おもう.' },
      { ja: 'わたしも。にくも さかなも。', text: 'も is "also, too", and it REPLACES は, が or を: わたしも がくせいです. AもBも is "both A and B".' },
      { ja: 'だれも こない。なにも ない。', text: 'Question word + も + a negative is "no one, nothing": だれも きません, なにも たべたくない.' },
    ],
    rows: [
      ['スーパーで りんご＿＿ みかんを かいました。', 'At the supermarket I bought apples and oranges (just those).', 'と', ['も', 'を', 'で'], 'と: a complete list.'],
      ['つくえの うえに ほん＿＿ ペンなどが あります。', 'On the desk there are books, pens and so on.', 'や', ['も', 'を', 'で'], 'や…など: a few examples from a longer list.'],
      ['きのう ともだち＿＿ えいがを みました。', 'Yesterday I watched a film with a friend.', 'と', ['や', 'を', 'で'], 'と: together with.'],
      ['かれは「あした きます」＿＿ いいました。', 'He said, "I\'ll come tomorrow."', 'と', ['を', 'に', 'で'], 'と marks a quote: 「…」と いう.'],
      ['あしたは あめが ふる＿＿ おもいます。', 'I think it will rain tomorrow.', 'と', ['を', 'に', 'が'], '…と おもう: think that ….'],
      ['わたし＿＿ にほんごを べんきょうして います。', "I'm studying Japanese too.", 'も', ['を', 'で', 'へ'], 'も (too) replaces は.'],
      ['にく＿＿ さかなも たべます。', 'I eat both meat and fish.', 'も', ['を', 'で', 'へ'], 'AもBも: both A and B.'],
      ['パーティーに だれ＿＿ きませんでした。', 'Nobody came to the party.', 'も', ['を', 'で', 'へ'], 'だれも + negative: nobody.'],
      ['おなかが いっぱいで、なに＿＿ たべたくないです。', "I'm full: I don't want to eat anything.", 'も', ['を', 'で', 'へ'], 'なにも + negative: nothing.'],
      ['これは「さくら」＿＿ いう はなです。', 'This is a flower called "sakura".', 'と', ['を', 'に', 'で'], 'XというY: a Y called X.'],
      ['ねこ＿＿ いぬと どちらが すきですか。', 'Which do you like better, cats or dogs?', 'と', ['や', 'も', 'を'], 'AとBと どちらが…: which of A and B?'],
      ['きのうも きょう＿＿ あめでした。', 'It rained yesterday and today too.', 'も', ['を', 'で', 'へ'], 'も: also, too.'],
      ['きょねん かのじょ＿＿ けっこんしました。', 'I married her last year.', 'と', ['を', 'に', 'や'], 'けっこんする takes と: かのじょと けっこんする.'],
      ['ぼく＿＿ いっしょに あそぼう。', 'Play with me!', 'と', ['を', 'に', 'で'], 'と いっしょに: together with.'],
    ],
  },
  {
    n: 6, title: 'の, か, ね, よ', keeper: { id: 'owari', name: 'Owari, keeper of the endings', sprite: 'folk:oldwoman:owari_end' },
    teach: [
      { ja: 'わたしの ともだち。にほんごの ほん。', text: 'の joins nouns: わたしの ともだち (my friend), にほんごの ほん (a Japanese-language book), にほんの くるま (a Japanese car).' },
      { ja: 'あかいの。かくのが すき。', text: 'の can also be "the one" (あかいの, the red one) or turn a verb into a thing: えを かくのが すき, I like drawing.' },
      { ja: 'ですか。コーヒーか こうちゃ。', text: 'か ends a question (ですか), means "or" between nouns (コーヒーか こうちゃ), and wraps a question inside a sentence: いつ くるか わからない.' },
      { ja: 'いい てんきですね。あぶないですよ！', text: 'ね asks the listener to agree: "isn\'t it?". よ tells them something they may not know: "you know", "I tell you". Wrong ending, wrong feeling.' },
    ],
    rows: [
      ['わたし＿＿ ともだちは がくせいです。', 'My friend is a student.', 'の', ['は', 'を', 'に'], 'の: whose. わたしの ともだち.'],
      ['ほんやで にほんご＿＿ ほんを かいました。', 'At the bookshop I bought a Japanese book.', 'の', ['を', 'に', 'で'], 'の links nouns: a book of Japanese.'],
      ['わたしは えを かく＿＿が すきです。', 'I like drawing.', 'の', ['を', 'に', 'で'], 'Verb + の makes it a thing: drawing.'],
      ['すみません、あれは ふじさんです＿＿。', 'Excuse me, is that Mount Fuji?', 'か', ['を', 'に', 'で'], 'か ends a question.'],
      ['のみものは コーヒー＿＿ こうちゃ、どちらに しますか。', 'For a drink: coffee or tea, which will you have?', 'か', ['も', 'を', 'で'], 'AかB: A or B.'],
      ['きょうは いい てんきです＿＿。', "It's lovely weather today, isn't it?", 'ね', ['を', 'に', 'で'], 'ね: inviting agreement.'],
      ['あ、その みちは あぶないです＿＿！', "Oh, that road is dangerous, you know!", 'よ', ['を', 'に', 'で'], 'よ: telling someone what they may not know.'],
      ['かれが いつ くる＿＿ わかりません。', "I don't know when he will come.", 'か', ['を', 'に', 'で'], 'A question inside a sentence: いつ くるか.'],
      ['あの あかい＿＿は わたしのです。', 'That red one is mine.', 'の', ['を', 'に', 'で'], 'の = "the one": あかいの.'],
      ['これは にほん＿＿ くるまです。', 'This is a Japanese car.', 'の', ['を', 'に', 'で'], 'にほんの くるま: a car of Japan.'],
      ['おなかが すきましたね。なにか たべます＿＿。', "We're hungry, aren't we. Shall we eat something?", 'か', ['を', 'に', 'で'], 'か ends a question (here, an offer).'],
      ['たなかさん＿＿ ねこは しろいです。', "Mr Tanaka's cat is white.", 'の', ['を', 'で', 'へ'], 'の: whose.'],
      ['この りょうり、おいしいです＿＿。', "This food is delicious, isn't it?", 'ね', ['を', 'に', 'で'], 'ね: sharing a feeling.'],
      ['あしたは やすみです＿＿。しって いましたか。', "Tomorrow's a holiday, you know. Did you know?", 'よ', ['を', 'に', 'で'], 'よ: news for the listener.'],
    ],
  },
];

export const JOINTS_AREA = 'honsai_joints';

export const PARTICLE_SENTENCES: readonly Sentence[] = PARTICLE_GROUPS.flatMap((g) =>
  g.rows.map(([text, en, answer, wrong, note], i) => ({
    id: `q-p${g.n}-${i + 1}`, text, en, answer, wrong, note, area: JOINTS_AREA,
  })),
);

/** The practice pool of one station, or of the whole hall (the Jointless). */
export const particleIds = (groups: readonly number[]) =>
  PARTICLE_SENTENCES.filter((s) => groups.includes(Number(s.id.split('-')[1]!.slice(1)))).map((s) => s.id);
