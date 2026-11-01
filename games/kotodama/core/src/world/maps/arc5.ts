import type { MapDef } from '../types';

// Arc 5 — Northern Runeforge. N3 kanji, vocabulary and reading passages.
// Legend additions (see ../types.ts):  x rune ice (encounters)  F forge fire  X iron wall
// Story flags, in order: beat_hakon → beat_hrimr → forge_trial → beat_valkyrie
//   → beat_golem → beat_jarl → game_complete.

const rune_coast: MapDef = {
  id: 'rune_coast', name: 'Rune Coast', nameJa: 'ルーンのはま', area: 'coast',
  rows: [
    'PPPPPPPPP=PPPPPPPPPP',
    'Pxxxx....=....xxxxxP',
    'Pxxxx..r.=.r..xxxxxP',
    'Pnnnn....=....nnnnnP',
    'Pxxx.....=.....xxxxP',
    'Pxxx.....=.....xxxxP',
    'Pnnnnnnnn=nnnnnnnnnP',
    'Psssssss.=.ssssssssP',
    'WWWWWWWddddWWWWWWWWW',
  ],
  warps: [
    { x: 9, y: 0, to: 'glacier_pass', toX: 9, toY: 8, requires: 'beat_hakon',
      lockedText: 'A wall of painted shields blocks the glacier road.' },
  ],
  npcs: [
    { id: 'raven', name: 'Raven', x: 7, y: 8, sprite: 'raven', facing: 'right',
      travelsTo: { map: 'tengu_summit', x: 6, y: 6 },
      dialogue: [{ speaker: 'Raven', text: 'Kraa. The Tengu King lent me to you. I can fly you back to his summit whenever you wish.' }] },
    { id: 'hakon', name: 'Captain Hakon', x: 9, y: 1, sprite: 'hakon', facing: 'down', hideIf: 'beat_hakon',
      dialogue: [
        { speaker: 'Hakon', ja: '戦争、勝負、守る', text: 'Sensou, shoubu, mamoru: war, contest, to protect. Up here we read N3, scribe. Whole passages, not single words.' },
        { speaker: 'Hakon', text: 'The Jarl carves his runes over your kanji at the Runeforge. My shield wall answers to him. Break it.' },
      ],
      battle: { winFlag: 'beat_hakon', isBoss: true, foes: [
        { familyId: 'einherjar', level: 60, name: 'Captain Hakon', nameJa: 'ホーコン', sprite: 'hakon', recruitable: false, hpScale: 4 },
      ] } },
    { id: 'hakon_after', name: 'Captain Hakon', x: 8, y: 1, sprite: 'hakon', facing: 'right', showIf: 'beat_hakon',
      dialogue: [{ speaker: 'Hakon', text: 'Go, then. Read every scroll to the last line: the question is often about the part you skimmed.' }] },
    { id: 'shieldmaiden', name: 'Shieldmaiden Eir', x: 4, y: 7, sprite: 'runa', facing: 'right', heals: true,
      dialogue: [{ speaker: 'Eir', ja: '政治、国民、歴史', text: 'Seiji, kokumin, rekishi: politics, citizens, history. The valkyrie spirits on the ice choose the society kanji. Rest here first.' }] },
  ],
  encounterRate: 0.18,
  encounters: [
    { familyId: 'einherjar', weight: 3, levels: [57, 59] },
    { familyId: 'valkyrja', weight: 3, levels: [57, 59] },
  ],
  music: 'harbor', weather: 'snow', rideable: true,
};

const glacier_pass: MapDef = {
  id: 'glacier_pass', name: 'Glacier Pass', nameJa: 'ひょうがのみち', area: 'glacier',
  rows: [
    'cccccccccccccccc=ccc',
    'cxxxxxxnnnnnnnn.=.xc',
    'cxxxxxxnnooonnn.=.xc',
    'cnnnnn=========.=.nc',
    'cnnnnn=.xxxxxxx...nc',
    'cxxxxx=.xxxxxxxnnnnc',
    'cxxxxx=nnnnnnnnnnnnc',
    'cnnnnn===.nnnnnnnnnc',
    'cnnnnnnnn=nnnnnnnnnc',
    'ccccccccc=cccccccccc',
  ],
  warps: [
    { x: 9, y: 9, to: 'rune_coast', toX: 9, toY: 1 },
    { x: 16, y: 0, to: 'dvergr_forge', toX: 9, toY: 7, requires: 'beat_hrimr',
      lockedText: 'A frost giant sleeps across the mine road. His snoring shakes the ice.' },
  ],
  npcs: [
    { id: 'hrimr', name: 'Frost Giant Hrimr', x: 16, y: 1, sprite: 'hrimr', facing: 'down', hideIf: 'beat_hrimr',
      dialogue: [
        { speaker: 'Hrimr', ja: '怒る、悲しい、疲れる', text: 'Okoru, kanashii, tsukareru. Angry, sad, tired: that is how a giant wakes. Read my feelings, little one.' },
      ],
      battle: { winFlag: 'beat_hrimr', isBoss: true, foes: [
        { familyId: 'mare', level: 62, name: 'Frost Giant Hrimr', nameJa: 'フリームル', sprite: 'hrimr', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'hrimr_after', name: 'Frost Giant Hrimr', x: 17, y: 2, sprite: 'hrimr', facing: 'left', showIf: 'beat_hrimr',
      dialogue: [{ speaker: 'Hrimr', text: 'Heh. Nobody has read me so well in a thousand winters. The dwarfs below will want payment. 払う, 給料, 費用!' }] },
    { id: 'trader', name: 'Fur Trader', x: 10, y: 7, sprite: 'villager', facing: 'down',
      dialogue: [{ speaker: 'Trader', ja: '商品、物価、貯金', text: 'Shouhin, bukka, chokin: goods, prices, savings. The dwarf spirits only talk about money. The night-mares only talk about feelings.' }] },
  ],
  encounterRate: 0.18,
  encounters: [
    { familyId: 'mare', weight: 3, levels: [59, 61] },
    { familyId: 'dvergr', weight: 3, levels: [59, 61] },
  ],
  music: 'harbor', weather: 'snow', rideable: true,
};

const dvergr_forge: MapDef = {
  id: 'dvergr_forge', name: 'Dvergr Forge', nameJa: 'ドワーフのかじば', area: 'forge',
  rows: [
    'XXXXXXXXXXXXXXXXX_XX',
    'XFF____xxxx____X_.FX',
    'XFF____xxxx____X_.FX',
    'X______xxxx______..X',
    'Xxxxx____________xxX',
    'Xxxxx___FFFF_____xxX',
    'X_______FFFF_______X',
    'X_______________xxxX',
    'XXXXXXXXX_XXXXXXXXXX',
  ],
  warps: [
    { x: 9, y: 8, to: 'glacier_pass', toX: 16, toY: 1 },
    { x: 17, y: 0, to: 'hall_of_valor', toX: 9, toY: 8, requires: 'forge_trial',
      lockedText: 'The stair to the Hall of Valor is sealed with a dwarf-lock. Only Brokk holds the key.' },
  ],
  npcs: [
    { id: 'brokk', name: 'Forge-master Brokk', x: 17, y: 1, sprite: 'brokk', facing: 'down', hideIf: 'forge_trial', heals: true,
      dialogue: [
        { speaker: 'Brokk', ja: '打つ、投げる、落とす', text: 'Utsu, nageru, otosu: strike, throw, drop. A smith reads the weather in the fire and the work in his hands.' },
        { speaker: 'Brokk', text: 'My trial is on weather and action. Fail it and you will be shovelling coal for a century.' },
      ],
      battle: { winFlag: 'forge_trial', isBoss: true, pool: 'forge', foes: [
        { familyId: 'dvergr', level: 64, name: 'Forge-master Brokk', nameJa: 'ブロック', sprite: 'brokk', recruitable: false, hpScale: 4.5 },
      ] } },
    { id: 'brokk_after', name: 'Forge-master Brokk', x: 17, y: 3, sprite: 'brokk', facing: 'up', showIf: 'forge_trial', heals: true,
      dialogue: [{ speaker: 'Brokk', text: 'Ha! You may climb. The valkyrie above judges how you speak, and whether you can tell past from present.' }] },
    { id: 'apprentice', name: 'Apprentice', x: 4, y: 7, sprite: 'villagerB', facing: 'up',
      dialogue: [{ speaker: 'Apprentice', ja: '寒い、暑い、暖かい', text: 'Samui, atsui, atatakai. Cold outside, hot in here, warm by the anvil. The frost-giant spirits love weather kanji.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'jotunn', weight: 3, levels: [61, 63] },
    { familyId: 'selkie', weight: 3, levels: [61, 63] },
  ],
  music: 'cave', weather: 'none', rideable: false,
};

const hall_of_valor: MapDef = {
  id: 'hall_of_valor', name: 'Hall of Valor', nameJa: 'えいゆうのかん', area: 'valor',
  rows: [
    'RRRRRRRRRRRRRRRRRRRR',
    'wwwwwwwwwDwwwwwwwwww',
    'w_r___xxx_xxx___r__w',
    'w_____xxx_xxx______w',
    'wxxx_____________xxw',
    'wxxx___r_____r___xxw',
    'w__________________w',
    'w__xxx________xxx__w',
    'w________________L_w',
    'wwwwwwwwwDwwwwwwwwww',
  ],
  warps: [
    { x: 9, y: 9, to: 'dvergr_forge', toX: 17, toY: 1 },
    { x: 9, y: 1, to: 'runeforge_gate', toX: 9, toY: 8, requires: 'beat_valkyrie',
      lockedText: 'A valkyrie\'s spear bars the great door.' },
  ],
  npcs: [
    { id: 'valkyrie', name: 'Valkyrie Sigrdrifa', x: 9, y: 2, sprite: 'valkyrie', facing: 'down', hideIf: 'beat_valkyrie',
      dialogue: [
        { speaker: 'Sigrdrifa', ja: '過去、現在、未来', text: 'Kako, genzai, mirai: past, present, future. I choose who enters Valhalla, and I choose by how well they read.' },
      ],
      battle: { winFlag: 'beat_valkyrie', isBoss: true, foes: [
        { familyId: 'valkyrja', level: 66, name: 'Valkyrie Sigrdrifa', nameJa: 'シグルドリーヴァ', sprite: 'valkyrie', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'valkyrie_after', name: 'Valkyrie Sigrdrifa', x: 10, y: 3, sprite: 'valkyrie', facing: 'left', showIf: 'beat_valkyrie', heals: true,
      dialogue: [{ speaker: 'Sigrdrifa', text: 'You are chosen. Beyond the door, the Jarl\'s rune golem asks only one question: why? 理由, 結果, 必要.' }] },
    { id: 'skald', name: 'Old Skald', x: 4, y: 6, sprite: 'skald', facing: 'right',
      dialogue: [{ speaker: 'Skald', ja: '伝える、報告、連絡', text: 'Tsutaeru, houkoku, renraku. A skald\'s whole job is to pass the story on. The huldra in these halls steal messages.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'huldra', weight: 3, levels: [63, 65] },
    { familyId: 'myling', weight: 3, levels: [63, 65] },
  ],
  music: 'longhouse', weather: 'none', rideable: false,
};

const runeforge_gate: MapDef = {
  id: 'runeforge_gate', name: 'Runeforge Gate', nameJa: 'ルーンのもん', area: 'runeforge',
  rows: [
    'XXXXXXXXX_XXXXXXXXXX',
    'XFxxxxx..=..xxxxxxFX',
    'Xxxxxxx..=..xxxxxxxX',
    'Xxx......=.......xxX',
    'X..rr....=....rr...X',
    'Xxxxxxx..=..xxxxxxxX',
    'XFxxxxx..=..xxxxxxFX',
    'X........=.........X',
    'X........=.........X',
    'XXXXXXXXX=XXXXXXXXXX',
  ],
  warps: [
    { x: 9, y: 9, to: 'hall_of_valor', toX: 9, toY: 2 },
    { x: 9, y: 0, to: 'runeforge_throne', toX: 6, toY: 7, requires: 'beat_golem',
      lockedText: 'A rune golem stands in the gate, humming. Its runes spell out a question.' },
  ],
  npcs: [
    { id: 'golem', name: 'Rune Golem', x: 9, y: 1, sprite: 'golem', facing: 'down', hideIf: 'beat_golem',
      dialogue: [
        { speaker: 'Rune Golem', ja: '理由は？', text: 'RIYUU WA? REASON? I AM MADE OF REASONS. READ THEM, OR BE UNMADE.' },
      ],
      battle: { winFlag: 'beat_golem', isBoss: true, foes: [
        { familyId: 'dvergr', level: 68, name: 'Rune Golem', nameJa: 'ルーンゴーレム', sprite: 'golem', recruitable: false, hpScale: 3.6 },
      ] } },
    { id: 'golem_after', name: 'Rune Golem', x: 8, y: 1, sprite: 'golem', facing: 'right', showIf: 'beat_golem',
      dialogue: [{ speaker: 'Rune Golem', text: 'QUESTION ANSWERED. THE JARL WAITS. HE WILL TEST EVERY N3 KANJI, WORD AND PASSAGE.' }] },
    { id: 'ferryman', name: 'Ferry-hand', x: 3, y: 8, sprite: 'villager', facing: 'right', heals: true,
      dialogue: [{ speaker: 'Ferry-hand', ja: '旅行、空港、宿', text: 'Ryokou, kuukou, yado: a trip, an airport, an inn. The water-horses at the gate know every travel kanji. Rest before you go in.' }] },
  ],
  encounterRate: 0.18,
  encounters: [
    { familyId: 'volva', weight: 3, levels: [65, 67] },
    { familyId: 'nykr', weight: 3, levels: [65, 67] },
  ],
  music: 'cave', weather: 'snow', rideable: false,
};

const runeforge_throne: MapDef = {
  id: 'runeforge_throne', name: 'Runeforge Throne', nameJa: 'ルーンのぎょくざ', area: 'finale',
  rows: [
    'XXXXXXXXXXXXX',
    'XFF_______FFX',
    'X_r_______r_X',
    'X___________X',
    'X___________X',
    'X_____=_____X',
    'X_____=_____X',
    'XFF___=___FFX',
    'XXXXXX_XXXXXX',
  ],
  warps: [{ x: 6, y: 8, to: 'runeforge_gate', toX: 9, toY: 1 }],
  npcs: [
    { id: 'jarl', name: 'Jarl Ulfhild', x: 6, y: 3, sprite: 'jarl', facing: 'down', hideIf: 'beat_jarl',
      dialogue: [
        { speaker: 'Jarl Ulfhild', ja: '結局', text: 'Kekkyoku: "in the end." You chased me from the valley to the end of the world, scribe. Every land, I wrote over. Every land, you read back.' },
        { speaker: 'Jarl Ulfhild', text: 'Here, the words are forged. Read them all, or watch me carve my runes over every kanji you know.' },
        { speaker: 'System', text: 'N3 MOCK EXAM: every N3 kanji, word and reading passage. Read each passage to the end before you answer.' },
      ],
      battle: { winFlag: 'beat_jarl', isBoss: true, foes: [
        { familyId: 'nykr', level: 70, name: 'Jarl Ulfhild', nameJa: 'ウルフヒルド', sprite: 'jarl', recruitable: false, hpScale: 3.6 },
      ] } },
    { id: 'ending', name: 'Jarl Ulfhild', x: 6, y: 3, sprite: 'jarl', facing: 'down', showIf: 'beat_jarl', setsFlag: 'game_complete',
      dialogue: [
        { speaker: 'Jarl Ulfhild', text: 'So. The runestones only ever broke your words because I could not read them. I wanted a language that obeyed me.' },
        { speaker: 'Jarl Ulfhild', text: 'You learned one instead. Take the forge. Every Kotodama I corrupted is free.' },
        { speaker: 'System', text: 'THE END. Hiragana, katakana, N5, N4 and N3: the words are yours.' },
        { speaker: 'Credits', text: 'KOTODAMA. Story, rules, curriculum and procedural pixel art written for SystemOS.' },
        { speaker: 'Credits', text: 'Arc 1 Sakura Valley · Arc 2 Frost Harbor · Arc 3 Castle Capital · Arc 4 Mountain Temples · Arc 5 Northern Runeforge.' },
        { speaker: 'Credits', text: 'Spirits from Japanese folklore (yokai, tsukumogami, tengu, kamaitachi) and Norse myth (einherjar, valkyries, jötnar, dvergar, huldra, selkies, the mare, the nykr).' },
        { speaker: 'Credits', text: 'Kanji, words, sentences and passages were written by hand, not taken from a dictionary.' },
        { speaker: 'Credits', text: 'Thank you for reading.' },
        { speaker: 'System', text: 'POST-GAME: Master Kaito in the Hayate Dojo now offers the DAILY TRIAL, a battle made of whatever you are about to forget.' },
      ] },
  ],
  encounterRate: 0, encounters: [], music: 'boss', weather: 'none', rideable: false,
};

export const ARC5_MAPS: readonly MapDef[] = [rune_coast, glacier_pass, dvergr_forge, hall_of_valor, runeforge_gate, runeforge_throne];
