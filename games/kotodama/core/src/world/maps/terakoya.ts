import type { DialogueLine, FoeSpec, MapDef, NpcDef } from '../types';
import type { LessonArea } from '../../content/words';

// The Terakoya (てらこや): Castle Town's temple school, through the west house
// door. Eleven classrooms and two exam halls, one after another, in the order the
// two standard beginners' courses (Genki I-II, Minna no Nihongo I-II) teach
// Japanese: the N5 year, its mock JLPT, the N4 year, its mock JLPT. Everything is
// written in kana with spaces between words, as beginners' books print it, and the
// listening drills are spoken aloud. Every line was written for this game.
//
//   room 1   lesson1   です, の, これ/それ/あれ, numbers, prices
//   room 2   lesson2   ます verbs, particles of time and place, ませんか
//   room 3   lesson3   adjectives, すき, て-form requests and rules
//   room 4   lesson4   ている, plain forms, と おもう, たことが ある
//   room 5   lesson5   plain past, describing nouns, もう/まだ, comparing, つもり, なる
//   room 6   lesson6   んです, すぎる, ほうが いい, ので, なければ, でしょう
//   hall N5  jlpt5     the N5 mock exam: rooms 1-6 and ★ questions (N5 Certificate)
//   room 7   lesson7   potential, し, そう (looks), てみる, なら, かもしれない, giving
//   room 8   lesson8   volitional, ておく, relative clauses, てくれる/もらう, といい
//   room 9   lesson9   そう (hearsay), って, たら, transitive pairs, てしまう, ながら
//   room 10  lesson10  honorific and humble Japanese, はず, かどうか, やすい
//   room 11  lesson11  passive, てある, あいだに, causative, ば, のに
//   hall N4  jlpt4     the N4 mock exam: rooms 7-11 and ★ questions (N4 Certificate)
//
// Kage-ryu ink has got into the school's books and gathers as spirits in the
// spilled-ink patches (g). Each teacher's final exam is a battle (flag pass_lessonN)
// that opens the next room; a pupil in each room offers practice battles that can
// be fought again and again.
//
//   # wall   _ floor   g spilled ink (wild spirits)   D door

const ROWS = [
  '#######D#######',
  '#_____________#',
  '#_____________#',
  '#__ggg___ggg__#',
  '#__ggg___ggg__#',
  '#_____________#',
  '#__ggg___ggg__#',
  '#__ggg___ggg__#',
  '#_____________#',
  '#_____________#',
  '#######D#######',
];

const NEXT_DOOR = { x: 7, y: 0 };
const BACK_DOOR = { x: 7, y: 10 };
const FROM_BEFORE = { toX: 7, toY: 9 };
const FROM_AFTER = { toX: 7, toY: 1 };
const TEACHER = { x: 7, y: 2 };
const PUPIL = { x: 3, y: 9 };

export const passFlag = (n: number) => `pass_lesson${n}`;

/** The two mock-exam halls have no ink and no pupil: only the examiner, and someone who heals. */
const HALL_ROWS = ROWS.map((row) => row.replace(/g/g, '_'));

interface Room {
  /** Classroom number, or the exam hall's JLPT level. */
  n: number | 'n5' | 'n4';
  name: string;
  nameJa: string;
  teacher: { id: string; name: string; sprite: string; lines: DialogueLine[]; after: DialogueLine[]; exam: Omit<FoeSpec, 'recruitable'> };
  pupil?: { name: string; lines: DialogueLine[]; practice: FoeSpec };
  encounters: MapDef['encounters'];
  /** Where the back door leads. */
  back: { to: string; toX: number; toY: number };
  /** The last room has no door forward. */
  next?: string;
  /** NPCs that only this room has. */
  extra?: NpcDef[];
}

/** The flag an exam hall's examiner sets. It is also that level's certificate (see SEALS). */
export const jlptFlag = (level: 'n5' | 'n4') => `pass_jlpt${level[1]}`;

function classroom(r: Room): MapDef {
  const hall = typeof r.n !== 'number';
  const area = typeof r.n === 'number' ? (`lesson${r.n}` as LessonArea) : `jlpt${r.n[1]}`;
  const flag = typeof r.n === 'number' ? passFlag(r.n) : jlptFlag(r.n);
  const rows = hall ? HALL_ROWS : ROWS;
  return {
    id: `terakoya_${r.n}`, name: r.name, nameJa: r.nameJa, area,
    rows: r.next ? rows : rows.map((row, y) => (y === 0 ? '###############' : row)),
    warps: [
      { ...BACK_DOOR, ...r.back },
      ...(r.next
        ? [{ ...NEXT_DOOR, to: r.next, ...FROM_BEFORE, requires: flag, lockedText: `The door to the next classroom is shut. ${r.teacher.name}'s exam comes first.` }]
        : []),
    ],
    npcs: [
      {
        id: r.teacher.id, name: r.teacher.name, ...TEACHER, sprite: r.teacher.sprite, facing: 'down', hideIf: flag,
        dialogue: r.teacher.lines,
        battle: { winFlag: flag, isBoss: true, foes: [{ ...r.teacher.exam, recruitable: false }] },
      },
      { id: `${r.teacher.id}_after`, name: r.teacher.name, ...TEACHER, sprite: r.teacher.sprite, facing: 'down', showIf: flag, dialogue: r.teacher.after },
      r.pupil
        ? {
          id: `pupil_${r.n}`, name: r.pupil.name, ...PUPIL, sprite: 'villager', facing: 'right', dialogue: r.pupil.lines,
          battle: { winFlag: `practiced_lesson${r.n}`, repeatable: true, foes: [r.pupil.practice] },
        }
        : {
          id: `attendant_${r.n}`, name: 'Exam Attendant', ...PUPIL, sprite: 'miko', facing: 'right', heals: true,
          dialogue: [{ speaker: 'Exam Attendant', ja: 'がんばって ください。', text: 'Ganbatte kudasai: do your best. I have rested your party. The exam is long; come back to me whenever you need.' }],
        },
      ...(r.extra ?? []),
    ],
    encounterRate: hall ? 0 : 0.12,
    encounters: r.encounters,
    music: 'castle', weather: 'none', rideable: false,
  };
}

const terakoya_1 = classroom({
  n: 1, name: 'Terakoya: First Room', nameJa: 'はじめの へや',
  back: { to: 'castle_town', toX: 5, toY: 9 }, next: 'terakoya_2',
  teacher: {
    id: 'sensei_hana', name: 'Sensei Hana', sprite: 'miko',
    lines: [
      { speaker: 'Sensei Hana', ja: 'はじめまして。 はなです。 よろしく おねがいします。', text: 'Hajimemashite. I am Hana. Please treat me well. That is how every Japanese course begins, and so does this school.' },
      { speaker: 'Sensei Hana', text: 'In this room: who you are, what things are, and how much they cost. Listen carefully: half my exam is heard, not read.' },
      { speaker: 'Sensei Hana', ja: 'しけんを はじめます。', text: 'Shiken o hajimemasu: the exam begins.' },
    ],
    after: [
      { speaker: 'Sensei Hana', ja: 'よく できました！', text: 'Yoku dekimashita: well done! The next classroom is open. My pupil is always glad to practise with you.' },
    ],
    exam: { familyId: 'soroban', level: 32, name: "Sensei Hana's Exam", nameJa: 'はなせんせい', sprite: 'miko', hpScale: 4 },
  },
  pupil: {
    name: 'Pupil Kenta',
    lines: [
      { speaker: 'Kenta', ja: 'これ、 それ、 あれ。', text: 'Kore is near me, sore is near you, are is over there. And この, その, あの need a noun after them: この ほん.' },
      { speaker: 'Kenta', text: 'Want to practise? I will quiz you as many times as you like.' },
    ],
    practice: { familyId: 'koyomi', level: 30, name: 'Practice Quiz', nameJa: 'れんしゅう', sprite: 'villager', recruitable: false, hpScale: 5.5 },
  },
  encounters: [
    { familyId: 'soroban', weight: 2, levels: [30, 32] },
    { familyId: 'koyomi', weight: 2, levels: [30, 32] },
  ],
});

const terakoya_2 = classroom({
  n: 2, name: 'Terakoya: Room of Days', nameJa: 'まいにちの へや',
  back: { to: 'terakoya_1', ...FROM_AFTER }, next: 'terakoya_3',
  teacher: {
    id: 'sensei_ito', name: 'Sensei Ito', sprite: 'teamaster',
    lines: [
      { speaker: 'Sensei Ito', ja: 'まいにち なんじに おきますか。', text: 'What time do you get up every day? In this room, verbs: たべます, のみます, いきます. And the little particles that say when and where.' },
      { speaker: 'Sensei Ito', text: 'に for the time, で for the place you do it, を for what you do, へ for where you go. Let us see if they stick.' },
    ],
    after: [
      { speaker: 'Sensei Ito', ja: 'いっしょに おちゃを のみませんか。', text: 'Won\'t you have tea with me? That ませんか is an invitation, by the way. Go on, the next room is open.' },
    ],
    exam: { familyId: 'hansho', level: 34, name: "Sensei Ito's Exam", nameJa: 'いとうせんせい', sprite: 'teamaster', hpScale: 4 },
  },
  pupil: {
    name: 'Pupil Yui',
    lines: [
      { speaker: 'Yui', ja: 'きのう えいがを みました。', text: 'ます is now or later; ました is the past; ません is "don\'t"; ませんでした is "didn\'t".' },
      { speaker: 'Yui', text: 'Shall we practise? Again and again, if you like.' },
    ],
    practice: { familyId: 'hina', level: 32, name: 'Practice Quiz', nameJa: 'れんしゅう', sprite: 'villager', recruitable: false, hpScale: 7 },
  },
  encounters: [
    { familyId: 'hansho', weight: 2, levels: [32, 34] },
    { familyId: 'hina', weight: 2, levels: [32, 34] },
  ],
});

const terakoya_3 = classroom({
  n: 3, name: 'Terakoya: Room of Things', nameJa: 'かいものの へや',
  back: { to: 'terakoya_2', ...FROM_AFTER }, next: 'terakoya_4',
  teacher: {
    id: 'sensei_kato', name: 'Sensei Kato', sprite: 'merchant',
    lines: [
      { speaker: 'Sensei Kato', ja: 'この みせは やすくて おいしいです。', text: 'This shop is cheap and tasty. Adjectives! たかい, やすい, しずか, にぎやか. Two kinds, and they bend differently.' },
      { speaker: 'Sensei Kato', text: 'And the て-form: あけて ください, please open it. とっても いいですか, may I take it? Answer me well.' },
    ],
    after: [
      { speaker: 'Sensei Kato', ja: 'たのしかったです！', text: 'That was fun! い becomes かった in the past. The last room is open: our head teacher is waiting.' },
    ],
    exam: { familyId: 'ashigaru', level: 36, name: "Sensei Kato's Exam", nameJa: 'かとうせんせい', sprite: 'merchant', hpScale: 4 },
  },
  pupil: {
    name: 'Pupil Sora',
    lines: [
      { speaker: 'Sora', ja: 'しずかな まち、 しずかです。', text: 'Before a noun, a な-adjective keeps its な: しずかな まち. Before です it drops it: まちは しずかです.' },
      { speaker: 'Sora', text: 'Practice? I never get tired of it.' },
    ],
    practice: { familyId: 'kazamuki', level: 34, name: 'Practice Quiz', nameJa: 'れんしゅう', sprite: 'villager', recruitable: false, hpScale: 7 },
  },
  encounters: [
    { familyId: 'ashigaru', weight: 2, levels: [34, 36] },
    { familyId: 'kazamuki', weight: 2, levels: [34, 36] },
  ],
});

const terakoya_4 = classroom({
  n: 4, name: 'Terakoya: Room of Talk', nameJa: 'はなしの へや',
  back: { to: 'terakoya_3', ...FROM_AFTER }, next: 'terakoya_5',
  teacher: {
    id: 'head_teacher', name: 'Head Teacher Ono', sprite: 'abbot',
    lines: [
      { speaker: 'Head Teacher Ono', ja: 'いま なにを して いますか。', text: 'What are you doing now? Talking to an old monk! In this room: ている, plain forms, と おもいます, and things you have done.' },
      { speaker: 'Head Teacher Ono', text: 'Most of this exam you will HEAR. Real Japanese does not wait for you to read it. Close your eyes if it helps.' },
    ],
    after: [
      { speaker: 'Head Teacher Ono', ja: 'よく がんばりましたね。', text: 'Yoku ganbarimashita ne: you worked hard. That is the first half of the N5 year. Two more rooms, and then the N5 exam hall.' },
      { speaker: 'Head Teacher Ono', text: 'The little spirit of this school has been watching you. Speak to it before you go on.' },
    ],
    exam: { familyId: 'kagami', level: 38, name: "Head Teacher Ono's Exam", nameJa: 'おのせんせい', sprite: 'abbot', hpScale: 4 },
  },
  pupil: {
    name: 'Pupil Mei',
    lines: [
      { speaker: 'Mei', ja: 'すしを たべた ことが あります。', text: 'た-form + ことが ある: I have done it before. た-form + ら: if. ない-form + で ください: please don\'t.' },
      { speaker: 'Mei', text: 'Practise with me? As often as you want.' },
    ],
    practice: { familyId: 'karakasa', level: 36, name: 'Practice Quiz', nameJa: 'れんしゅう', sprite: 'villager', recruitable: false, hpScale: 5.5 },
  },
  encounters: [
    { familyId: 'karakasa', weight: 2, levels: [36, 38] },
    { familyId: 'zori', weight: 2, levels: [36, 38] },
  ],
  extra: [
    {
      id: 'warashi_gift', name: 'School Spirit', x: 11, y: 2, sprite: 'warashi0', facing: 'down', showIf: passFlag(4), hideIf: 'got_warashi',
      setsFlag: 'got_warashi', givesSpirit: { familyId: 'warashi', level: 36 },
      dialogue: [
        { speaker: 'School Spirit', ja: 'いっしょに いきたいです！', text: 'Issho ni ikitai desu: I want to come with you! A zashiki-warashi lives in every good school. This one has chosen you.' },
        { speaker: 'System', text: 'Warashi joined your spirits!' },
      ],
    },
  ],
});

const practice = (familyId: string, level: number, hpScale = 5.5): FoeSpec =>
  ({ familyId, level, name: 'Practice Quiz', nameJa: 'れんしゅう', sprite: 'villager', recruitable: false, hpScale });

const terakoya_5 = classroom({
  n: 5, name: 'Terakoya: Room of Journeys', nameJa: 'たびの へや',
  back: { to: 'terakoya_4', ...FROM_AFTER }, next: 'terakoya_6',
  teacher: {
    id: 'sensei_kudo', name: 'Sensei Kudo', sprite: 'yamabushi',
    lines: [
      { speaker: 'Sensei Kudo', ja: 'なつやすみに どこへ いく つもりですか。', text: 'Where do you plan to go this summer? I have walked every mountain road in Japan, and I can tell you: a traveller needs comparisons. Which is faster? Which is cheaper?' },
      { speaker: 'Sensei Kudo', text: 'In this room: the plain past (みた, いった), もう and まだ, より and いちばん, つもり, and なる for things that change. And a sentence can sit in front of a noun to describe it.' },
    ],
    after: [
      { speaker: 'Sensei Kudo', ja: 'いい たびを！', text: 'Ii tabi o: have a good journey! You compare like a seasoned traveller now.' },
    ],
    exam: { familyId: 'kagami', level: 40, name: "Sensei Kudo's Exam", nameJa: 'くどうせんせい', sprite: 'yamabushi', hpScale: 4 },
  },
  pupil: {
    name: 'Pupil Haruto',
    lines: [
      { speaker: 'Haruto', ja: 'でんしゃの ほうが はやいです。', text: 'A より B の ほうが: B more than A. And for three or more: ～の なかで なにが いちばん.' },
      { speaker: 'Haruto', text: 'Practise with me? I never get tired of it.' },
    ],
    practice: practice('dosojin', 38),
  },
  encounters: [
    { familyId: 'kagami', weight: 2, levels: [38, 40] },
    { familyId: 'dosojin', weight: 2, levels: [38, 40] },
  ],
});

const terakoya_6 = classroom({
  n: 6, name: 'Terakoya: Room of the Body', nameJa: 'からだの へや',
  back: { to: 'terakoya_5', ...FROM_AFTER }, next: 'terakoya_n5',
  teacher: {
    id: 'sensei_nakamura', name: 'Sensei Nakamura', sprite: 'master',
    lines: [
      { speaker: 'Sensei Nakamura', ja: 'どうしたんですか。', text: 'What is the matter? Ah, you look pale. Exam nerves! In this room we talk about the body, and about feeling ill.' },
      { speaker: 'Sensei Nakamura', text: 'んです to explain, すぎる for too much, ほうが いい for advice, ので for reasons, なければ いけません for must. Pass, and the N5 exam hall is next.' },
    ],
    after: [
      { speaker: 'Sensei Nakamura', ja: 'もう だいじょうぶですね。', text: 'You are all right now. The N5 exam hall is through the next door. Rest before you go in: it is long.' },
    ],
    exam: { familyId: 'yamanba', level: 42, name: "Sensei Nakamura's Exam", nameJa: 'なかむらせんせい', sprite: 'master', hpScale: 4 },
  },
  pupil: {
    name: 'Pupil Aoi',
    lines: [
      { speaker: 'Aoi', ja: 'あたまが いたいんです。', text: 'Atama ga itai n desu: I have a headache, you see. The んです makes it an explanation, not just a fact.' },
      { speaker: 'Aoi', text: 'Practise? As often as you like.' },
    ],
    practice: practice('yukionna', 40),
  },
  encounters: [
    { familyId: 'yamanba', weight: 2, levels: [40, 42] },
    { familyId: 'yukionna', weight: 2, levels: [40, 42] },
  ],
});

const terakoya_n5 = classroom({
  n: 'n5', name: 'Terakoya: N5 Exam Hall', nameJa: 'エヌご しけんじょう',
  back: { to: 'terakoya_6', ...FROM_AFTER }, next: 'terakoya_7',
  teacher: {
    id: 'proctor_ishida', name: 'Proctor Ishida', sprite: 'gatecaptain',
    lines: [
      { speaker: 'Proctor Ishida', ja: 'しけんを はじめます。 はじめて ください。', text: 'This is the N5 mock exam. Words, grammar and listening from all six rooms, and the ★ questions: put four pieces in order to finish the sentence.' },
      { speaker: 'Proctor Ishida', text: 'Listen carefully: you may replay a recording, and nothing in this hall is timed. Pass, and you leave with an N5 Certificate.' },
    ],
    after: [
      { speaker: 'Proctor Ishida', ja: 'ごうかく です。 おめでとう ございます。', text: 'Goukaku desu: you passed. Congratulations. That is the N5 year.' },
      { speaker: 'System', text: 'You received the N5 CERTIFICATE: your whole party is a little stronger, for good. The N4 year begins through the next door.' },
    ],
    exam: { familyId: 'hitotsume', level: 44, name: 'The N5 Mock Exam', nameJa: 'エヌご', sprite: 'gatecaptain', hpScale: 6 },
  },
  encounters: [],
  extra: [
    {
      id: 'yamabiko_gift', name: 'Yamabiko', x: 11, y: 2, sprite: 'yamabiko0', facing: 'down', showIf: jlptFlag('n5'), hideIf: 'got_yamabiko',
      setsFlag: 'got_yamabiko', givesSpirit: { familyId: 'yamabiko', level: 42 },
      dialogue: [
        { speaker: 'Yamabiko', ja: 'やっほー！ やっほー！', text: 'Yahhoo! Yahhoo! A yamabiko is the echo in the mountains: it repeats whatever it hears. One that has heard a whole exam of listening wants to follow you.' },
        { speaker: 'System', text: 'Yamabiko joined your spirits!' },
      ],
    },
  ],
});

const terakoya_7 = classroom({
  n: 7, name: 'Terakoya: Room of Skills', nameJa: 'できるの へや',
  back: { to: 'terakoya_n5', ...FROM_AFTER }, next: 'terakoya_8',
  teacher: {
    id: 'sensei_rin', name: 'Sensei Rin', sprite: 'kunoichi',
    lines: [
      { speaker: 'Sensei Rin', ja: 'わたしは みずの うえを はしれます。', text: 'I can run on water. Well, nearly. The N4 year begins with what you CAN do: the potential form. はしる, はしれる.' },
      { speaker: 'Sensei Rin', text: 'Also: そう for how things look, てみる for trying, なら, かもしれない, and who gives what to whom: あげる, くれる, もらう.' },
    ],
    after: [
      { speaker: 'Sensei Rin', ja: 'じょうずに なりましたね。', text: 'You have become skilled. Try the next room; you might like it. Or might not: かもしれません.' },
    ],
    exam: { familyId: 'azukiarai', level: 45, name: "Sensei Rin's Exam", nameJa: 'りんせんせい', sprite: 'kunoichi', hpScale: 5 },
  },
  pupil: {
    name: 'Pupil Sota',
    lines: [
      { speaker: 'Sota', ja: 'ともだちが くれました。', text: 'Kureru is only ever towards me (or my side). Ageru goes away from me. Morau: I receive.' },
      { speaker: 'Sota', text: 'Practice? Let us go again and again.' },
    ],
    practice: practice('nue', 43),
  },
  encounters: [
    { familyId: 'azukiarai', weight: 2, levels: [43, 45] },
    { familyId: 'nue', weight: 2, levels: [43, 45] },
  ],
});

const terakoya_8 = classroom({
  n: 8, name: 'Terakoya: Room of Preparations', nameJa: 'じゅんびの へや',
  back: { to: 'terakoya_7', ...FROM_AFTER }, next: 'terakoya_9',
  teacher: {
    id: 'sensei_aoki', name: 'Sensei Aoki', sprite: 'ferryman',
    lines: [
      { speaker: 'Sensei Aoki', ja: 'りょこうの まえに、 ちずを しらべて おきましょう。', text: 'Before a trip, look up the map in advance. I have ferried a thousand travellers; the ones who prepare arrive.' },
      { speaker: 'Sensei Aoki', text: 'The volitional (いこう), ておく for doing it ahead, sentences that describe nouns, and favours: てあげる, てくれる, てもらう, ていただけませんか.' },
    ],
    after: [
      { speaker: 'Sensei Aoki', ja: 'いい りょこうに なると いいですね。', text: 'I hope it turns out to be a good trip. The next room is full of rumours; do not believe all of them.' },
    ],
    exam: { familyId: 'hitotsume', level: 47, name: "Sensei Aoki's Exam", nameJa: 'あおきせんせい', sprite: 'ferryman', hpScale: 5.5 },
  },
  pupil: {
    name: 'Pupil Mio',
    lines: [
      { speaker: 'Mio', ja: 'しゃしんを とって いただけませんか。', text: 'Could you take a photo for me? ～て いただけませんか is the politest way to ask a stranger.' },
      { speaker: 'Mio', text: 'Want to practise? Any time.' },
    ],
    practice: practice('noppera', 45),
  },
  encounters: [
    { familyId: 'hitotsume', weight: 2, levels: [45, 47] },
    { familyId: 'noppera', weight: 2, levels: [45, 47] },
  ],
});

const terakoya_9 = classroom({
  n: 9, name: 'Terakoya: Room of Rumours', nameJa: 'うわさの へや',
  back: { to: 'terakoya_8', ...FROM_AFTER }, next: 'terakoya_10',
  teacher: {
    id: 'skald_eyvind', name: 'Skald Eyvind', sprite: 'skald',
    lines: [
      { speaker: 'Skald Eyvind', ja: 'きいた？ じゃーるが にほんごを ならって いるって。', text: 'Heard? They say the Jarl is learning Japanese. A skald lives on rumours, so the school asked me to teach them: そうです and って.' },
      { speaker: 'Skald Eyvind', text: 'Also たら, なくても いい, みたい, まえに and てから, doors that open by themselves (あく) or are opened (あける), and てしまう for regrets.' },
    ],
    after: [
      { speaker: 'Skald Eyvind', ja: 'すごいって みんな いって いますよ。', text: 'Everyone says you are amazing. That one is a true rumour. The next room is very polite; mind your manners.' },
    ],
    exam: { familyId: 'kamaitachi', level: 49, name: "Skald Eyvind's Exam", nameJa: 'エイヴィンド', sprite: 'skald', hpScale: 6.5 },
  },
  pupil: {
    name: 'Pupil Riku',
    lines: [
      { speaker: 'Riku', ja: 'ドアが あきました。 ドアを あけました。', text: 'The door opened (by itself): が and あく. I opened the door: を and あける. The pairs come up all the time.' },
      { speaker: 'Riku', text: 'Practise with me? Again and again.' },
    ],
    practice: practice('inugami', 47),
  },
  encounters: [
    { familyId: 'kamaitachi', weight: 2, levels: [47, 49] },
    { familyId: 'inugami', weight: 2, levels: [47, 49] },
  ],
});

const terakoya_10 = classroom({
  n: 10, name: 'Terakoya: Room of Courtesy', nameJa: 'けいごの へや',
  back: { to: 'terakoya_9', ...FROM_AFTER }, next: 'terakoya_11',
  teacher: {
    id: 'chamberlain_hosokawa', name: 'Chamberlain Hosokawa', sprite: 'karo',
    lines: [
      { speaker: 'Chamberlain Hosokawa', ja: 'ようこそ いらっしゃいました。', text: 'Welcome. I serve the Shogun, and in his court one word in the wrong register is a scandal. Keigo: honorific words raise the other person; humble words lower yourself.' },
      { speaker: 'Chamberlain Hosokawa', text: 'めしあがる and いただく, おっしゃる and もうす, いらっしゃる and まいる. Also はず, かどうか, という, and やすい / にくい.' },
    ],
    after: [
      { speaker: 'Chamberlain Hosokawa', ja: 'たいへん けっこうで ございます。', text: 'Most splendid. You may present yourself at court. The last classroom is next: its master is a strict one.' },
    ],
    exam: { familyId: 'yamabiko', level: 51, name: "Chamberlain Hosokawa's Exam", nameJa: 'ほそかわ', sprite: 'karo', hpScale: 5.5 },
  },
  pupil: {
    name: 'Pupil Yuna',
    lines: [
      { speaker: 'Yuna', ja: 'やまだと もうします。', text: 'Never use honorific words about yourself: やまだと おっしゃいます would be a disaster. For yourself: もうします.' },
      { speaker: 'Yuna', text: 'Practise? I am happy to.' },
    ],
    practice: practice('baku', 49),
  },
  encounters: [
    { familyId: 'yamabiko', weight: 2, levels: [49, 51] },
    { familyId: 'baku', weight: 2, levels: [49, 51] },
  ],
});

const terakoya_11 = classroom({
  n: 11, name: 'Terakoya: Room of Discipline', nameJa: 'しゅぎょうの へや',
  back: { to: 'terakoya_10', ...FROM_AFTER }, next: 'terakoya_n4',
  teacher: {
    id: 'master_kurama', name: 'Master Kurama', sprite: 'tenguking',
    lines: [
      { speaker: 'Master Kurama', ja: 'わしは でしたちに まいにち はしらせた。', text: 'I made my students run every day. They were made to run. That is the last lesson: things done TO you (passive) and things you MAKE others do (causative).' },
      { speaker: 'Master Kurama', text: 'And ば for if, のに for even though, てある, あいだに, てほしい. Beat me, and only the N4 exam hall remains.' },
    ],
    after: [
      { speaker: 'Master Kurama', ja: 'よく やった。 わしも ほめられたい ものだ。', text: 'Well done. I would like to be praised like that myself. The N4 exam hall waits behind the last door.' },
    ],
    exam: { familyId: 'nue', level: 53, name: "Master Kurama's Exam", nameJa: 'くらま', sprite: 'tenguking', hpScale: 5 },
  },
  pupil: {
    name: 'Pupil Kaito',
    lines: [
      { speaker: 'Kaito', ja: 'ピアノを れんしゅうさせられました。', text: 'Renshuu saserareta: I was made to practise. させられる, the causative-passive, means you did not want to.' },
      { speaker: 'Kaito', text: 'Practise with me? Willingly, this time.' },
    ],
    practice: practice('kamaitachi', 51, 7),
  },
  encounters: [
    { familyId: 'nue', weight: 2, levels: [51, 53] },
    { familyId: 'kamaitachi', weight: 2, levels: [51, 53] },
  ],
});

const terakoya_n4 = classroom({
  n: 'n4', name: 'Terakoya: N4 Exam Hall', nameJa: 'エヌよん しけんじょう',
  back: { to: 'terakoya_11', ...FROM_AFTER },
  teacher: {
    id: 'examiner_kanda', name: 'Grand Examiner Kanda', sprite: 'champion',
    lines: [
      { speaker: 'Grand Examiner Kanda', ja: 'さいごの しけんです。', text: 'The final exam. Everything from the N4 year, and ★ questions from both years. I have examined samurai, shogun and a tengu; I do not go easy.' },
      { speaker: 'Grand Examiner Kanda', text: 'Pass, and you hold an N4 Certificate: the end of the beginners\' road, and the start of reading Japanese for real.' },
    ],
    after: [
      { speaker: 'Grand Examiner Kanda', ja: 'ごうかく。 おめでとう。', text: 'Passed. Congratulations. Two years of Japanese, from はじめまして to させられる.' },
      { speaker: 'System', text: 'You received the N4 CERTIFICATE: your whole party is stronger, for good. The Terakoya has nothing left to teach you.' },
    ],
    exam: { familyId: 'kamaitachi', level: 55, name: 'The N4 Mock Exam', nameJa: 'エヌよん', sprite: 'champion', hpScale: 7.5 },
  },
  encounters: [],
  extra: [
    {
      id: 'baku_gift', name: 'Baku', x: 11, y: 2, sprite: 'baku0', facing: 'down', showIf: jlptFlag('n4'), hideIf: 'got_baku',
      setsFlag: 'got_baku', givesSpirit: { familyId: 'baku', level: 52 },
      dialogue: [
        { speaker: 'Baku', ja: 'もう こわい ゆめは みません。', text: 'No more bad dreams. A baku eats nightmares, and it has just eaten every exam nightmare you will ever have. Now it wants to come with you.' },
        { speaker: 'System', text: 'Baku joined your spirits!' },
      ],
    },
  ],
});

export const TERAKOYA_MAPS: MapDef[] = [
  terakoya_1, terakoya_2, terakoya_3, terakoya_4, terakoya_5, terakoya_6, terakoya_n5,
  terakoya_7, terakoya_8, terakoya_9, terakoya_10, terakoya_11, terakoya_n4,
];
