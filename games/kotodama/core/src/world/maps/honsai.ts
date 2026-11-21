import type { DialogueLine, MapDef, NpcDef } from '../types';
import { PARTICLE_GROUPS } from '../../content/honsai/particles';

// Arc 6: Honsai (本才), the forbidden land of speech, sealed for a thousand years.
// Wapul, the Demon Lord of Silence, eats every word that is forgotten, and Honsai's
// people have gone quiet district by district. Every word the Scribe masters is a
// word taken back. Each district teaches one field of vocabulary and one piece of
// grammar; its lieutenant guards the road on.
//
// The people of a district are SILENCED until its lieutenant falls: each one is two
// NPCs on one tile, the silent one (hideIf the boss flag) and the restored one
// (showIf it), who says out loud exactly the words they had lost.

const SPEECHLESS = 'game_complete';

/** A villager who lost some words, and gets them back when the district is freed. */
export function silenced(id: string, name: string, sprite: string, x: number, y: number, freedBy: string, silent: string, restored: DialogueLine[]): NpcDef[] {
  return [
    { id: `${id}_silent`, name, x, y, sprite, facing: 'down', hideIf: freedBy,
      dialogue: [{ speaker: name, text: `……  ${silent}` }] },
    { id: `${id}_free`, name, x, y, sprite, facing: 'down', showIf: freedBy,
      dialogue: restored.map((l) => ({ speaker: name, ...l })) },
  ];
}

export const HONSAI_ENCOUNTERS = (lo: number, hi: number) => [
  { familyId: 'noppera', weight: 3, levels: [lo, hi] as [number, number] },
  { familyId: 'yamabiko', weight: 3, levels: [lo, hi] as [number, number] },
  { familyId: 'baku', weight: 2, levels: [lo, hi] as [number, number] },
  { familyId: 'hitotsume', weight: 2, levels: [lo, hi] as [number, number] },
];

// ── District 1: Kotoba Gate (言葉門). Greetings, people, numbers, counters, time. ──
const honsai_gate: MapDef = {
  id: 'honsai_gate', name: 'Kotoba Gate', nameJa: 'ことばもん', area: 'honsai1',
  rows: [
    'TTTTTTTTm==mTTTTTTTT',
    'T,,,...Lm==mL...,,,T',
    'T,,.....I==I.....,,T',
    'T,.......==.......,T',
    'T..^^^...==...^^^..T',
    'T..###...==...###..T',
    'T..#D#...==...#D#..T',
    'T==================T',
    'T..*..S.....S..*...T',
    'T.....,,,..,,,.....T',
    'T.L...,,,..,,,...L.T',
    'T..................T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 0, to: 'honsai_market', toX: 9, toY: 9, requires: 'beat_mute_gatekeeper', lockedText: "The Mute Gatekeeper's silence seals the road north." },
    { x: 10, y: 0, to: 'honsai_market', toX: 10, toY: 9, requires: 'beat_mute_gatekeeper', lockedText: "The Mute Gatekeeper's silence seals the road north." },
  ],
  npcs: [
    { id: 'koe', name: 'Koe, the last voice', x: 5, y: 8, sprite: 'folk:woman:koe_voice', facing: 'down', heals: true,
      dialogue: [
        { speaker: 'Koe', ja: 'こえ', text: 'You can SPEAK? Then you are the Scribe. I am Koe: 声, "voice". I am the last one in this town who still can.' },
        { speaker: 'Koe', text: 'Wapul took our words one by one: first the hard ones, then "thank you", then our own names. People here only point and bow now.' },
        { speaker: 'Koe', text: 'Every word you master is one he must give back. Rest with me whenever the silence wears you down.' },
      ] },
    { id: 'honsai_crane', name: "Kaito's Paper Crane", x: 14, y: 11, sprite: 'prop:papercrane', facing: 'down',
      dialogue: [{ speaker: "Kaito's Paper Crane", ja: 'さくらむらへ', text: 'A crane folded by Master Kaito. It will carry you home to the Hayate Dojo, and back here when you speak to him.' }],
      travelsTo: { map: 'hayate_dojo', x: 6, y: 4 } },
    { id: 'mute_gatekeeper', name: 'The Mute Gatekeeper', x: 12, y: 3, sprite: 'folk:warrior:mute_gatekeeper', facing: 'left', hideIf: 'beat_mute_gatekeeper',
      dialogue: [
        { speaker: 'The Mute Gatekeeper', text: '……… ………' },
        { speaker: 'System', text: "Wapul's runes have sewn its mouth shut. Words are etched on its armour: greetings, people, numbers, days. Read them back to break the seal!" },
        { speaker: 'System', text: 'DISTRICT 1: the first 200 words of Honsai, and the grammar of は, が, の and counting.' },
      ],
      battle: { winFlag: 'beat_mute_gatekeeper', isBoss: true, foes: [
        { familyId: 'noppera', level: 66, name: 'The Mute Gatekeeper', nameJa: 'もくもんばん', sprite: 'folk:warrior:mute_gatekeeper', recruitable: false, hpScale: 5.5 },
      ] } },
    { id: 'gatekeeper_freed', name: 'The Gatekeeper', x: 12, y: 3, sprite: 'folk:warrior:mute_gatekeeper', facing: 'left', showIf: 'beat_mute_gatekeeper',
      dialogue: [
        { speaker: 'The Gatekeeper', ja: 'おはようございます……', text: 'Ohayou gozaimasu... My first words in a thousand years, and they are "good morning". Thank you, Scribe.' },
        { speaker: 'The Gatekeeper', text: 'Far above, in the Silent Citadel, something laughed when my seal broke. Wapul knows you are here now. The road to Ichiba Market is open.' },
        { speaker: 'The Gatekeeper', ja: 'じょし', text: 'And the Hall of Joints on the east side has opened again. Wapul\'s lieutenant took our particles there: は, が, を, に... Without them every sentence is a heap of words.' },
      ] },
    { id: 'joints_door', name: 'Hall of Joints', x: 17, y: 8, sprite: 'prop:hallgate', facing: 'down', showIf: 'beat_mute_gatekeeper',
      dialogue: [{ speaker: 'Hall of Joints', ja: 'かんせつの ま', text: 'The Hall of Joints. Particles are the joints of a sentence: here their keepers teach them, one group at a time.' }],
      travelsTo: { map: 'honsai_joints', x: 7, y: 10 } },
    ...silenced('aisatsu', 'Old Aisatsu', 'folk:oldman:aisatsu', 3, 11, 'beat_mute_gatekeeper',
      '(He bows as you pass and opens his mouth. Nothing comes out. He has lost おはよう.)',
      [{ ja: 'おはようございます！', text: 'Ohayou gozaimasu! Ten silent years without a "good morning", and now I cannot stop saying it. こんにちは! こんばんは!' }]),
    ...silenced('kazu', 'Little Kazu', 'folk:girl:kazu_counts', 16, 11, 'beat_mute_gatekeeper',
      '(She holds up three fingers, then two, then gives up and cries. The numbers are gone.)',
      [{ ja: 'いち、に、さん！', text: 'Ichi, ni, san! And things are ひとつ、ふたつ、みっつ, and cats are いっぴき、にひき. I remember all of it!' }]),
    ...silenced('toki', 'Toki the clockmaker', 'folk:man:toki_clocks', 7, 3, 'beat_mute_gatekeeper',
      '(He points at his clocks and calendars and shrugs. No words for today, tomorrow, or Monday.)',
      [{ ja: 'きょうは げつようび！', text: 'Kyou wa getsuyoubi! Today is Monday, and tomorrow is あした. I have appointments again. Wonderful, terrible appointments.' }]),
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(62, 65),
  music: 'village', weather: 'sakura', rideable: true,
};

// ── District 2: Ichiba Market (市場). Food, shopping, colours, adjectives. ──
const honsai_market: MapDef = {
  id: 'honsai_market', name: 'Ichiba Market', nameJa: 'いちば', area: 'honsai2',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'T.......L==L.......T',
    'T.NNN.NNN==NNN.NNN.T',
    'T..................T',
    'T.NNN.NNN..NNN.NNN.T',
    'T..................T',
    'T*..S....==....S..*T',
    'T........==........T',
    'T..L.....==.....L..T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 10, to: 'honsai_gate', toX: 9, toY: 1 },
    { x: 10, y: 10, to: 'honsai_gate', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_village', toX: 9, toY: 9, requires: 'beat_merchant_noprice', lockedText: 'A merchant with an empty scale blocks the lane: nothing gets past without a price.' },
    { x: 10, y: 0, to: 'honsai_village', toX: 10, toY: 9, requires: 'beat_merchant_noprice', lockedText: 'A merchant with an empty scale blocks the lane: nothing gets past without a price.' },
  ],
  npcs: [
    { id: 'aji_teacher', name: 'Aji, the taster', x: 12, y: 7, sprite: 'folk:woman:aji_taster', facing: 'down',
      dialogue: [
        { speaker: 'Aji', ja: 'たかい、たかくない、たかかった', text: 'Adjectives here change their endings: たかい, たかくない (not expensive), たかかった (was expensive). Wapul stole the endings first, so nobody can bargain.' },
        { speaker: 'Aji', text: 'な-adjectives are gentler: しずか, しずかじゃない, しずかだった. Learn both and this market will sing.' },
      ] },
    { id: 'merchant_noprice', name: 'The Merchant Without Prices', x: 12, y: 1, sprite: 'folk:merchant:no_price', facing: 'down', hideIf: 'beat_merchant_noprice',
      dialogue: [
        { speaker: 'The Merchant Without Prices', text: '……… (He holds out an empty scale. Wapul\'s rune is carved in its pan: "nothing is worth anything".)' },
        { speaker: 'System', text: 'Read his wares: their names, their prices, and whether they were good or bad, cheap or dear.' },
        { speaker: 'System', text: 'DISTRICT 2: food, shopping and colours, and how adjectives bend into the negative and the past.' },
      ],
      battle: { winFlag: 'beat_merchant_noprice', isBoss: true, foes: [
        { familyId: 'baku', level: 67, name: 'The Merchant Without Prices', nameJa: 'ねだんなし', sprite: 'folk:merchant:no_price', recruitable: false, hpScale: 3 },
      ] } },
    { id: 'merchant_freed', name: 'The Merchant', x: 12, y: 1, sprite: 'folk:merchant:no_price', facing: 'down', showIf: 'beat_merchant_noprice',
      dialogue: [
        { speaker: 'The Merchant', ja: 'たかくない！ やすい！', text: 'Takakunai! Yasui! Not expensive: cheap! I can haggle again. You have no idea how much I missed haggling.' },
        { speaker: 'The Merchant', text: 'The lane north runs to Ie-no-Sato, the home village. They say the houses there have forgotten how to DO anything.' },
      ] },
    ...silenced('kudamono', 'Kudamono the fruit seller', 'folk:woman:kudamono_seller', 5, 3, 'beat_merchant_noprice',
      '(She points at her fruit, then at the price tags. The tags are blank.)',
      [{ ja: 'りんご ひとつ、ひゃくえん！', text: 'Ringo hitotsu, hyaku-en! One apple, a hundred yen! あまい, sweet, and not at all すっぱい.' }]),
    ...silenced('men', 'Men the noodle cook', 'folk:man:men_noodles', 15, 5, 'beat_merchant_noprice',
      '(He sets a bowl in front of you and waits, as if for a word you should say before eating.)',
      [{ ja: 'いただきます、でしょう？', text: 'You say いただきます before eating, remember? Now eat. Careful: あつい! And when you finish, ごちそうさまでした.' }]),
    ...silenced('iroha', 'Iroha the dyer', 'folk:girl:iroha_dyer', 3, 7, 'beat_merchant_noprice',
      '(Bolts of cloth in every colour hang around her, and she can name none of them.)',
      [{ ja: 'あか、あお、きいろ！', text: 'Aka, ao, kiiro! Red, blue, yellow! And when the colour describes a thing: あかい きもの, a red kimono.' }]),
  ],
  encounterRate: 0.08,
  encounters: HONSAI_ENCOUNTERS(63, 66),
  music: 'market', weather: 'none', rideable: false,
};

// ── District 3: Ie-no-Sato (家の里). Family, home, everyday verbs, the ます form. ──
const honsai_village: MapDef = {
  id: 'honsai_village', name: 'Ie-no-Sato', nameJa: 'いえのさと', area: 'honsai3',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'T,,,,,......,,,,,,,T',
    'T,^^^,......^^^^^,,T',
    'T,###,......#####,,T',
    'T,#D#,......##D##,,T',
    'T..=....====....=..T',
    'T==================T',
    'T.*...*..==..*...*.T',
    'T..L.....==.....L..T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 10, to: 'honsai_market', toX: 9, toY: 1 },
    { x: 10, y: 10, to: 'honsai_market', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_bridges', toX: 9, toY: 13, requires: 'beat_housekeeper', lockedText: 'The road north is blocked by heaps of unfolded laundry. The Sleepless Housekeeper will not let anyone pass.' },
    { x: 10, y: 0, to: 'honsai_bridges', toX: 10, toY: 13, requires: 'beat_housekeeper', lockedText: 'The road north is blocked by heaps of unfolded laundry. The Sleepless Housekeeper will not let anyone pass.' },
  ],
  npcs: [
    { id: 'tanren_smith', name: 'Tanren of the Verb Forge', x: 6, y: 8, sprite: 'folk:man:tanren_smith', facing: 'down',
      dialogue: [
        { speaker: 'Tanren', ja: '動詞の鍛冶場', text: 'The Verb Forge. A verb is metal: heat it with ます, bend it with ません, temper it with ました.' },
        { speaker: 'Tanren', text: 'Group 2 verbs drop る (食べる → 食べます). Group 1 verbs move their last sound to the い-row (書く → 書きます). する and 来る you learn by heart.' },
        { speaker: 'System', text: 'VERB FORGE: a sparring battle of conjugation only. Fight as often as you like.' },
      ],
      battle: { winFlag: 'forge_spar_3', isBoss: false, pool: 'honsai_forge3', repeatable: true, foes: [
        { familyId: 'dvergr', level: 64, name: 'Tanren', nameJa: 'たんれん', sprite: 'folk:man:tanren_smith', recruitable: false, hpScale: 3.5 },
      ] } },
    { id: 'housekeeper', name: 'The Sleepless Housekeeper', x: 14, y: 5, sprite: 'folk:oldwoman:sleepless_keeper', facing: 'down', hideIf: 'beat_housekeeper',
      dialogue: [
        { speaker: 'The Sleepless Housekeeper', text: '……… (She sweeps, cooks, washes and folds all at once, endlessly, and cannot say what any of it is called.)' },
        { speaker: 'System', text: 'Read her chores: every verb of the home, and how each one bends into ます, ません and ました.' },
        { speaker: 'System', text: 'DISTRICT 3: family, house and everyday verbs, and the polite ます forms of all three verb groups.' },
      ],
      battle: { winFlag: 'beat_housekeeper', isBoss: true, foes: [
        { familyId: 'yamabiko', level: 68, name: 'The Sleepless Housekeeper', nameJa: 'ねむらずの かせいふ', sprite: 'folk:oldwoman:sleepless_keeper', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'housekeeper_freed', name: 'The Housekeeper', x: 14, y: 5, sprite: 'folk:oldwoman:sleepless_keeper', facing: 'down', showIf: 'beat_housekeeper',
      dialogue: [
        { speaker: 'The Housekeeper', ja: 'わたしは ねます。', text: 'Watashi wa nemasu: I... sleep. I can say it, so I can do it. Thank you, Scribe.' },
        { speaker: 'The Housekeeper', text: 'Beyond the hills lies Kakehashi, the Bridge City. Wapul broke every bridge there. They were built of て: 行って, 食べて, 読んで.' },
      ] },
    ...silenced('okaa', 'Okaa-san', 'folk:woman:okaa_dinner', 4, 7, 'beat_housekeeper',
      '(She waves her children in for dinner without a word. They do not come.)',
      [{ ja: 'ごはんですよ！', text: 'Gohan desu yo! Dinner time! ...And they came running. わたしの むすこと むすめです: my son and my daughter.' }]),
    ...silenced('ojii', 'Ojii-san on the porch', 'folk:oldman:ojii_porch', 15, 8, 'beat_housekeeper',
      '(He holds a toothbrush, a towel and a broom, and cannot remember which verb goes with which.)',
      [{ ja: 'はを みがきます。', text: 'Ha wo migakimasu: I brush my teeth. Heya wo souji shimasu: I clean the room. Verbs! Glorious verbs!' }]),
    ...silenced('taro_kid', 'Taro', 'folk:boy:taro_photo', 11, 8, 'beat_housekeeper',
      '(He tugs your sleeve and points at his family photograph. He cannot say father, or sister.)',
      [{ ja: 'ちちと ははと あねです！', text: 'My father, my mother and my big sister! About other people\'s families I say おとうさん, おかあさん, おねえさん.' }]),
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(64, 67),
  music: 'village', weather: 'none', rideable: true,
};

// ── The Hall of Joints (かんせつの ま): Honsai's particle school, off Kotoba Gate. ──
// Six keepers, each beside a practice board, in two rows; the Jointless at the back.
const STATIONS = [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 10, y: 2 }, { x: 2, y: 5 }, { x: 6, y: 5 }, { x: 10, y: 5 }];

const honsai_joints: MapDef = {
  id: 'honsai_joints', name: 'Hall of Joints', nameJa: 'かんせつの ま', area: 'honsai_joints',
  rows: [
    '###############',
    '#Ltttttttttttl#'.replace('l', 'L'),
    '#ttttttttttttt#',
    '#ttttttttttttt#',
    '#ttttttttttttt#',
    '#ttttttttttttt#',
    '#ttttttttttttt#',
    '#ttttttttttttt#',
    '#ttttLtttLtttt#',
    '#ttttttttttttt#',
    '#ttttttttttttt#',
    '#######D#######',
  ],
  warps: [{ x: 7, y: 11, to: 'honsai_gate', toX: 17, toY: 9 }],
  npcs: [
    ...PARTICLE_GROUPS.flatMap((g, i): NpcDef[] => {
      const at = STATIONS[i] as { x: number; y: number };
      return [
        { id: `keeper_${g.keeper.id}`, name: g.keeper.name, x: at.x, y: at.y, sprite: g.keeper.sprite, facing: 'down', stationary: true,
          dialogue: [
            ...g.teach.map((l) => ({ speaker: g.keeper.name, ...l })),
            { speaker: g.keeper.name, text: 'The board beside me is for practice. Spar with it as often as you like, until these particles come without thinking.' },
          ] },
        { id: `practice_${g.keeper.id}`, name: `Practice Board: ${g.title}`, x: at.x + 1, y: at.y, sprite: 'board', facing: 'down',
          dialogue: [{ speaker: 'Practice Board', text: `Practice: ${g.title}. Choose the particle that fits the English. Fight as often as you like.` }],
          battle: { winFlag: `joints_practice_${g.n}`, isBoss: false, pool: `joints${g.n}`, repeatable: true, foes: [
            { familyId: 'hitotsume', level: 64, name: `${g.title} Drill`, nameJa: 'れんしゅう', sprite: 'board', recruitable: false, hpScale: 5 },
          ] } },
      ];
    }),
    { id: 'jointless', name: 'Kansetsu-nashi, the Jointless', x: 7, y: 8, sprite: 'folk:warrior:jointless', facing: 'down', hideIf: 'beat_jointless',
      dialogue: [
        { speaker: 'Kansetsu-nashi', text: 'Watashi... gakusei... desu? WATASHI GAKUSEI DESU. You hear it? Words, words, and nothing holding them together. That is how Wapul likes them.' },
        { speaker: 'System', text: 'The Jointless wears every stolen particle as a bead on its armour. Put each one back where it belongs.' },
        { speaker: 'System', text: 'THE HALL OF JOINTS: every particle the keepers teach, mixed. Read the English, then choose.' },
      ],
      battle: { winFlag: 'beat_jointless', isBoss: true, foes: [
        { familyId: 'hitotsume', level: 68, name: 'Kansetsu-nashi', nameJa: 'かんせつなし', sprite: 'folk:warrior:jointless', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'jointless_freed', name: 'Kansetsu, restored', x: 7, y: 8, sprite: 'folk:warrior:jointless', facing: 'down', showIf: 'beat_jointless',
      dialogue: [
        { speaker: 'Kansetsu', ja: 'わたしは がくせいです。', text: 'Watashi WA gakusei desu. One little は, and it is a sentence again. I had forgotten how good that sounds.' },
        { speaker: 'Kansetsu', text: 'Keep the keepers busy, Scribe. Particles are learned the way a dancer learns joints: a thousand small repetitions.' },
      ] },
  ],
  encounterRate: 0,
  encounters: [],
  music: 'temple', weather: 'none', rideable: false,
};

export const HONSAI_MAPS: readonly MapDef[] = [honsai_gate, honsai_market, honsai_village, honsai_joints];

/** Master Kaito, once the Jarl has fallen: the way into Honsai. */
export const KAITO_HONSAI: NpcDef[] = [
  { id: 'kaito_honsai', name: 'Master Kaito', x: 6, y: 2, sprite: 'master', facing: 'down', showIf: SPEECHLESS, hideIf: 'honsai_open', heals: true,
    setsFlag: 'honsai_open', travelsTo: { map: 'honsai_gate', x: 10, y: 11 },
    dialogue: [
      { speaker: 'Master Kaito', ja: 'まだ おわって いない。', text: 'Mada owatte inai: it is not over. The Jarl is beaten, and still the runestones hum. Sit, Scribe.' },
      { speaker: 'Master Kaito', text: 'The runes were never northern. They are chips of an ancient seal, carved to hold back Wapul, the Demon Lord of Silence. The Jarl found them, and used them, and cracked the seal.' },
      { speaker: 'Master Kaito', ja: '本才', text: 'Beyond the eastern mountains lies Honsai, 本才: the land where our speech was first spoken, sealed for a thousand years.' },
      { speaker: 'Master Kaito', text: 'Wapul does not break words. He EATS them. Every word a person forgets becomes his, and the people of Honsai are going silent, district by district.' },
      { speaker: 'Master Kaito', ja: '動詞は骨、助詞は関節', text: 'Verbs are the bones of speech, particles the joints, conjugation the movement. His lieutenants stole each. Learn thousands of words, Scribe, and speak them back.' },
      { speaker: 'System', text: 'ARC 6: HONSAI. A land of vocabulary and grammar. Master Kaito opens a road of paper lanterns, and you set out east.' },
    ] },
  { id: 'kaito_honsai_after', name: 'Master Kaito', x: 6, y: 2, sprite: 'master', facing: 'down', showIf: 'honsai_open', heals: true,
    travelsTo: { map: 'honsai_gate', x: 10, y: 11 },
    dialogue: [{ speaker: 'Master Kaito', text: 'Honsai waits. Every word you learn there is a word Wapul cannot have. Shall I send you back?' }] },
];
