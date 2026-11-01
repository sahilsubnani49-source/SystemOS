import type { MapDef } from '../types';

// Arc 2 — Frost Harbor. Katakana, then loanwords. Legend additions (see ../types.ts):
//   n snow  f snow drift (encounters)  i ice  d dock/deck  p pine  P snowy pine
//   w longhouse wall  R longhouse roof  r runestone  k ship hull  W deep water
// Story flags, in order: learned_mirror → beat_sigrun → beat_ulf → beat_warden
//   → skald_trial → beat_champion.

const frost_harbor: MapDef = {
  id: 'frost_harbor', name: 'Frost Harbor', nameJa: 'フロストハーバー', area: 'harbor',
  rows: [
    'PPPPPPPPP=PPPPPPPPPP',
    'PnnRRRRnn=nnRRRRRnnP',
    'PnnRRRRnn=nnRRRRRnnP',
    'PnnwwDwnn=nnwwDwwnnP',
    'Pnnnn=nnn=nnnn=nnnnP',
    'Pnnnn==========nnnnP',
    'PffnnnnnnnnnnnnnnffP',
    'PffnnrnnnnnnnrnnnffP',
    'PffnnnnnnnnnnnnnnffP',
    'PnnnnnnnnnnnnnnnnnnP',
    'sssssssssdssssssssss',
    'WWWkkkkWWdWWWWWWWWWW',
    'WWWkkkkWWdWWWWWWWWWW',
    'WWWWWWWWWdWWWWWWWWWW',
  ],
  warps: [
    { x: 9, y: 0, to: 'longship_docks', toX: 1, toY: 9, requires: 'learned_mirror',
      lockedText: 'The road north runs through raider camps. Find Runa the translator first: she knows their script.' },
  ],
  npcs: [
    { id: 'harbor_ferry', name: 'Ferryman Gen', x: 9, y: 13, sprite: 'ferryman', facing: 'up',
      travelsTo: { map: 'river_crossing', x: 15, y: 6 },
      dialogue: [{ speaker: 'Ferryman Gen', text: 'Back to Sakura Valley? Hold on to your hat.' }] },
    { id: 'runa', name: 'Runa', x: 11, y: 6, sprite: 'runa', facing: 'down', hideIf: 'learned_mirror',
      setsFlag: 'learned_mirror', heals: true,
      dialogue: [
        { speaker: 'Runa', ja: 'カタカナ', text: 'You read hiragana? Good. The Jarl\'s rune-scribes write in KATAKANA: the sharp, square script used for foreign words.' },
        { speaker: 'Runa', text: 'Every katakana has a hiragana twin with the same sound. か and カ are both "ka". Learn to see the twin and you can cut through their runes.' },
        { speaker: 'Runa', text: 'I left the raiders when they burned this harbor. Take my mirror technique, and drive them back to their ships.' },
        { speaker: 'System', text: 'You learned a MIRROR move! See a kana, strike its twin in the other script. The road north is open.' },
      ] },
    { id: 'runa_after', name: 'Runa', x: 11, y: 6, sprite: 'runa', facing: 'down', showIf: 'learned_mirror', heals: true,
      dialogue: [{ speaker: 'Runa', text: 'Shieldmaiden Sigrun holds the longship docks to the north. The spirits here were corrupted by her runes: ア and カ rows.' }] },
    { id: 'fishwife', name: 'Astrid', x: 4, y: 9, sprite: 'villagerB', facing: 'right',
      dialogue: [{ speaker: 'Astrid', text: 'Wild spirits hide in the deep snow drifts, like grass back home. Kobolds love the cold.' }] },
    { id: 'harbor_monk', name: 'Wandering Monk', x: 15, y: 4, sprite: 'master', facing: 'down',
      dialogue: [{ speaker: 'Wandering Monk', text: 'Watch the look-alikes: シ and ツ, ソ and ン. The strokes slant differently. Read slowly at first.' }] },
  ],
  encounterRate: 0.16,
  encounters: [
    { familyId: 'alv', weight: 3, levels: [16, 18] },
    { familyId: 'kobold', weight: 3, levels: [16, 18] },
  ],
  music: 'harbor', weather: 'snow', rideable: true,
};

const longship_docks: MapDef = {
  id: 'longship_docks', name: 'Longship Docks', nameJa: 'ロングシップのはとば', area: 'docks',
  rows: [
    'PPPPPPPPPPPPPPPPP=PP',
    'Pnnffffnnnnnnnnnn=nP',
    'Pnnffffnnnnnnnnnn=nP',
    'Pnn===============nP',
    'Pnn=nnnnnnnnnnnnnnnP',
    'Pnn=nnRRRRRRnnffffnP',
    'Pnn=nnwwwDwwnnffffnP',
    'Pnn=nnnnn=nnnnffffnP',
    'Pnn========nnnnnnnnP',
    '=ffnnnnnnn=nnnnnnnnP',
    'Pffnnnnnnn=nnnnnnnnP',
    'ssssssssssdsssssssss',
    'WkkkkkWWWWdWWWkkkkWW',
    'WkkkkkWWWWdWWWkkkkWW',
    'WWWWWWWWWWdWWWWWWWWW',
  ],
  warps: [
    { x: 0, y: 9, to: 'frost_harbor', toX: 9, toY: 1 },
    { x: 17, y: 0, to: 'pine_shore', toX: 1, toY: 1, requires: 'beat_sigrun', lockedText: 'Sigrun\'s shield wall blocks the shore road.' },
  ],
  npcs: [
    { id: 'sigrun', name: 'Shieldmaiden Sigrun', x: 17, y: 1, sprite: 'shieldmaiden', facing: 'down', hideIf: 'beat_sigrun',
      dialogue: [{ speaker: 'Sigrun', ja: 'シールド', text: 'Shiirudo: that is how your people say "shield". Even your words bend to us. Read mine, if you can!' }],
      battle: { winFlag: 'beat_sigrun', isBoss: true, foes: [
        { familyId: 'kobold', level: 21, name: 'Shieldmaiden Sigrun', nameJa: 'シグルン', sprite: 'shieldmaiden', recruitable: false, hpScale: 3 },
      ] } },
    { id: 'sigrun_after', name: 'Shieldmaiden Sigrun', x: 17, y: 2, sprite: 'shieldmaiden', facing: 'down', showIf: 'beat_sigrun',
      dialogue: [{ speaker: 'Sigrun', text: 'Your blade reads true. Berserker Ulf waits on the pine shore. He does not stop when he should.' }] },
    { id: 'shipwright', name: 'Shipwright Leif', x: 9, y: 7, sprite: 'viking', facing: 'down',
      dialogue: [{ speaker: 'Leif', text: 'Not all of us wanted this war. The troll-spirits in the drifts here answer to サ and タ rows.' }] },
  ],
  encounterRate: 0.16,
  encounters: [
    { familyId: 'sleip', weight: 3, levels: [18, 20] },
    { familyId: 'troll', weight: 3, levels: [18, 20] },
    { familyId: 'kobold', weight: 1, levels: [18, 19] },
  ],
  music: 'docks', weather: 'snow', rideable: true,
};

const pine_shore: MapDef = {
  id: 'pine_shore', name: 'Pine Shore', nameJa: 'パインのかいがん', area: 'shore',
  rows: [
    'PPPPPPPPPPPPPPPPPPPP',
    '==nnnnnnnPPnnnnnnnnP',
    'PnnffffnnPPnffffnnnP',
    'PnnffffnnnnnffffnnnP',
    'PnnnnPPnnnnnnnPPnnnP',
    'PnnnnPPnnrnnnnPPnnnP',
    'PffnnnnnnnnnnnnnnffP',
    'PffnnnnnnnnnnnnnnffP',
    'PnnnnnnnnnnnnnnnnnnP',
    'iiiiiiiiiiiiiiiii=ii',
    'WWWWWWWWWWWWWWWWWWWW',
  ],
  warps: [
    { x: 0, y: 1, to: 'longship_docks', toX: 17, toY: 3 },
    { x: 17, y: 9, to: 'fjord_caves', toX: 1, toY: 1, requires: 'beat_ulf', lockedText: 'Berserker Ulf howls on the ice. The cave mouth is behind him.' },
  ],
  npcs: [
    { id: 'ulf', name: 'Berserker Ulf', x: 17, y: 8, sprite: 'berserker', facing: 'up', hideIf: 'beat_ulf',
      dialogue: [{ speaker: 'Ulf', ja: 'バーサーカー', text: 'BAASAAKAA! Even your scribes had to borrow a word for me. RAAAH!' }],
      battle: { winFlag: 'beat_ulf', isBoss: true, foes: [
        { familyId: 'muspel', level: 24, name: 'Berserker Ulf', nameJa: 'ウルフ', sprite: 'berserker', recruitable: false, hpScale: 6.6 },
      ] } },
    { id: 'ulf_after', name: 'Berserker Ulf', x: 16, y: 8, sprite: 'berserker', facing: 'right', showIf: 'beat_ulf',
      dialogue: [{ speaker: 'Ulf', text: 'Ugh. My head clears. The Draugr Warden in the fjord caves never sleeps. Beware the ン and ソ runes there.' }] },
    { id: 'skier', name: 'Hunter Sigve', x: 9, y: 7, sprite: 'viking', facing: 'down',
      dialogue: [{ speaker: 'Sigve', text: 'Water-horses in the drifts read ナ-row, ravens read ハ-row, and the fire imps read マ-row. Mind the ice.' }] },
  ],
  encounterRate: 0.17,
  encounters: [
    { familyId: 'nokk', weight: 3, levels: [20, 23] },
    { familyId: 'hrafn', weight: 3, levels: [20, 23] },
    { familyId: 'muspel', weight: 2, levels: [20, 23] },
  ],
  music: 'shore', weather: 'snow', rideable: true,
};

const fjord_caves: MapDef = {
  id: 'fjord_caves', name: 'Fjord Caves', nameJa: 'フィヨルドのどうくつ', area: 'caves',
  rows: [
    'oooooooooooooooooooo',
    '=iiiiffffiiiiioooooo',
    'oooiiffffoooiiiiiioo',
    'ooiiiioooooooffffioo',
    'ooiffiio~~~~offffioo',
    'ooiffiio~~~~oiiiiioo',
    'ooiiiiioooooooiiiioo',
    'oooooiiiiffffiiioooo',
    'oooooiiiiffffiiiiii=',
    'oooooooooooooooooooo',
  ],
  warps: [
    { x: 0, y: 1, to: 'pine_shore', toX: 17, toY: 8 },
    { x: 19, y: 8, to: 'rune_watchtower', toX: 6, toY: 8, requires: 'beat_warden', lockedText: 'Something dead and armoured blocks the tunnel.' },
  ],
  npcs: [
    { id: 'warden', name: 'Draugr Warden', x: 18, y: 8, sprite: 'draugr', facing: 'left', hideIf: 'beat_warden',
      dialogue: [{ speaker: 'Draugr Warden', ja: 'ガード', text: 'Gaado... I GUARD. None pass to the tower. Your voiced sounds will fail you: ガ, ザ, ダ, バ, パ.' }],
      battle: { winFlag: 'beat_warden', isBoss: true, foes: [
        { familyId: 'hrafn', level: 27, name: 'Draugr Warden', nameJa: 'ドラウグル', sprite: 'draugr', recruitable: false, hpScale: 10.6 },
      ] } },
    { id: 'lost_scribe', name: 'Lost Scribe', x: 3, y: 5, sprite: 'merchant', facing: 'right',
      dialogue: [{ speaker: 'Lost Scribe', text: 'Katakana voiced sounds work just like hiragana: カ→ガ, ハ→バ→パ. Yule cats, squirrels and sea wyrms hide in these drifts.' }] },
  ],
  encounterRate: 0.18,
  encounters: [
    { familyId: 'yulecat', weight: 3, levels: [23, 26] },
    { familyId: 'ratatosk', weight: 3, levels: [23, 26] },
    { familyId: 'wyrm', weight: 2, levels: [23, 26] },
  ],
  music: 'caves', weather: 'none', rideable: false, darkness: 0.5,
};

const rune_watchtower: MapDef = {
  id: 'rune_watchtower', name: 'Rune Watchtower', nameJa: 'ルーンのみはりとう', area: 'tower',
  rows: [
    'wwwwww=wwwwww',
    'w___________w',
    'w_r_______r_w',
    'w___________w',
    'w___________w',
    'w__r_____r__w',
    'w___________w',
    'w___________w',
    'w___________w',
    'wwwwww=wwwwww',
  ],
  warps: [
    { x: 6, y: 9, to: 'fjord_caves', toX: 18, toY: 8 },
    { x: 6, y: 0, to: 'jarl_longship', toX: 6, toY: 7, requires: 'skald_trial', lockedText: 'The gangway to the Jarl\'s ship is barred. The Skald must test your words first.' },
  ],
  npcs: [
    { id: 'skald', name: 'Skald Eirik', x: 6, y: 3, sprite: 'skald', facing: 'down', hideIf: 'skald_trial', heals: true,
      dialogue: [
        { speaker: 'Skald Eirik', ja: 'コーヒー、テレビ、パン', text: 'Koohii, terebi, pan. Your language borrowed these words from across the sea, and wrote them in katakana.' },
        { speaker: 'Skald Eirik', text: 'The long bar ー stretches a vowel: コーヒー is "ko-o-hi-i". A small ッ doubles the next sound: ベッド is "be-d-do".' },
        { speaker: 'Skald Eirik', text: 'A skald fights with words. Read mine: their meaning and their spelling. Win, and the gangway is yours.' },
      ],
      battle: { winFlag: 'skald_trial', isBoss: true, pool: 'tower', foes: [
        { familyId: 'sleip', level: 28, name: 'Skald Eirik', nameJa: 'エイリーク', sprite: 'skald', recruitable: false, hpScale: 7.2 },
      ] } },
    { id: 'skald_after', name: 'Skald Eirik', x: 6, y: 3, sprite: 'skald', facing: 'down', showIf: 'skald_trial', heals: true,
      dialogue: [{ speaker: 'Skald Eirik', text: 'A fine verse. The Jarl\'s Champion waits on the longship. He will throw every word you know at you.' }] },
  ],
  encounterRate: 0, encounters: [], music: 'tower', weather: 'none', rideable: false, darkness: 0.2,
};

const jarl_longship: MapDef = {
  id: 'jarl_longship', name: "The Jarl's Longship", nameJa: 'ヤールのロングシップ', area: 'longship',
  rows: [
    'WWWWWWWWWWWWW',
    'WWkkkkkkkkkWW',
    'WkdddddddddkW',
    'WkdrdddddrdkW',
    'WkdddddddddkW',
    'WkdddddddddkW',
    'WkdddddddddkW',
    'WkdddddddddkW',
    'WWkkkkdkkkkWW',
    'WWWWWWWWWWWWW',
  ],
  warps: [{ x: 6, y: 8, to: 'rune_watchtower', toX: 6, toY: 1 }],
  npcs: [
    { id: 'champion', name: "Jarl's Champion", x: 6, y: 3, sprite: 'champion', facing: 'down', hideIf: 'beat_champion',
      dialogue: [
        { speaker: "Jarl's Champion", ja: 'チャンピオン', text: 'CHANPION. Even my title is a borrowed word in your tongue. Every rune, every word you have learned: I will take them all.' },
      ],
      battle: { winFlag: 'beat_champion', isBoss: true, foes: [
        { familyId: 'troll', level: 31, name: "Jarl's Champion", nameJa: 'チャンピオン', sprite: 'champion', recruitable: false, hpScale: 3.4 },
      ] } },
    { id: 'arc2_ending', name: 'Runa', x: 6, y: 3, sprite: 'runa', facing: 'down', showIf: 'beat_champion',
      travelsTo: { map: 'castle_town', x: 9, y: 12 },
      dialogue: [
        { speaker: 'Runa', text: 'The Champion is beaten and the longships are turning for home. You read every katakana and every word they threw at you.' },
        { speaker: 'Runa', text: 'But the Jarl himself has sailed for the Castle Capital, where the Shogun\'s scribes write in KANJI.' },
        { speaker: 'Runa', text: 'This ship is ours now. Hold on: we sail for the capital.' },
        { speaker: 'System', text: 'ARC 2 COMPLETE. Next: Arc 3, Castle Capital, where everything is written in N5 kanji.' },
      ] },
  ],
  encounterRate: 0, encounters: [], music: 'boss', weather: 'snow', rideable: false,
};

export const ARC2_MAPS: readonly MapDef[] = [frost_harbor, longship_docks, pine_shore, fjord_caves, rune_watchtower, jarl_longship];
