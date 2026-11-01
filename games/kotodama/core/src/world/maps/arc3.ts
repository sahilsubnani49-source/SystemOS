import type { MapDef } from '../types';

// Arc 3 — Castle Capital. N5 kanji and vocabulary. Legend additions (see ../types.ts):
//   m castle stonework  g raked gravel (encounters)  N shop front with noren curtain
// Story flags, in order: beat_takeda → beat_kaze → tea_trial → beat_hotaru
//   → beat_otomo → beat_shogun.

const castle_town: MapDef = {
  id: 'castle_town', name: 'Castle Town', nameJa: 'じょうかまち', area: 'castle',
  rows: [
    'mmmmmmmmm=mmmmmmmmmm',
    'mggggg...=....gggggm',
    'mggggg...=....gggggm',
    'm..L.....=.....L...m',
    '~~~~~~~~~H~~~~~~~~~~',
    '~~~~~~~~~H~~~~~~~~~~',
    'S...^^^^.=.^^^^...ST',
    'T...####.=.####....T',
    'T...#D##.=.##D#....T',
    'T....=...=...=.....T',
    'T....=========.....T',
    'T,,,,....=....,,,,,T',
    'T,,,,....=....,,,,,T',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 0, to: 'market_street', toX: 1, toY: 4, requires: 'beat_takeda',
      lockedText: 'The castle gate is shut. Gate Captain Takeda answers only to those who can read the city\'s numbers.' },
  ],
  npcs: [
    { id: 'runa_ship', name: 'Runa', x: 10, y: 12, sprite: 'runa', facing: 'left',
      travelsTo: { map: 'jarl_longship', x: 6, y: 7 },
      dialogue: [{ speaker: 'Runa', text: 'The longship waits if you need the harbor. Shall we sail back?' }] },
    { id: 'takeda', name: 'Gate Captain Takeda', x: 9, y: 2, sprite: 'gatecaptain', facing: 'down', hideIf: 'beat_takeda',
      dialogue: [
        { speaker: 'Takeda', ja: '門', text: 'Halt! This is the gate: 門. In the capital we write in KANJI, characters that carry meaning, not just sound.' },
        { speaker: 'Takeda', text: '一, 二, 三... 日, 月, 火, 水. Count and name the days as a samurai should, or turn back to your boat.' },
      ],
      battle: { winFlag: 'beat_takeda', isBoss: true, foes: [
        { familyId: 'ashigaru', level: 33, name: 'Gate Captain Takeda', nameJa: 'たけだ', sprite: 'gatecaptain', recruitable: false, hpScale: 3.7 },
      ] } },
    { id: 'takeda_after', name: 'Gate Captain Takeda', x: 8, y: 2, sprite: 'gatecaptain', facing: 'right', showIf: 'beat_takeda',
      dialogue: [{ speaker: 'Takeda', text: 'Pass. But beware: the market is full of Kage-ryu ninja. The Shogun has not been himself since the Jarl arrived.' }] },
    { id: 'scribe', name: 'Old Scribe', x: 6, y: 9, sprite: 'master', facing: 'right',
      dialogue: [
        { speaker: 'Old Scribe', ja: '木、林、森', text: 'A kanji is a picture with a meaning. 木 is a tree; two make a grove, 林; three make a forest, 森.' },
        { speaker: 'Old Scribe', text: 'Most kanji have two kinds of reading: on\'yomi from China (水 = sui) and kun\'yomi, the native word (水 = mizu).' },
      ] },
    { id: 'abacus_kid', name: 'Merchant\'s Boy', x: 15, y: 9, sprite: 'villager', facing: 'left',
      dialogue: [{ speaker: 'Merchant\'s Boy', text: 'Abacus-bead spirits roll around the gravel. They only answer to numbers: 一, 十, 百, 千, 万!' }] },
  ],
  encounterRate: 0.16,
  encounters: [
    { familyId: 'soroban', weight: 3, levels: [30, 32] },
    { familyId: 'koyomi', weight: 3, levels: [30, 32] },
  ],
  music: 'castle', weather: 'sakura', rideable: true,
};

const market_street: MapDef = {
  id: 'market_street', name: 'Market Street', nameJa: 'いちば', area: 'market',
  rows: [
    'mmmmmmmmmmmmmmmmm=mm',
    '^^^^^^^^^^^^^^^^.=.^',
    '#N##N##N##N##N##.=.#',
    '.......L....L....=..',
    '==================..',
    '.gggg.......gggg....',
    '.gggg..L....gggg....',
    '#N##N##N##N##N##N###',
    '^^^^^^^^^^^^^^^^^^^^',
  ],
  warps: [
    { x: 0, y: 4, to: 'castle_town', toX: 9, toY: 1 },
    { x: 17, y: 0, to: 'teahouse', toX: 8, toY: 8, requires: 'beat_kaze', lockedText: 'A masked ninja watches the alley to the teahouse.' },
  ],
  npcs: [
    { id: 'kaze', name: 'Kage-ryu Kaze', x: 17, y: 3, sprite: 'rogueninja', facing: 'left', hideIf: 'beat_kaze',
      dialogue: [
        { speaker: 'Kaze', ja: '今日', text: 'Kyou. You read that as "today"? Then read faster. The Kage-ryu deal in time and people: 時, 分, 人, 先生...' },
      ],
      battle: { winFlag: 'beat_kaze', isBoss: true, foes: [
        { familyId: 'kazamuki', level: 35, name: 'Kage-ryu Kaze', nameJa: 'かぜ', sprite: 'rogueninja', recruitable: false, hpScale: 6.2 },
      ] } },
    { id: 'kaze_after', name: 'Kage-ryu Kaze', x: 16, y: 3, sprite: 'rogueninja', facing: 'left', showIf: 'beat_kaze',
      dialogue: [{ speaker: 'Kaze', text: 'The Shogun on the throne is a shadow. The real one is... no. Ask the tea master. She sees everything.' }] },
    { id: 'fishmonger', name: 'Fishmonger', x: 5, y: 3, sprite: 'merchant', facing: 'down',
      dialogue: [{ speaker: 'Fishmonger', ja: '月曜日', text: 'Getsuyoubi: Monday. Moon-day! Every weekday is an element: 火 fire, 水 water, 木 wood, 金 gold, 土 earth.' }] },
    { id: 'doll_seller', name: 'Doll Seller', x: 10, y: 3, sprite: 'villagerB', facing: 'down',
      dialogue: [{ speaker: 'Doll Seller', text: 'My hina dolls walk at night and whisper people-kanji: 人, 男, 女, 子. The temple bells ring the time-kanji.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'hansho', weight: 3, levels: [32, 34] },
    { familyId: 'hina', weight: 3, levels: [32, 34] },
    { familyId: 'soroban', weight: 1, levels: [32, 33] },
  ],
  music: 'market', weather: 'none', rideable: true,
};

const teahouse: MapDef = {
  id: 'teahouse', name: 'Teahouse Garden', nameJa: 'ちゃや', area: 'teahouse',
  rows: [
    'TTTTTTTT=TTTTTTTT',
    'TggggS..=..SggggT',
    'Tgggg...=...ggggT',
    'T.^^^^^.=.~~~~..T',
    'T.##D##.=.~~~~..T',
    'T...=...=.......T',
    'T...=====...L..*T',
    'Tgg.....=....gggT',
    'Tgg.....=....gggT',
    'TTTTTTTT=TTTTTTTT',
  ],
  warps: [
    { x: 8, y: 9, to: 'market_street', toX: 17, toY: 1 },
    { x: 8, y: 0, to: 'castle_gardens', toX: 8, toY: 9, requires: 'tea_trial', lockedText: 'The garden gate opens only for guests the tea master has tested.' },
  ],
  npcs: [
    { id: 'tea_master', name: 'Tea Master Yuki', x: 6, y: 5, sprite: 'teamaster', facing: 'down', hideIf: 'tea_trial', heals: true,
      dialogue: [
        { speaker: 'Yuki', ja: '一期一会', text: 'Ichi-go ichi-e: one time, one meeting. Sit. Tell me: which hand holds the bowl? 右手 or 左手?' },
        { speaker: 'Yuki', text: 'Body and direction: 目, 口, 手, 足; 上, 下, 東, 西. The shadow on the throne cannot read them. Show me that you can.' },
      ],
      battle: { winFlag: 'tea_trial', isBoss: true, pool: 'teahouse', foes: [
        { familyId: 'hansho', level: 37, name: 'Tea Master Yuki', nameJa: 'ゆき', sprite: 'teamaster', recruitable: false, hpScale: 3.8 },
      ] } },
    { id: 'tea_master_after', name: 'Tea Master Yuki', x: 6, y: 5, sprite: 'teamaster', facing: 'down', showIf: 'tea_trial', heals: true,
      dialogue: [{ speaker: 'Yuki', text: 'The Kage-ryu assassin Hotaru guards the castle gardens. Past her, the keep, and the false Shogun.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'ashigaru', weight: 3, levels: [34, 36] },
    { familyId: 'kazamuki', weight: 3, levels: [34, 36] },
  ],
  music: 'teahouse', weather: 'sakura', rideable: false,
};

const castle_gardens: MapDef = {
  id: 'castle_gardens', name: 'Castle Gardens', nameJa: 'しろのにわ', area: 'gardens',
  rows: [
    'mmmmmmmmmmmmmmmmm=mm',
    'mSS,,,,..*..,,,,.=.m',
    'm,,,,,~~H~~~,,,,.=.m',
    'm,,,,,~~H~~~,,,,.=.m',
    'm*....~~H~~~....*=.m',
    'm.....~~H~~~.....=.m',
    'm.......==========.m',
    'm.S.....=.....S....m',
    'm,,,,...=...,,,,,..m',
    'm,,,,...=...,,,,,..m',
    'mmmmmmmm=mmmmmmmmmmm',
  ],
  warps: [
    { x: 8, y: 10, to: 'teahouse', toX: 8, toY: 1 },
    { x: 17, y: 0, to: 'castle_keep', toX: 7, toY: 8, requires: 'beat_hotaru', lockedText: 'Something moves in the shadows by the keep door. A blade glints.' },
  ],
  npcs: [
    { id: 'hotaru', name: 'Assassin Hotaru', x: 17, y: 1, sprite: 'assassin', facing: 'down', hideIf: 'beat_hotaru',
      dialogue: [{ speaker: 'Hotaru', ja: '花、雨、空', text: 'Hana, ame, sora. Flower, rain, sky. Pretty words for a pretty death. Read what I do: 見る, 聞く, 食べる...' }],
      battle: { winFlag: 'beat_hotaru', isBoss: true, foes: [
        { familyId: 'hina', level: 39, name: 'Assassin Hotaru', nameJa: 'ほたる', sprite: 'assassin', recruitable: false, hpScale: 7.6 },
      ] } },
    { id: 'hotaru_after', name: 'Assassin Hotaru', x: 16, y: 1, sprite: 'assassin', facing: 'right', showIf: 'beat_hotaru',
      dialogue: [{ speaker: 'Hotaru', text: 'The chief retainer Otomo let the Jarl in. He waits in the keep. I am... done serving shadows.' }] },
    { id: 'gardener', name: 'Gardener', x: 3, y: 7, sprite: 'villager', facing: 'right',
      dialogue: [{ speaker: 'Gardener', text: 'Umbrella-ghosts hop out of the grass when it rains: 雨. The straw sandals run off on their own: 行く, 来る, 出る!' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'karakasa', weight: 3, levels: [36, 38] },
    { familyId: 'zori', weight: 3, levels: [36, 38] },
  ],
  music: 'garden', weather: 'sakura', rideable: true,
};

const castle_keep: MapDef = {
  id: 'castle_keep', name: 'Castle Keep', nameJa: 'てんしゅかく', area: 'keep',
  rows: [
    '#######=#######',
    '#tttttt=tttttt#',
    '#tLtttt=ttttLt#',
    '#tttttt=tttttt#',
    '#______=______#',
    '#gggg__=__gggg#',
    '#gggg__=__gggg#',
    '#gggg__=__gggg#',
    '#______=______#',
    '#######=#######',
  ],
  warps: [
    { x: 7, y: 9, to: 'castle_gardens', toX: 17, toY: 1 },
    { x: 7, y: 0, to: 'shogun_hall', toX: 6, toY: 6, requires: 'beat_otomo', lockedText: 'The stair to the throne room is guarded by the chief retainer.' },
  ],
  npcs: [
    { id: 'otomo', name: 'Chief Retainer Otomo', x: 7, y: 2, sprite: 'karo', facing: 'down', hideIf: 'beat_otomo',
      dialogue: [{ speaker: 'Otomo', ja: '大きい、新しい、高い', text: 'Big, new, expensive: that is what the Jarl promised. A new country, 国, with new roads, 道. Read your way past me, if you can.' }],
      battle: { winFlag: 'beat_otomo', isBoss: true, foes: [
        { familyId: 'kagami', level: 41, name: 'Chief Retainer Otomo', nameJa: 'おおとも', sprite: 'karo', recruitable: false, hpScale: 3.8 },
      ] } },
    { id: 'otomo_after', name: 'Chief Retainer Otomo', x: 6, y: 2, sprite: 'karo', facing: 'right', showIf: 'beat_otomo',
      dialogue: [{ speaker: 'Otomo', text: 'I was a fool. The thing on the throne is a shadow the Jarl\'s runes made. The real Shogun is locked in the tower.' }] },
  ],
  encounterRate: 0.15,
  encounters: [
    { familyId: 'kagami', weight: 3, levels: [38, 40] },
    { familyId: 'dosojin', weight: 3, levels: [38, 40] },
  ],
  music: 'keep', weather: 'none', rideable: false, darkness: 0.15,
};

const shogun_hall: MapDef = {
  id: 'shogun_hall', name: "Shogun's Hall", nameJa: 'しょうぐんのま', area: 'hall',
  rows: [
    'mmmmmmmmmmmmm',
    'mtttttttttttm',
    'mttLtttttLttm',
    'mtttttttttttm',
    'mtttttttttttm',
    'mtttttttttttm',
    'mtttttttttttm',
    'mmmmmm=mmmmmm',
  ],
  warps: [{ x: 6, y: 7, to: 'castle_keep', toX: 7, toY: 1 }],
  npcs: [
    { id: 'shadow_shogun', name: 'Shadow Shogun', x: 6, y: 2, sprite: 'shogun', facing: 'down', hideIf: 'beat_shogun',
      dialogue: [
        { speaker: 'Shadow Shogun', ja: '日本語', text: 'Nihongo. The language of these isles. I am made of every kanji you fear to forget. This is your examination.' },
        { speaker: 'System', text: 'N5 MOCK EXAM: every kanji and every word of this arc. Breathe. You have read them all before.' },
      ],
      battle: { winFlag: 'beat_shogun', isBoss: true, foes: [
        { familyId: 'dosojin', level: 44, name: 'Shadow Shogun', nameJa: 'かげしょうぐん', sprite: 'shogun', recruitable: false, hpScale: 3 },
      ] } },
    { id: 'arc3_ending', name: 'The Shogun', x: 6, y: 2, sprite: 'shogun', facing: 'down', showIf: 'beat_shogun',
      dialogue: [
        { speaker: 'The Shogun', text: 'The shadow is gone and I am free. You read the capital back to life, scribe.' },
        { speaker: 'The Shogun', text: 'But the Jarl fled into the mountains, toward the temples where the monks keep the older, harder characters.' },
        { speaker: 'System', text: 'ARC 3 COMPLETE: the N5 kanji are yours. Arc 4: Mountain Temples (N4) is coming.' },
      ] },
  ],
  encounterRate: 0, encounters: [], music: 'boss', weather: 'none', rideable: false,
};

export const ARC3_MAPS: readonly MapDef[] = [castle_town, market_street, teahouse, castle_gardens, castle_keep, shogun_hall];
