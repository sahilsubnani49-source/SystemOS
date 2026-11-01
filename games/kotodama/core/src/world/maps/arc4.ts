import type { MapDef } from '../types';

// Arc 4 — Mountain Temples. N4 kanji, vocabulary and context sentences.
// Legend additions (see ../types.ts):  v waterfall  e stone stairs  c cliff
// Story flags, in order: beat_genkai → beat_akaoni → abbot_trial → beat_kamaitachi
//   → beat_kuro → beat_tengu_king.

const mountain_foothills: MapDef = {
  id: 'mountain_foothills', name: 'Mountain Foothills', nameJa: 'やまのふもと', area: 'foothills',
  rows: [
    'cccccccccecccccccccc',
    'cBBBBpp..e..ppBBBBBc',
    'cBBBB....e....BBBBBc',
    'c,,,,....e....,,,,,c',
    'c,,,,..L.e.L..,,,,,c',
    'c..T.....=.....T...c',
    'c........=.........c',
    'c,,,,....=....,,,,,c',
    'c,,,,....=....,,,,,c',
    'c..S.....=.....S...c',
    'c........=.........c',
    'c........=.........c',
    'c........=.........c',
    'cccccccccccccccccccc',
  ],
  warps: [
    { x: 9, y: 0, to: 'mountain_village', toX: 1, toY: 4, requires: 'beat_genkai',
      lockedText: 'A yamabushi priest bars the mountain stairs. "Only those who can read the family and the seasons may climb."' },
  ],
  npcs: [
    { id: 'shogun_escort', name: 'Shogun\'s Escort', x: 10, y: 12, sprite: 'gatecaptain', facing: 'left',
      travelsTo: { map: 'castle_town', x: 9, y: 1 },
      dialogue: [{ speaker: 'Escort', text: 'The Shogun\'s palanquin can carry you back to the capital whenever you wish.' }] },
    { id: 'genkai', name: 'Yamabushi Genkai', x: 9, y: 3, sprite: 'yamabushi', facing: 'down', hideIf: 'beat_genkai',
      dialogue: [
        { speaker: 'Genkai', ja: '家族、兄弟、春夏秋冬', text: 'Kazoku, kyoudai, the four seasons. Up here we read N4: harder kanji, longer words, whole sentences.' },
        { speaker: 'Genkai', text: 'The Jarl passed this way with the Tengu King\'s blessing. Show me you can read the mountain\'s words, or go home.' },
      ],
      battle: { winFlag: 'beat_genkai', isBoss: true, foes: [
        { familyId: 'yamanba', level: 47, name: 'Yamabushi Genkai', nameJa: 'げんかい', sprite: 'yamabushi', recruitable: false, hpScale: 3.8 },
      ] } },
    { id: 'genkai_after', name: 'Yamabushi Genkai', x: 8, y: 3, sprite: 'yamabushi', facing: 'right', showIf: 'beat_genkai',
      dialogue: [{ speaker: 'Genkai', text: 'Climb. Every temple on this mountain teaches. Read the sentences carefully: a word can fit the grammar and still be wrong.' }] },
    { id: 'pilgrim', name: 'Pilgrim', x: 4, y: 10, sprite: 'villager', facing: 'right',
      dialogue: [{ speaker: 'Pilgrim', ja: '冬女', text: 'A snow woman walks the bamboo at dusk. They say she whispers the season kanji: 春, 夏, 秋, 冬.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'yamanba', weight: 3, levels: [44, 46] },
    { familyId: 'yukionna', weight: 3, levels: [44, 46] },
  ],
  music: 'mountain', weather: 'sakura', rideable: true,
};

const mountain_village: MapDef = {
  id: 'mountain_village', name: 'Mountain Village', nameJa: 'やまのむら', area: 'village',
  rows: [
    'cccccccccccccccccecc',
    'c^^^^..^^^^......e.c',
    'c#D##..##D#......e.c',
    'c..=.....=.......e.c',
    'e=================.c',
    'c,,,,,,....,,,,,,..c',
    'c,,,,,,..*.,,,,,,..c',
    'c~~~~~~~~H~~~~~~~~~c',
    'c,,,,,,..=.,,,,,,..c',
    'cccccccccccccccccccc',
  ],
  warps: [
    { x: 0, y: 4, to: 'mountain_foothills', toX: 9, toY: 1 },
    { x: 17, y: 0, to: 'monastery', toX: 6, toY: 7, requires: 'beat_akaoni', lockedText: 'A red oni sits on the monastery stairs, eating the village\'s rice.' },
  ],
  npcs: [
    { id: 'akaoni', name: 'Red Oni', x: 17, y: 3, sprite: 'oni', facing: 'left', hideIf: 'beat_akaoni',
      dialogue: [{ speaker: 'Red Oni', ja: 'ご飯、牛肉、お茶', text: 'Gohan! Gyuuniku! Ocha! The Tengu King gave me this whole village to eat. Read my menu or BE my menu.' }],
      battle: { winFlag: 'beat_akaoni', isBoss: true, foes: [
        { familyId: 'nue', level: 49, name: 'Red Oni', nameJa: 'あかおに', sprite: 'oni', recruitable: false, hpScale: 5.8 },
      ] } },
    { id: 'akaoni_after', name: 'Red Oni', x: 16, y: 3, sprite: 'oni', facing: 'left', showIf: 'beat_akaoni',
      dialogue: [{ speaker: 'Red Oni', text: 'Fine, fine. I will pay for my rice. The monastery abbot is stricter than me. Much stricter.' }] },
    { id: 'farmer', name: 'Farmer Hana', x: 5, y: 3, sprite: 'villagerB', facing: 'down',
      dialogue: [{ speaker: 'Hana', ja: '赤い、青い、黒い', text: 'Akai, aoi, kuroi: red, blue, black. The bean-washer spirits in the fields only answer to food and colour kanji.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'azukiarai', weight: 3, levels: [46, 48] },
    { familyId: 'nue', weight: 3, levels: [46, 48] },
  ],
  music: 'village', weather: 'none', rideable: true,
};

const monastery: MapDef = {
  id: 'monastery', name: 'Mountain Monastery', nameJa: 'やまでら', area: 'monastery',
  rows: [
    'ccccccccccccccc',
    'c^^^^^^^^^^^^^c',
    'c#####D######Lc',
    'c.....=.......c',
    'cgggg.=..gggg.e',
    'cgggg.=..gggg.c',
    'c.L...=....L..c',
    'c.....=.......c',
    'ccccccecccccccc',
  ],
  warps: [
    { x: 6, y: 8, to: 'mountain_village', toX: 17, toY: 1 },
    { x: 14, y: 4, to: 'waterfall_forest', toX: 1, toY: 5, requires: 'abbot_trial', lockedText: 'The forest gate opens only for students who have passed the abbot\'s examination.' },
  ],
  npcs: [
    { id: 'abbot', name: 'Abbot Ryoan', x: 6, y: 3, sprite: 'abbot', facing: 'down', hideIf: 'abbot_trial', heals: true,
      dialogue: [
        { speaker: 'Abbot Ryoan', ja: '勉強、試験、問題', text: 'Benkyou, shiken, mondai: study, examination, problem. A monastery is a school for the heart, 心.' },
        { speaker: 'Abbot Ryoan', text: 'My examination is on learning and on the body. Sit, and answer.' },
      ],
      battle: { winFlag: 'abbot_trial', isBoss: true, pool: 'monastery', foes: [
        { familyId: 'hitotsume', level: 51, name: 'Abbot Ryoan', nameJa: 'りょうあん', sprite: 'abbot', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'abbot_after', name: 'Abbot Ryoan', x: 6, y: 3, sprite: 'abbot', facing: 'down', showIf: 'abbot_trial', heals: true,
      dialogue: [{ speaker: 'Abbot Ryoan', text: 'You pass. Beyond the forest gate live the sickle-weasels. They move faster than thought: 走る, 動く, 止まる!' }] },
    { id: 'novice', name: 'Novice Monk', x: 3, y: 7, sprite: 'master', facing: 'right',
      dialogue: [{ speaker: 'Novice', text: 'The one-eyed temple boys hide in the raked gravel. They love study kanji. The faceless ones love health kanji: 頭, 顔, 声.' }] },
  ],
  encounterRate: 0.16,
  encounters: [
    { familyId: 'hitotsume', weight: 3, levels: [48, 50] },
    { familyId: 'noppera', weight: 3, levels: [48, 50] },
  ],
  music: 'temple', weather: 'sakura', rideable: false,
};

const waterfall_forest: MapDef = {
  id: 'waterfall_forest', name: 'Waterfall Forest', nameJa: 'たきのもり', area: 'forest',
  rows: [
    'cccvvvcccccccccccecc',
    'cTTvvvTT,,,,,,,,,e.c',
    'cT.~~~.T,,,,,,,,,e.c',
    'cT.~~~.TTTT......e.c',
    'c..~~~...........e.c',
    'e==HHH===========e.c',
    'c..~~~.,,,,,,,,,,..c',
    'c..~~~.,,,,,,,,,,..c',
    'c..~~~.....TT......c',
    'cccccccccccccccccccc',
  ],
  warps: [
    { x: 0, y: 5, to: 'monastery', toX: 13, toY: 4 },
    { x: 17, y: 0, to: 'tengu_peaks', toX: 13, toY: 8, requires: 'beat_kamaitachi', lockedText: 'The wind on the stairs cuts like a blade. Something fast is guarding them.' },
  ],
  npcs: [
    { id: 'kamaitachi_boss', name: 'Kamaitachi Brothers', x: 17, y: 3, sprite: 'kamaitachi2', facing: 'down', hideIf: 'beat_kamaitachi',
      dialogue: [{ speaker: 'Kamaitachi', ja: '走る、転ぶ、送る', text: 'One trips you, one cuts you, one heals the cut. Hashiru, korobu, okuru! Read us if you can keep up!' }],
      battle: { winFlag: 'beat_kamaitachi', isBoss: true, foes: [
        { familyId: 'kamaitachi', level: 53, name: 'Kamaitachi Brothers', nameJa: 'かまいたち', sprite: 'kamaitachi2', recruitable: false, hpScale: 6.2 },
      ] } },
    { id: 'woodcutter', name: 'Woodcutter', x: 9, y: 4, sprite: 'villager', facing: 'down',
      dialogue: [{ speaker: 'Woodcutter', ja: '森、林、海', text: 'Mori, hayashi: forest, grove. Count the trees in the kanji. The dog spirits of the woods guard the nature kanji.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'kamaitachi', weight: 3, levels: [50, 52] },
    { familyId: 'inugami', weight: 3, levels: [50, 52] },
  ],
  music: 'forest', weather: 'fireflies', rideable: true,
};

const tengu_peaks: MapDef = {
  id: 'tengu_peaks', name: 'Tengu Peaks', nameJa: 'てんぐのみね', area: 'peaks',
  rows: [
    'cccccccccccceccccccc',
    'cpp,,,,,....e.,,,ppc',
    'cp,,,,,,..ccecc,,,pc',
    'c..,,,,..oo.e.oo...c',
    'c....eeeeeeee......c',
    'c....e..cccc..,,,,,c',
    'cpp..e..cccc..,,,,,c',
    'c,,,,e,,,,,,,,,,,,pc',
    'c,,,,eeeeeeeee,,,,pc',
    'cccccccccccccecccccc',
  ],
  warps: [
    { x: 13, y: 9, to: 'waterfall_forest', toX: 17, toY: 1 },
    { x: 12, y: 0, to: 'tengu_summit', toX: 6, toY: 7, requires: 'beat_kuro', lockedText: 'Black wings blot out the summit stairs.' },
  ],
  npcs: [
    { id: 'kuro', name: 'Crow Captain Kuro', x: 12, y: 2, sprite: 'karasu', facing: 'down', hideIf: 'beat_kuro',
      dialogue: [{ speaker: 'Kuro', ja: '世界、地図、自分', text: 'Sekai, chizu, jibun: the world, the map, and yourself. The Tengu King has read them all. Have you?' }],
      battle: { winFlag: 'beat_kuro', isBoss: true, foes: [
        { familyId: 'yamabiko', level: 55, name: 'Crow Captain Kuro', nameJa: 'くろ', sprite: 'karasu', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'kuro_after', name: 'Crow Captain Kuro', x: 11, y: 3, sprite: 'karasu', facing: 'right', showIf: 'beat_kuro',
      dialogue: [{ speaker: 'Kuro', text: 'Caw. The King waits at the summit temple. He will test every N4 kanji, word and sentence. Breathe slowly.' }] },
  ],
  encounterRate: 0.18,
  encounters: [
    { familyId: 'warashi', weight: 2, levels: [52, 54] },
    { familyId: 'yamabiko', weight: 2, levels: [52, 54] },
    { familyId: 'baku', weight: 2, levels: [52, 54] },
  ],
  music: 'mountain', weather: 'snow', rideable: false,
};

const tengu_summit: MapDef = {
  id: 'tengu_summit', name: 'Summit Temple', nameJa: 'さんちょうのてら', area: 'summit',
  rows: [
    'ccccccccccccc',
    'c^^^^^^^^^^^c',
    'c#####D#####c',
    'cpL.......Lpc',
    'c...........c',
    'c.....e.....c',
    'c.....e.....c',
    'cpp...e...ppc',
    'ccccccecccccc',
  ],
  warps: [{ x: 6, y: 8, to: 'tengu_peaks', toX: 12, toY: 1 }],
  npcs: [
    { id: 'tengu_king', name: 'Tengu King', x: 6, y: 4, sprite: 'tenguking', facing: 'down', hideIf: 'beat_tengu_king',
      dialogue: [
        { speaker: 'Tengu King', ja: '以上', text: 'Ijou: "that is all." So says every exam proctor. I sheltered the Jarl because he promised me every word in the world.' },
        { speaker: 'System', text: 'N4 MOCK EXAM: every N4 kanji, word and sentence. Read each sentence to the end before you answer.' },
      ],
      battle: { winFlag: 'beat_tengu_king', isBoss: true, foes: [
        { familyId: 'baku', level: 58, name: 'Tengu King', nameJa: 'てんぐのおう', sprite: 'tenguking', recruitable: false, hpScale: 3 },
      ] } },
    { id: 'arc4_ending', name: 'Tengu King', x: 6, y: 4, sprite: 'tenguking', facing: 'down', showIf: 'beat_tengu_king',
      travelsTo: { map: 'rune_coast', x: 9, y: 7 },
      dialogue: [
        { speaker: 'Tengu King', text: 'Hmph. You read better than the Jarl ever will. He has fled north, to his Runeforge, to write his own language over ours.' },
        { speaker: 'Tengu King', text: 'Go, scribe. The northern kanji are the hardest of all.' },
        { speaker: 'System', text: 'ARC 4 COMPLETE: the N4 kanji are yours.' },
        { speaker: 'Tengu King', text: 'My winds will carry you north to the Rune Coast. Speak to me again whenever you wish to go.' },
      ] },
  ],
  encounterRate: 0, encounters: [], music: 'boss', weather: 'snow', rideable: false,
};

export const ARC4_MAPS: readonly MapDef[] = [mountain_foothills, mountain_village, monastery, waterfall_forest, tengu_peaks, tengu_summit];
