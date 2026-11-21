import type { Passage } from './passages';
import type { WellArea } from './words';
import { FOLK_TALES } from './folktales';

// The Well of Old Tales: four Japanese folk tales (mukashi-banashi) to READ, not
// to be tested on while reading. Each is retold here in plain hiragana with a
// space between words, the way a first picture book prints them, one short page
// at a time with its English beside it.
//
// The tales themselves are centuries old and belong to everyone; the wording of
// these retellings was written for this game.
//
// A floor's guardian only appears once its tale has been read (flag `read_<id>`),
// and then asks about it: each tale has two comprehension passages, ids `t-<n>`
// (save-file keys: append, never renumber).

export interface TalePage {
  /** Kana, with a space between words. */
  ja: string;
  en: string;
  /** The same page written with kanji, as an adult would print it (optional). */
  kanji?: string;
}

export interface Tale {
  id: string;
  title: string;
  titleJa: string;
  /** Where it is read: a floor of the well, or a signboard out in the world. */
  area: WellArea | 'board';
  pages: TalePage[];
}

const p = (ja: string, en: string): TalePage => ({ ja, en });

export const TALES: readonly Tale[] = [
  {
    id: 'momotaro', title: 'Momotaro, the Peach Boy', titleJa: 'ももたろう', area: 'well1',
    pages: [
      p('むかし むかし、 ある ところに、 おじいさんと おばあさんが いました。', 'Long, long ago, in a certain place, there lived an old man and an old woman.'),
      p('あるひ、 おばあさんは かわで おおきな ももを みつけました。', 'One day, the old woman found a huge peach in the river.'),
      p('ももを きると、 なかから げんきな おとこのこが でて きました。 なまえは ももたろうです。', 'When they cut the peach, a lively boy came out of it. His name was Momotaro.'),
      p('おおきく なった ももたろうは いいました。 「わるい おにを たいじしに いきます。」', 'When he had grown, Momotaro said: "I am going to defeat the wicked ogres."'),
      p('おばあさんは きびだんごを つくりました。 みちで いぬと さると きじが なかまに なりました。', 'The old woman made millet dumplings. On the road a dog, a monkey and a pheasant joined him.'),
      p('みんなで ちからを あわせて、 おにがしまの おにと たたかいました。 おには 「まいった！」 と いいました。', 'Joining their strength, they fought the ogres of Ogre Island. "We give up!" the ogres cried.'),
      p('ももたろうは たからを もって むらへ かえりました。 みんな しあわせに くらしました。 めでたし めでたし。', 'Momotaro carried the treasure home to the village, and everyone lived happily. And so it ends well.'),
    ],
  },
  {
    id: 'urashima', title: 'Urashima Taro', titleJa: 'うらしまたろう', area: 'well2',
    pages: [
      p('むかし むかし、 うらしまたろうと いう わかい りょうしが いました。', 'Long, long ago, there was a young fisherman called Urashima Taro.'),
      p('あるひ、 はまべで こどもたちが かめを いじめて いました。 たろうは かめを たすけました。', 'One day, children were tormenting a turtle on the beach. Taro rescued it.'),
      p('つぎのひ、 かめが きて いいました。 「おれいに、 りゅうぐうじょうへ つれて いきます。」', 'The next day the turtle came and said: "In thanks, I will take you to the Dragon Palace."'),
      p('うみの そこの おしろには、 うつくしい おとひめさまが いました。 まいにち、 おどりと ごちそうで たのしく すごしました。', 'In the castle at the bottom of the sea lived the beautiful Princess Otohime. Every day passed happily in dancing and feasting.'),
      p('でも、 たろうは むらに かえりたく なりました。 おとひめさまは はこを くれました。 「けっして あけては いけません。」', 'But Taro began to long for his village. The princess gave him a box. "You must never open it."'),
      p('むらに かえると、 しって いる ひとは だれも いません。 うみの そこの みっかは、 むらの さんびゃくねん だったのです。', 'Back in the village, there was no one he knew. Three days under the sea had been three hundred years on land.'),
      p('かなしく なった たろうは はこを あけました。 しろい けむりが でて、 たろうは おじいさんに なりました。', 'In his sorrow, Taro opened the box. White smoke poured out, and Taro became an old man.'),
    ],
  },
  {
    id: 'tsuru', title: 'The Grateful Crane', titleJa: 'つるの おんがえし', area: 'well3',
    pages: [
      p('むかし むかし、 ゆきの ふる ひに、 わかものが わなに かかった つるを たすけました。', 'Long, long ago, on a snowy day, a young man freed a crane caught in a trap.'),
      p('その よる、 うつくしい むすめが きて いいました。 「みちに まよいました。 とめて ください。」', 'That night a beautiful girl came and said: "I have lost my way. Please let me stay."'),
      p('むすめは いいました。 「ぬのを おります。 けっして へやを のぞかないで ください。」', 'The girl said: "I will weave cloth. Please, never look into the room."'),
      p('とん からり、 とん からり。 みっか たって、 むすめは それは きれいな ぬのを もって でて きました。 ぬのは たかく うれました。', 'Clack, clatter, clack, clatter. After three days she came out with the loveliest cloth. It sold for a high price.'),
      p('でも、 むすめは だんだん やせて いきます。 しんぱいに なった わかものは、 へやを のぞいて しまいました。', 'But the girl grew thinner and thinner. Worried, the young man looked into the room after all.'),
      p('そこには いちわの つるが いて、 じぶんの はねで ぬのを おって いました。', 'There stood a single crane, weaving the cloth from its own feathers.'),
      p('「わたしは あの ときの つるです。 みられたので、 もう ここには いられません。」 つるは そらへ とんで いきました。', '"I am the crane from that day. Now that I have been seen, I can stay here no longer." And the crane flew off into the sky.'),
    ],
  },
  {
    id: 'kaguya', title: 'Princess Kaguya', titleJa: 'かぐやひめ', area: 'well4',
    pages: [
      p('むかし むかし、 たけを とる おじいさんが いました。 あるひ、 ひかる たけを みつけました。', 'Long, long ago, there was an old man who cut bamboo. One day he found a stalk that glowed.'),
      p('たけの なかには、 ちいさな おんなのこが いました。 おじいさんと おばあさんは 「かぐやひめ」 と なづけて、 たいせつに そだてました。', 'Inside the bamboo was a tiny girl. The old man and old woman named her Kaguya-hime and raised her with great care.'),
      p('かぐやひめは すぐに おおきく なり、 とても うつくしい ひとに なりました。 ごにんの わかものが けっこんを もうしこみました。', 'Kaguya-hime grew quickly and became very beautiful. Five young men asked to marry her.'),
      p('ひめは みんなに むずかしい たからを たのみました。 でも、 だれも ほんものを もって くる ことが できませんでした。', 'The princess asked each of them for an impossible treasure. But not one could bring her the real thing.'),
      p('なつの よる、 ひめは つきを みて なきました。 「わたしは つきの みやこの ものです。 つぎの まんげつに かえらなければ なりません。」', 'One summer night the princess wept as she looked at the moon. "I belong to the capital of the moon. At the next full moon I must return."'),
      p('まんげつの よる、 つきから むかえが きました。 だれも とめる ことが できませんでした。', 'On the night of the full moon, they came from the moon to fetch her. No one could stop them.'),
      p('ひめは おじいさんと おばあさんに てがみを のこして、 つきへ かえって いきました。', 'The princess left a letter for the old man and the old woman, and went home to the moon.'),
    ],
  },
];

// ── Tales on signboards out in the world ─────────────────────────────────
// Readable by anyone at any time, in kana or in kanji (the reader has a switch).
// Kept out of TALES, which is exactly the well's four floors.
const k = (ja: string, kanji: string, en: string): TalePage => ({ ja, kanji, en });

export const BOARD_TALES: readonly Tale[] = [
  {
    id: 'kappa', title: "The Kappa's Arm", titleJa: 'かっぱの うで', area: 'board',
    pages: [
      k('むかし むかし、 かわの そばの むらに、 いたずらな かっぱが すんで いました。',
        '昔々、川のそばの村に、いたずらなかっぱが住んでいました。',
        'Long, long ago, a mischievous kappa lived in the river beside a village.'),
      k('かっぱの あたまには、 みずの はいった おさらが あります。 その みずが ある かぎり、 かっぱは とても つよいのです。',
        'かっぱの頭には、水の入ったお皿があります。その水がある限り、かっぱはとても強いのです。',
        "On a kappa's head is a dish full of water. As long as that water stays, the kappa is very strong."),
      k('かっぱは よる、 うまや こどもを かわへ ひっぱって、 むらの ひとを こまらせて いました。',
        'かっぱは夜、馬や子どもを川へ引っぱって、村の人を困らせていました。',
        'At night the kappa dragged horses and children toward the river, and the villagers were afraid.'),
      k('あるひ、 かっぱは ちからの つよい さむらいの うまを ひっぱりました。 さむらいは かっぱの うでを つかんで、 ぐいっと ひきました。',
        'ある日、かっぱは力の強い侍の馬を引っぱりました。侍はかっぱの腕をつかんで、ぐいっと引きました。',
        "One day the kappa pulled at the horse of a strong samurai. The samurai seized the kappa's arm and pulled hard."),
      k('すると、 かっぱの うでが すぽんと ぬけて しまいました。 かっぱは なきながら かわへ にげました。',
        'すると、かっぱの腕がすぽんと抜けてしまいました。かっぱは泣きながら川へ逃げました。',
        'Pop! The arm came right off. The kappa fled into the river, crying.'),
      k('その よる、 かっぱが きて いいました。 「うでを かえして ください。 もう わるい ことは しません。 やくそくします。」',
        'その夜、かっぱが来て言いました。「腕を返してください。もう悪いことはしません。約束します。」',
        'That night the kappa came and said: "Please give back my arm. I will never do wrong again. I promise."'),
      k('さむらいが うでを かえすと、 かっぱは うでを つけて、 おれいに きずの くすりの つくりかたを おしえました。',
        '侍が腕を返すと、かっぱは腕をつけて、お礼に傷の薬の作り方を教えました。',
        'When the samurai gave it back, the kappa fixed its arm on again and, in thanks, taught him how to make a medicine for wounds.'),
      k('それから、 むらの ひとは なつに きゅうりを かわへ ながし、 かっぱは むらを まもりました。 めでたし めでたし。',
        'それから、村の人は夏にきゅうりを川へ流し、かっぱは村を守りました。めでたしめでたし。',
        'From then on the villagers floated cucumbers down the river each summer, and the kappa guarded the village. And so it ends well.'),
    ],
  },
];

const BY_ID = new Map([...TALES, ...BOARD_TALES, ...FOLK_TALES].map((t) => [t.id, t]));

export function getTale(id: string): Tale {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`Unknown tale: ${id}`);
  return t;
}

/** Story flag set when the tale has been read to its last page. */
export const taleReadFlag = (taleId: string) => `read_${taleId}`;

// ── What the guardians ask ─────────────────────────────────────────────
// Same shape and same rules as an Arc 5 passage (English question, four English
// choices, each wrong one contradicted by the text), so the whole `passage`
// prompt path is reused. Kept out of `PASSAGES`, which is exactly the N3 set.
type Row = [tale: string, text: string, question: string, answer: string, wrong: [string, string, string]];

const QUESTIONS: Row[] = [
  ['momotaro', 'あるひ、おばあさんは かわで おおきな ももを みつけました。ももの なかから おとこのこが でて きました。',
    'Where did the old woman find the peach?', 'In the river', ['On the mountain', 'In the village', 'By the sea']],
  ['momotaro', 'ももたろうは きびだんごを もって いきました。みちで いぬと さると きじが なかまに なりました。',
    'Who joined Momotaro on the road?', 'A dog, a monkey and a pheasant', ['A cat, a horse and a crane', 'A dog, a cat and a turtle', 'A monkey, a fish and an ogre']],
  ['urashima', 'はまべで こどもたちが かめを いじめて いました。たろうは かめを たすけました。',
    'What did Taro do on the beach?', 'He rescued a turtle', ['He caught a turtle', 'He scolded the princess', 'He found a box']],
  ['urashima', 'おとひめさまは はこを くれました。「けっして あけては いけません。」でも、たろうは はこを あけました。',
    'What had the princess said about the box?', 'Never open it', ['Open it at home', 'Give it to the turtle', 'Throw it into the sea']],
  ['tsuru', 'ゆきの ふる ひに、わかものが わなに かかった つるを たすけました。その よる、うつくしい むすめが きました。',
    'What did the young man do on the snowy day?', 'He freed a crane from a trap', ['He caught a crane in a trap', 'He sold some cloth', 'He lost his way on the road']],
  ['tsuru', 'むすめは いいました。「けっして へやを のぞかないで ください。」でも、わかものは のぞいて しまいました。',
    'What promise did the young man break?', 'Not to look into the room', ['Not to open the box', 'Not to sell the cloth', 'Not to go out in the snow']],
  ['kaguya', 'おじいさんは ひかる たけを みつけました。たけの なかには、ちいさな おんなのこが いました。',
    'Where was the tiny girl found?', 'Inside a glowing bamboo', ['Inside a giant peach', 'On the beach', 'In a box from the sea']],
  ['kaguya', 'ひめは つきを みて なきました。「わたしは つきの みやこの ものです。つぎの まんげつに かえらなければ なりません。」',
    'Why was the princess crying?', 'She had to return to the moon', ['She had lost her treasure', 'She could not find the bamboo', 'No one wished to marry her']],
];

/** A tale question IS a passage; `area` here is the well floor, not an Arc 5 area. */
export type TalePassage = Omit<Passage, 'area'> & { area: WellArea; taleId: string };

export const TALE_PASSAGES: readonly TalePassage[] = QUESTIONS.map(([taleId, text, question, answer, wrong], n) => ({
  // Only the well's tales have questions, so the area is always a floor.
  id: `t-${n + 1}`, text, question, answer, wrong, taleId, area: getTale(taleId).area as WellArea,
}));

const PASSAGE_BY_ID = new Map(TALE_PASSAGES.map((t) => [t.id, t]));

export function getTalePassage(id: string): TalePassage | undefined {
  return PASSAGE_BY_ID.get(id);
}
