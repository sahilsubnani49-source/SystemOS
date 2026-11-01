import type { MapDef } from '../types';

// Arc 1 — Sakura Valley. Legend: see DEFAULT_LEGEND in ../types.ts.
//   . grass  , tall grass  = path  ~ water  H bridge  T tree  S sakura  B bamboo
//   # wall  ^ roof  D door  t tatami  _ floor  L stone lantern  I torii  | fence
//   o rock  * flowers  s sand  W deep water
// Story flags, in order: starter → beat_goro (+horse) → beat_bjorn → beat_shizuka
//   → shrine_trial → beat_oni.

const hayate_dojo: MapDef = {
  id: 'hayate_dojo', name: 'Hayate Dojo', nameJa: 'はやてどうじょう', area: 'dojo',
  rows: [
    '#############',
    '#ttttttttttt#',
    '#ttttttttttt#',
    '#ttLttttLttt#',
    '#ttttttttttt#',
    '#ttttttttttt#',
    '#ttttttttttt#',
    '#ttttttttttt#',
    '#ttttttttttt#',
    '#ttttttttttt#',
    '######D######',
  ],
  warps: [{ x: 6, y: 10, to: 'sakura_village', toX: 5, toY: 13 }],
  npcs: [
    {
      id: 'master_kaito', name: 'Master Kaito', x: 6, y: 2, sprite: 'master', facing: 'down', hideIf: 'starter',
      setsFlag: 'starter', givesSpirit: { familyId: 'akari', level: 3 }, heals: true,
      dialogue: [
        { speaker: 'Master Kaito', ja: 'おはよう。', text: 'Good morning, young Scribe. The runestones the raiders carried have shattered the written word.' },
        { speaker: 'Master Kaito', text: 'Every character that broke loose became a wild spirit, a Kotodama. Read one correctly and it is purified. Misread it and it turns on you.' },
        { speaker: 'Master Kaito', text: 'Take this lantern spirit, Akari. It is born of the vowels: あ い う え お. Train with it in the tall grass outside.' },
        { speaker: 'System', text: 'Akari joined your party! Weakened wild spirits can be PURIFIED: type their true kana and they join you.' },
      ],
    },
    {
      id: 'master_kaito_after', name: 'Master Kaito', x: 6, y: 2, sprite: 'master', facing: 'down', showIf: 'starter', heals: true,
      dialogue: [
        { speaker: 'Master Kaito', text: 'Rest here whenever you are wounded. A ronin named Goro has made the Bamboo Grove to the north his own. Prove yourself there.' },
      ],
    },
  ],
  encounterRate: 0, encounters: [], music: 'dojo', weather: 'none', rideable: false,
};

const sakura_village: MapDef = {
  id: 'sakura_village', name: 'Sakura Village', nameJa: 'さくらむら', area: 'dojo',
  rows: [
    'TTTTTTTTT=TTTTTTTTTT',
    'TSS......=.......SST',
    'T.^^^^^..=...^^^^^.T',
    'T.^^^^^..=...^^^^^.T',
    'T.##D##..=...##D##.T',
    'T...=....=.....=...T',
    'T*..============..*T',
    'T*.......=........*T',
    'T..L.....=......L..T',
    'T........=.........T',
    'T..^^^^^.=.........T',
    'T..^^^^^.=...,,,,..T',
    'T..##D##.=...,,,,..T',
    'T....=====...,,,,..T',
    'T~~~~~~~~H~~~~~~~~~T',
    'T........=.........T',
    'TTTTTTTTT=TTTTTTTTTT',
  ],
  warps: [
    { x: 5, y: 12, to: 'hayate_dojo', toX: 6, toY: 9 },
    { x: 9, y: 0, to: 'bamboo_grove', toX: 9, toY: 17 },
    { x: 9, y: 16, to: 'river_crossing', toX: 2, toY: 1, requires: 'beat_goro',
      lockedText: 'Raider tracks lead south. Master Kaito wants you to face Ronin Goro in the Bamboo Grove first.' },
  ],
  npcs: [
    { id: 'guard', name: 'Guard Tetsu', x: 9, y: 1, sprite: 'ronin', facing: 'down', hideIf: 'starter',
      dialogue: [{ speaker: 'Guard Tetsu', text: 'No one leaves the village without a spirit companion. Master Kaito is in the dojo to the southwest.' }] },
    { id: 'haru', name: 'Old Haru', x: 7, y: 8, sprite: 'villager', facing: 'right',
      dialogue: [
        { speaker: 'Old Haru', ja: 'こんにちは！', text: 'Konnichiwa! The northmen came on dragon-headed ships. Their rune magic turned our signs into gibberish.' },
        { speaker: 'Old Haru', text: 'The tall grass east of here is crawling with corrupted vowels. Good practice, if you ask me.' },
      ] },
    { id: 'sayo', name: 'Sayo', x: 13, y: 6, sprite: 'villagerB', facing: 'down',
      dialogue: [{ speaker: 'Sayo', text: 'Tip: a spirit evolves when YOU master its kana row. Your Akari grows as you learn あいうえお.' }] },
    { id: 'merchant', name: 'Merchant Ichiro', x: 16, y: 9, sprite: 'merchant', facing: 'left',
      dialogue: [{ speaker: 'Merchant Ichiro', text: 'Answering fast makes ninja crits. Chaining right answers makes everyone hit harder. That one is free advice.' }] },
  ],
  encounterRate: 0.18,
  encounters: [{ familyId: 'akari', weight: 1, levels: [2, 3] }],
  music: 'village', weather: 'sakura', rideable: true,
};

const bamboo_grove: MapDef = {
  id: 'bamboo_grove', name: 'Bamboo Grove', nameJa: 'たけばやし', area: 'bamboo',
  rows: [
    'TTTTTTTTTTTTTTTTTTT',
    'TBBBBBBB===BBBBBBBT',
    'TBBBBBBB=I=BBBBBBBT',
    'TBBB.....=.....BBBT',
    'TBB..BBBB=BBBB..BBT',
    'TB..BBBBB=BBBBB..BT',
    'TB.BBB...=...BBB.BT',
    'TB.BB..BB=BB..BB.BT',
    'TB.B..BBB=BBB..B.BT',
    'TB...BBBB=BBBB...BT',
    'TBB.BBBB.=.BBBB.BBT',
    'TBB.BBB..=..BBB.BBT',
    'TB..BB..o=o..BB..BT',
    'TB.BB..BB=BB..BB.BT',
    'TB.B..BBB=BBB..B.BT',
    'TB...BBBB=BBBB...BT',
    'TBBBBBBBB=BBBBBBBBT',
    'TBBBBBBBB=BBBBBBBBT',
    'TTTTTTTTT=TTTTTTTTT',
  ],
  warps: [{ x: 9, y: 18, to: 'sakura_village', toX: 9, toY: 1 }],
  npcs: [
    { id: 'goro', name: 'Ronin Goro', x: 9, y: 3, sprite: 'ronin', facing: 'down', hideIf: 'beat_goro',
      dialogue: [
        { speaker: 'Ronin Goro', text: 'A dojo brat? I took this grove and the warhorse the raiders left behind. Read my blade, if you can.' },
      ],
      battle: { winFlag: 'beat_goro', isBoss: true, foes: [
        { familyId: 'kobi', level: 6, name: 'Ronin Goro', nameJa: 'ごろう', sprite: 'ronin', recruitable: false, hpScale: 6.2 },
      ] } },
    { id: 'goro_after', name: 'Ronin Goro', x: 9, y: 3, sprite: 'ronin', facing: 'down', showIf: 'beat_goro',
      setsFlag: 'got_horse', givesHorse: true,
      dialogue: [
        { speaker: 'Ronin Goro', text: 'Hah. Your reading is sharper than my sword. Take the horse, Hayate. He runs faster the more days in a row you train.' },
        { speaker: 'System', text: 'You received the warhorse Hayate! Tap the horse button to ride. The south road is now open.' },
      ] },
  ],
  encounterRate: 0.14,
  encounters: [
    { familyId: 'akari', weight: 2, levels: [3, 5] },
    { familyId: 'kobi', weight: 3, levels: [3, 5] },
  ],
  music: 'forest', weather: 'fireflies', rideable: true,
};

const river_crossing: MapDef = {
  id: 'river_crossing', name: 'River Crossing', nameJa: 'かわのわたし', area: 'river',
  rows: [
    'TT=TTTTTTTTTTTTTTTTTTT',
    'T.=.....,,,,,.......sT',
    'T.=....,,,,,,,.....ssT',
    'T.=....,,,,,,,....ss~T',
    'T.=======........ss~~T',
    'T.......=.......ss~~WT',
    'Tss.....=.....sss~~WWT',
    'T~ss....=....ss~~~WWWT',
    'T~~~ss..=..ss~~~WWWWWT',
    'TW~~~~~~H~~~~~WWWWWWWT',
    'TWW~~~~~H~~~~~~WWWWWWT',
    'T~~~ss..=..ss~~~~WWWWT',
    'Tss.....=......ss~~WWT',
    'T....,,,=,,,......ss~T',
    'T...,,,,=,,,,,=======T',
    'T...,,,,=,,,,.......sT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  warps: [
    { x: 2, y: 0, to: 'sakura_village', toX: 9, toY: 15 },
    { x: 20, y: 14, to: 'ninja_hideout', toX: 1, toY: 8, requires: 'beat_bjorn',
      lockedText: 'A Viking scout blocks the eastern path with a rune-shield.' },
  ],
  npcs: [
    { id: 'bjorn', name: 'Bjorn the Scout', x: 19, y: 14, sprite: 'viking', facing: 'left', hideIf: 'beat_bjorn',
      dialogue: [
        { speaker: 'Bjorn the Scout', text: 'Ha! The Jarl says your little letters bend to our runes now. Show me, island boy!' },
      ],
      battle: { winFlag: 'beat_bjorn', isBoss: true, foes: [
        { familyId: 'riki', level: 10, name: 'Bjorn the Scout', nameJa: 'ビョルン', sprite: 'viking', recruitable: false, hpScale: 3.2 },
      ] } },
    { id: 'river_ferry', name: 'Ferryman Gen', x: 16, y: 6, sprite: 'ferryman', facing: 'left', showIf: 'beat_oni',
      travelsTo: { map: 'frost_harbor', x: 9, y: 12 },
      dialogue: [
        { speaker: 'Ferryman Gen', text: 'The northmen\'s harbor? Brave. Their rune-scribes write in katakana, the square script. Climb in.' },
      ] },
    { id: 'fisher', name: 'Fisher Mei', x: 4, y: 12, sprite: 'villagerB', facing: 'right',
      dialogue: [{ speaker: 'Fisher Mei', text: 'Kappa spirits in the reeds splash with さしすせそ. The shy tanuki read たちつてと. Listen closely to し and ち!' }] },
  ],
  encounterRate: 0.16,
  encounters: [
    { familyId: 'suiko', weight: 3, levels: [6, 8] },
    { familyId: 'tanu', weight: 3, levels: [6, 8] },
    { familyId: 'kobi', weight: 1, levels: [6, 7] },
  ],
  music: 'river', weather: 'sakura', rideable: true,
};

const ninja_hideout: MapDef = {
  id: 'ninja_hideout', name: 'Ninja Hideout', nameJa: 'にんじゃのかくれが', area: 'hideout',
  rows: [
    'oooooooooooooooooooo',
    'o_____,,,,,,,,_____o',
    'o_ooo_,,oooo,,_ooo_o',
    'o_o___,,o__o,,___o_o',
    'o_o_oooooo_oooooo__o',
    'o___o,,,,,_,,,,,o__o',
    'oooo_,,ooo_ooo,,o__o',
    'o____,,o_____o,,___o',
    '=____,,o__L__o,,___o',
    'o____,,o_____o,,___o',
    'oooo_,,ooo_ooo,,o__o',
    'o___o,,,,,_,,,,,o__o',
    'o_o_oooooo_oooooo__o',
    'o_o___,,,,_,,,,___oo',
    'o_ooo_,,,,_,,,,_oooo',
    'o_____,,,,_,,,,_____',
    'oooooooooooooooooooo',
  ],
  warps: [
    { x: 0, y: 8, to: 'river_crossing', toX: 19, toY: 15 },
    { x: 19, y: 15, to: 'mountain_pass', toX: 1, toY: 16, requires: 'beat_shizuka',
      lockedText: 'A hidden lock seals the passage. It answers only to the hideout master.' },
  ],
  npcs: [
    { id: 'shizuka', name: 'Kunoichi Shizuka', x: 10, y: 7, sprite: 'kunoichi', facing: 'down', hideIf: 'beat_shizuka',
      dialogue: [
        { speaker: 'Kunoichi Shizuka', text: 'You found the hideout. The Jarl pays well for scrolls. Let us see if your eyes are as quick as mine.' },
      ],
      battle: { winFlag: 'beat_shizuka', isBoss: true, foes: [
        { familyId: 'mimi', level: 13, name: 'Kunoichi Shizuka', nameJa: 'しずか', sprite: 'kunoichi', recruitable: false, hpScale: 8 },
      ] } },
    { id: 'shizuka_after', name: 'Kunoichi Shizuka', x: 10, y: 7, sprite: 'kunoichi', facing: 'down', showIf: 'beat_shizuka',
      dialogue: [{ speaker: 'Kunoichi Shizuka', text: 'I was wrong to sell to the northmen. The lock in the southeast corner is open. The Moon Shrine lies beyond the pass.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'nekaze', weight: 3, levels: [9, 12] },
    { familyId: 'hikari', weight: 2, levels: [9, 12] },
    { familyId: 'mimi', weight: 3, levels: [9, 12] },
  ],
  music: 'hideout', weather: 'none', rideable: false, darkness: 0.45,
};

const mountain_pass: MapDef = {
  id: 'mountain_pass', name: 'Mountain Pass', nameJa: 'やまのみち', area: 'pass',
  rows: [
    'oooooooooo=ooooooooo',
    'oTT...,,,,=,,,,..TTo',
    'oT..o.,,,,=,,,,.o..o',
    'o...oo,,,,=,,,,oo..o',
    'o....o....=....o...o',
    'oS........=.......So',
    'o..====I==========.o',
    'o..=..........,,=..o',
    'o..=..ooo..oo.,,=..o',
    'o,,=,,o.....o,,,=,,o',
    'o,,=,,o.....o,,,=,,o',
    'o,,=,,ooo.ooo,,,=,,o',
    'o..=............=..o',
    'o..==============..o',
    'oT.=.............TTo',
    'oT.=..S.....S....TTo',
    '===................o',
    'oooooooooooooooooooo',
  ],
  warps: [
    { x: 0, y: 16, to: 'ninja_hideout', toX: 18, toY: 15 },
    { x: 10, y: 0, to: 'moon_shrine', toX: 7, toY: 12 },
  ],
  npcs: [
    { id: 'monk', name: 'Wandering Monk', x: 9, y: 12, sprite: 'master', facing: 'up',
      dialogue: [
        { speaker: 'Wandering Monk', text: 'The last basic rows live here: やゆよ, らりるれろ, わ, を and ん. Then the Moon Shrine will teach you the voiced sounds.' },
      ] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'yozakura', weight: 3, levels: [12, 15] },
    { familyId: 'riki', weight: 2, levels: [12, 15] },
    { familyId: 'wadachi', weight: 2, levels: [12, 15] },
  ],
  music: 'mountain', weather: 'sakura', rideable: true,
};

const moon_shrine: MapDef = {
  id: 'moon_shrine', name: 'Moon Shrine', nameJa: 'つきのじんじゃ', area: 'shrine',
  rows: [
    'TTTTTTTTTTTTTTT',
    'TS..^^^^^^^..ST',
    'T...^^^^^^^...T',
    'T...###D###...T',
    'T*....L=L....*T',
    'T.....===.....T',
    'T......=......T',
    'T..L...=...L..T',
    'T......I......T',
    'T......=......T',
    'T*.....=.....*T',
    'TS.....=.....ST',
    'T......=......T',
    'TTTTTTT=TTTTTTT',
  ],
  warps: [
    { x: 7, y: 13, to: 'mountain_pass', toX: 10, toY: 1 },
    { x: 7, y: 3, to: 'broken_gate', toX: 8, toY: 12, requires: 'shrine_trial',
      lockedText: 'The inner sanctum, and the path to the Broken Gate beyond it, is sealed. The shrine maiden must judge you first.' },
  ],
  npcs: [
    { id: 'miko', name: 'Shrine Maiden Ayame', x: 9, y: 6, sprite: 'miko', facing: 'down', hideIf: 'shrine_trial', heals: true,
      dialogue: [
        { speaker: 'Ayame', text: 'Two small marks change a sound: か becomes が, は becomes ば, and a circle makes ぱ.' },
        { speaker: 'Ayame', text: 'The guardian of this shrine will test you on every voiced sound. Win, and the gate path opens.' },
      ],
      battle: { winFlag: 'shrine_trial', isBoss: true, pool: 'shrine', foes: [
        { familyId: 'riki', level: 15, name: 'Shrine Guardian', nameJa: 'こまいぬ', sprite: 'riki1', recruitable: false, hpScale: 3.4 },
      ] } },
    { id: 'miko_after', name: 'Shrine Maiden Ayame', x: 9, y: 6, sprite: 'miko', facing: 'down', showIf: 'shrine_trial', heals: true,
      dialogue: [{ speaker: 'Ayame', text: 'The Oni at the Broken Gate tests everything, even the combined sounds like きゃ and しょ. I have healed your party. Go.' }] },
  ],
  encounterRate: 0, encounters: [], music: 'shrine', weather: 'sakura', rideable: false,
};

const broken_gate: MapDef = {
  id: 'broken_gate', name: 'The Broken Gate', nameJa: 'こわれたもん', area: 'gate',
  rows: [
    'ooooooooooooooooo',
    'oooooo#####oooooo',
    'ooo...#^^^#...ooo',
    'oo.....III.....oo',
    'oo......=......oo',
    'oo..L...=...L..oo',
    'oo......=......oo',
    'oo,,,...=...,,,oo',
    'oo,,,...=...,,,oo',
    'oo......=......oo',
    'oo..L...=...L..oo',
    'oo......=......oo',
    'ooo.....=.....ooo',
    'oooooooo=oooooooo',
  ],
  warps: [{ x: 8, y: 13, to: 'moon_shrine', toX: 7, toY: 4 }],
  npcs: [
    { id: 'oni', name: 'Oni of the Broken Gate', x: 8, y: 4, sprite: 'oni', facing: 'down', hideIf: 'beat_oni',
      dialogue: [
        { speaker: 'Oni', ja: 'よめるか？', text: 'Yomeru ka? Can you READ, little scribe? The Jarl promised me every letter of these isles.' },
      ],
      battle: { winFlag: 'beat_oni', isBoss: true, foes: [
        { familyId: 'tanu', level: 18, name: 'Oni of the Broken Gate', nameJa: 'おに', sprite: 'oni', recruitable: false, hpScale: 5.5 },
      ] } },
    { id: 'ending', name: 'Master Kaito', x: 8, y: 4, sprite: 'master', facing: 'down', showIf: 'beat_oni',
      dialogue: [
        { speaker: 'Master Kaito', text: 'You read every hiragana the Oni threw at you. Sakura Valley is free.' },
        { speaker: 'Master Kaito', text: 'But look to the sea: the Jarl\'s longships sail for Frost Harbor, and they write in katakana now.' },
        { speaker: 'System', text: 'ARC 1 COMPLETE. A ferryman now waits on the River Crossing shore to take you to Frost Harbor (Arc 2: katakana).' },
      ] },
  ],
  encounterRate: 0.12,
  encounters: [
    { familyId: 'nekaze', weight: 1, levels: [15, 17] },
    { familyId: 'riki', weight: 1, levels: [15, 17] },
    { familyId: 'mimi', weight: 1, levels: [15, 17] },
  ],
  music: 'boss', weather: 'none', rideable: false, darkness: 0.25,
};

export const ARC1_MAPS: readonly MapDef[] = [
  hayate_dojo, sakura_village, bamboo_grove, river_crossing, ninja_hideout, mountain_pass, moon_shrine, broken_gate,
];
