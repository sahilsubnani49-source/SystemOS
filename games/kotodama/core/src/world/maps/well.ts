import type { MapDef, NpcDef } from '../types';

// The Well of Old Tales: a side dungeon under Sakura Village, open once the Oni
// has fallen (flag beat_oni). Everything in it is plain hiragana.
//
//   m stone wall   _ floor   g gravel (wild spirits)   e steps   L lantern
//   ~ water        r runestone
//
// The raiders' runes sank the village's stories into the well. On each floor a
// keeper holds one true tale. Reading it (flag read_<tale>) calls up the tale's
// own hero, garbled and forgetful; beating them earns a SEAL (a permanent party
// blessing, see SEALS in progression.ts) and opens the steps down.
//
//   floor 1  well_words   words            ももたろう        seal_words
//   floor 2  well_heart   phrases          うらしまたろう     seal_heart
//   floor 3  well_rules   grammar          つるの おんがえし  seal_rules
//   floor 4  well_deep    everything       かぐやひめ        seal_deep

/** Where every floor puts things, so the four maps stay walkable in the same way. */
const UP = { x: 7, y: 11 };
const DOWN = { x: 7, y: 1 };
const FROM_ABOVE = { toX: 7, toY: 10 };
const FROM_BELOW = { toX: 7, toY: 2 };
const KEEPER = { x: 5, y: 10 };
const GUARDIAN = { x: 7, y: 3 };

const LOCKED = 'The steps down are choked with garbled ink. The guardian of this floor still holds its seal.';

/** The keeper of a floor's scroll: offers the tale every time, so it can be re-read. */
function keeper(tale: string, sprite: string, lines: NpcDef['dialogue']): NpcDef {
  return { id: `keeper_${tale}`, name: 'Scroll Keeper', ...KEEPER, sprite, facing: 'right', readsTale: tale, dialogue: lines };
}

const well_words: MapDef = {
  id: 'well_words', name: 'Hall of Words', nameJa: 'ことばのま', area: 'well1',
  rows: [
    'mmmmmmmmmmmmmmm',
    'm_____LeL_____m',
    'm_____________m',
    'm_____________m',
    'm__ggg___ggg__m',
    'm__ggg___ggg__m',
    'm_____________m',
    'm__ggg___ggg__m',
    'm__ggg___ggg__m',
    'm_____________m',
    'm__L_______L__m',
    'm______e______m',
    'mmmmmmmmmmmmmmm',
  ],
  warps: [
    { ...UP, to: 'sakura_village', toX: 14, toY: 15 },
    { ...DOWN, to: 'well_heart', ...FROM_ABOVE, requires: 'seal_words', lockedText: LOCKED },
  ],
  npcs: [
    keeper('momotaro', 'miko', [
      { speaker: 'Scroll Keeper', ja: 'ようこそ。', text: 'Youkoso: welcome. Down here a word is not a sound to match. It is a thing: いぬ is a dog, もも is a peach.' },
      { speaker: 'Scroll Keeper', text: 'I keep the tale of the Peach Boy. Read it to the end, and the one who lived it will come.' },
    ]),
    { id: 'momotaro', name: 'Garbled Momotaro', ...GUARDIAN, sprite: 'ronin', facing: 'down', showIf: 'read_momotaro', hideIf: 'seal_words',
      dialogue: [
        { speaker: 'Garbled Momotaro', ja: 'おには どこだ？', text: 'Oni wa doko da? Where are the ogres? I set out to fight... something. I had friends. A dog? A... what were they?' },
      ],
      battle: { winFlag: 'seal_words', isBoss: true, foes: [
        { familyId: 'riki', level: 19, name: 'Garbled Momotaro', nameJa: 'ももたろう', sprite: 'ronin', recruitable: false, hpScale: 4.6 },
      ] } },
    { id: 'momotaro_after', name: 'Momotaro', ...GUARDIAN, sprite: 'ronin', facing: 'down', showIf: 'seal_words',
      dialogue: [
        { speaker: 'Momotaro', ja: 'いぬ、さる、きじ！', text: 'Inu, saru, kiji! A dog, a monkey, a pheasant. I remember. We won, and we went home.' },
        { speaker: 'System', text: 'You received the SEAL OF WORDS: your whole party strikes harder, for good. The steps down are open.' },
      ] },
  ],
  encounterRate: 0.13,
  encounters: [
    { familyId: 'akari', weight: 1, levels: [17, 19] },
    { familyId: 'kobi', weight: 1, levels: [17, 19] },
    { familyId: 'tanu', weight: 1, levels: [17, 19] },
  ],
  music: 'shrine', weather: 'fireflies', rideable: false, darkness: 0.3,
};

const well_heart: MapDef = {
  id: 'well_heart', name: 'Hall of the Heart', nameJa: 'こころのま', area: 'well2',
  rows: [
    'mmmmmmmmmmmmmmm',
    'm_____LeL_____m',
    'm_____________m',
    'm_____________m',
    'm__ggg___ggg__m',
    'm__ggg___ggg__m',
    'm_~~_______~~_m',
    'm__ggg___ggg__m',
    'm__ggg___ggg__m',
    'm_____________m',
    'm__L_______L__m',
    'm______e______m',
    'mmmmmmmmmmmmmmm',
  ],
  warps: [
    { ...UP, to: 'well_words', ...FROM_BELOW },
    { ...DOWN, to: 'well_rules', ...FROM_ABOVE, requires: 'seal_heart', lockedText: LOCKED },
  ],
  npcs: [
    keeper('urashima', 'teamaster', [
      { speaker: 'Scroll Keeper', ja: 'いちご いちえ。', text: 'Ichigo ichie: one time, one meeting. Some sayings cannot be read word by word. You must know what the heart of them is.' },
      { speaker: 'Scroll Keeper', text: 'I keep the tale of the fisherman who stayed away too long. Read it, and he will rise from the water.' },
    ]),
    { id: 'urashima', name: 'Garbled Urashima', ...GUARDIAN, sprite: 'ferryman', facing: 'down', showIf: 'read_urashima', hideIf: 'seal_heart',
      dialogue: [
        { speaker: 'Garbled Urashima', ja: 'ただいま…？', text: 'Tadaima...? I am home. But no one answers okaeri. How long was I gone? What was in the box?' },
      ],
      battle: { winFlag: 'seal_heart', isBoss: true, foes: [
        { familyId: 'wadachi', level: 20, name: 'Garbled Urashima', nameJa: 'うらしま', sprite: 'ferryman', recruitable: false, hpScale: 4.2 },
      ] } },
    { id: 'urashima_after', name: 'Urashima Taro', ...GUARDIAN, sprite: 'ferryman', facing: 'down', showIf: 'seal_heart',
      dialogue: [
        { speaker: 'Urashima Taro', ja: 'おかえり。', text: 'Okaeri. Welcome back. Someone should say it to me, so I will say it to you. Three hundred years. I remember now.' },
        { speaker: 'System', text: 'You received the SEAL OF HEART: your whole party takes blows better, for good. The steps down are open.' },
      ] },
  ],
  encounterRate: 0.13,
  encounters: [
    { familyId: 'suiko', weight: 2, levels: [18, 20] },
    { familyId: 'wadachi', weight: 1, levels: [18, 20] },
    { familyId: 'yozakura', weight: 1, levels: [18, 20] },
  ],
  music: 'shrine', weather: 'fireflies', rideable: false, darkness: 0.35,
};

const well_rules: MapDef = {
  id: 'well_rules', name: 'Hall of Rules', nameJa: 'きまりのま', area: 'well3',
  rows: [
    'mmmmmmmmmmmmmmm',
    'm_____LeL_____m',
    'm_____________m',
    'm_____________m',
    'm__ggg___ggg__m',
    'm__ggg___ggg__m',
    'm__r___r___r__m',
    'm__ggg___ggg__m',
    'm__ggg___ggg__m',
    'm_____________m',
    'm__L_______L__m',
    'm______e______m',
    'mmmmmmmmmmmmmmm',
  ],
  warps: [
    { ...UP, to: 'well_heart', ...FROM_BELOW },
    { ...DOWN, to: 'well_deep', ...FROM_ABOVE, requires: 'seal_rules', lockedText: LOCKED },
  ],
  npcs: [
    keeper('tsuru', 'abbot', [
      { speaker: 'Scroll Keeper', ja: 'は、を、に、で。', text: 'Wa, o, ni, de. Small as threads, and they hold every sentence together. Pull the wrong one and the cloth comes apart.' },
      { speaker: 'Scroll Keeper', text: 'I keep the tale of the weaver who asked for one promise. Read it, and she will come down from the rafters.' },
    ]),
    { id: 'tsuru', name: 'Garbled Crane', ...GUARDIAN, sprite: 'miko', facing: 'down', showIf: 'read_tsuru', hideIf: 'seal_rules',
      dialogue: [
        { speaker: 'Garbled Crane', ja: 'のぞかないで ください。', text: 'Nozokanaide kudasai. Please do not look. I asked for one promise. Who broke it? Why am I weaving?' },
      ],
      battle: { winFlag: 'seal_rules', isBoss: true, foes: [
        { familyId: 'nekaze', level: 21, name: 'Garbled Crane', nameJa: 'つる', sprite: 'miko', recruitable: false, hpScale: 8.5 },
      ] } },
    { id: 'tsuru_after', name: 'The Crane', ...GUARDIAN, sprite: 'miko', facing: 'down', showIf: 'seal_rules',
      dialogue: [
        { speaker: 'The Crane', ja: 'ありがとう。', text: 'Arigatou. He freed me from the snare, and I wove to thank him. It was never a sad tale. It was a grateful one.' },
        { speaker: 'System', text: 'You received the SEAL OF RULES: your whole party has more HP, for good. The last steps down are open.' },
      ] },
  ],
  encounterRate: 0.13,
  encounters: [
    { familyId: 'nekaze', weight: 2, levels: [19, 21] },
    { familyId: 'hikari', weight: 1, levels: [19, 21] },
    { familyId: 'mimi', weight: 1, levels: [19, 21] },
  ],
  music: 'shrine', weather: 'fireflies', rideable: false, darkness: 0.4,
};

const well_deep: MapDef = {
  id: 'well_deep', name: 'The Bottom of the Well', nameJa: 'いどの そこ', area: 'well4',
  rows: [
    'mmmmmmmmmmmmmmm',
    'm_____L_L_____m',
    'm_____________m',
    'm_____________m',
    'm_ggggg_ggggg_m',
    'm_ggggg_ggggg_m',
    'm_____________m',
    'm_ggggg_ggggg_m',
    'm_ggggg_ggggg_m',
    'm_____________m',
    'm__L_______L__m',
    'm______e______m',
    'mmmmmmmmmmmmmmm',
  ],
  warps: [{ ...UP, to: 'well_rules', ...FROM_BELOW }],
  npcs: [
    keeper('kaguya', 'skald', [
      { speaker: 'Scroll Keeper', ja: 'さいごの ものがたり。', text: 'Saigo no monogatari: the last tale. Down here it all comes at once. Words, sayings, the threads between them.' },
      { speaker: 'Scroll Keeper', text: 'I keep the tale of the girl from the moon. Something at the bottom of this well has eaten its ending. Read it anyway.' },
    ]),
    { id: 'nanashi', name: 'The Nameless Teller', ...GUARDIAN, sprite: 'draugr', facing: 'down', showIf: 'read_kaguya', hideIf: 'seal_deep',
      dialogue: [
        { speaker: 'The Nameless Teller', ja: 'めでたし… めでたし…', text: 'Medetashi... medetashi... I ate the endings. All of them. A tale that never ends can never be forgotten. Can it?' },
        { speaker: 'The Nameless Teller', text: 'You have read them. You KNOW how they end. Then say it, scribe. Say every last word.' },
      ],
      battle: { winFlag: 'seal_deep', isBoss: true, foes: [
        { familyId: 'mimi', level: 23, name: 'The Nameless Teller', nameJa: 'ななし', sprite: 'draugr', recruitable: false, hpScale: 7 },
      ] } },
    { id: 'nanashi_after', name: 'The Teller', ...GUARDIAN, sprite: 'villager', facing: 'down', showIf: 'seal_deep',
      dialogue: [
        { speaker: 'The Teller', text: 'I was a storyteller once. I was so afraid of the tales being lost that I swallowed them. An ending is not a loss. It is how a tale is kept.' },
        { speaker: 'The Teller', ja: 'めでたし めでたし。', text: 'Medetashi, medetashi. Go and tell Fumi. She has been waiting a long time to finish a sentence.' },
        { speaker: 'System', text: 'You received the SEAL OF THE DEEP: attack, defence and HP all rise, for good. The Well of Old Tales is cleared. Its tales and battles stay open.' },
      ] },
  ],
  encounterRate: 0.14,
  encounters: [
    { familyId: 'riki', weight: 1, levels: [20, 22] },
    { familyId: 'mimi', weight: 1, levels: [20, 22] },
    { familyId: 'yozakura', weight: 1, levels: [20, 22] },
    { familyId: 'wadachi', weight: 1, levels: [20, 22] },
  ],
  music: 'boss', weather: 'none', rideable: false, darkness: 0.45,
};

export const WELL_MAPS: readonly MapDef[] = [well_words, well_heart, well_rules, well_deep];
