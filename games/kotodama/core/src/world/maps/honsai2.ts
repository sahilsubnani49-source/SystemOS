import type { MapDef } from '../types';
import { HONSAI_ENCOUNTERS, silenced } from './honsai';

// Honsai districts 4-6: Kakehashi (て-form), Manabi Hill (plain forms), Minato Harbour
// (conditionals). Same shape as districts 1-3: words and grammar in the pool, silenced
// villagers who get their words back, a lieutenant at the far end, and a local healer
// who is also the place a defeated party wakes up (see checkpoints.ts).

// ── District 4: Kakehashi (架け橋), the Bridge City. Verbs of motion and the て-form. ──
// Wapul broke every bridge. Two one-tile bridges cross the rivers, each held by a Bridge
// Spirit; beat it with て-forms and the bridge is whole again.
const honsai_bridges: MapDef = {
  id: 'honsai_bridges', name: 'Kakehashi', nameJa: 'かけはし', area: 'honsai4',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'T........==........T',
    'T..^^^...==...^^^..T',
    'T..###...==...###..T',
    'T..#D#...==...#D#..T',
    'T........==........T',
    '~~~~~~~~~~H~~~~~~~~~',
    'T........==........T',
    'T.*..L...==...L..*.T',
    'T........==........T',
    '~~~~~~~~~~H~~~~~~~~~',
    'T........==........T',
    'T..,,,...==...,,,..T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 14, to: 'honsai_village', toX: 9, toY: 1 },
    { x: 10, y: 14, to: 'honsai_village', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_hill', toX: 9, toY: 10, requires: 'beat_bridge_breaker', lockedText: 'The road up Manabi Hill starts across a bridge that is not there any more.' },
    { x: 10, y: 0, to: 'honsai_hill', toX: 10, toY: 10, requires: 'beat_bridge_breaker', lockedText: 'The road up Manabi Hill starts across a bridge that is not there any more.' },
  ],
  npcs: [
    { id: 'hashi_nurse', name: 'Hashi, the bridge nurse', x: 6, y: 1, sprite: 'folk:woman:hashi_nurse', facing: 'down', heals: true, stationary: true,
      dialogue: [
        { speaker: 'Hashi', ja: 'だいじょうぶですか。', text: 'Daijoubu desu ka: are you all right? Rest. Everyone who falls in the river ends up on my mat.' },
      ] },
    { id: 'bridgewright', name: 'Kumi the bridgewright', x: 15, y: 8, sprite: 'folk:man:kumi_bridgewright', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Kumi', ja: 'て形の うた', text: 'Every bridge here was built of て. Learn the song and you can build them again:' },
        { speaker: 'Kumi', ja: 'う・つ・る → って', text: '買う → 買って, 待つ → 待って, 帰る → 帰って.' },
        { speaker: 'Kumi', ja: 'む・ぶ・ぬ → んで', text: '読む → 読んで, 遊ぶ → 遊んで, 死ぬ → 死んで.' },
        { speaker: 'Kumi', ja: 'く → いて、ぐ → いで、す → して', text: '書く → 書いて, 泳ぐ → 泳いで, 話す → 話して. And 行く is the odd one: 行って.' },
        { speaker: 'Kumi', text: 'Group 2 just drops る (食べる → 食べて), and する → して, 来る → 来て. With て you can ask (てください), say what is happening (ている), and join actions in a row.' },
      ] },
    { id: 'bridge_south', name: 'Bridge Spirit of the South River', x: 10, y: 10, sprite: 'yamabiko1', facing: 'down', hideIf: 'bridge_south_built',
      dialogue: [
        { speaker: 'Bridge Spirit', text: '... て ... て ... I was a bridge made of て-forms. Say them back to me, and I will hold your weight again.' },
      ],
      battle: { winFlag: 'bridge_south_built', isBoss: false, foes: [
        { familyId: 'yamabiko', level: 66, name: 'Bridge Spirit', nameJa: 'はしの せい', sprite: 'yamabiko1', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'bridge_north', name: 'Bridge Spirit of the North River', x: 10, y: 6, sprite: 'yamabiko2', facing: 'down', hideIf: 'bridge_north_built',
      dialogue: [
        { speaker: 'Bridge Spirit', text: 'Watatte... tatte... matte... The planks remember the words. Do you?' },
      ],
      battle: { winFlag: 'bridge_north_built', isBoss: false, foes: [
        { familyId: 'yamabiko', level: 67, name: 'Bridge Spirit', nameJa: 'はしの せい', sprite: 'yamabiko2', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'bridge_breaker', name: 'The Bridge-Breaker', x: 12, y: 1, sprite: 'folk:warrior:bridge_breaker', facing: 'left', hideIf: 'beat_bridge_breaker',
      dialogue: [
        { speaker: 'The Bridge-Breaker', text: 'Taberu. Neru. Iku. One word, then a hole, then another word. No bridges, no "and then". That is how Wapul wants every sentence.' },
        { speaker: 'System', text: 'Its hammer is carved with every broken て. Rebuild them: motion verbs, actions, and the て-form in every use.' },
        { speaker: 'System', text: 'DISTRICT 4: verbs of motion and action, and the て-form: てください, ている, てもいい, てはいけない, てから.' },
      ],
      battle: { winFlag: 'beat_bridge_breaker', isBoss: true, foes: [
        { familyId: 'yamabiko', level: 69, name: 'The Bridge-Breaker', nameJa: 'はしこわし', sprite: 'folk:warrior:bridge_breaker', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'bridge_breaker_freed', name: 'The Bridge-Mender', x: 12, y: 1, sprite: 'folk:warrior:bridge_breaker', facing: 'left', showIf: 'beat_bridge_breaker',
      dialogue: [
        { speaker: 'The Bridge-Mender', ja: 'たべて、ねて、いく。', text: 'Tabete, nete, iku: I eat, and sleep, and go. Do you hear the bridges between the words? I build those now.' },
        { speaker: 'The Bridge-Mender', text: 'The road climbs to Manabi Hill, the school. They say the teacher there has forgotten everything except how to look stern.' },
      ] },
    ...silenced('wataru', 'Wataru the ferryman', 'folk:fisher:wataru_ferry', 3, 12, 'beat_bridge_breaker',
      '(He points at the river, then at the far bank, then at you. He cannot say "cross", or "come".)',
      [{ ja: 'はしを わたって、きて ください！', text: 'Hashi wo watatte, kite kudasai! Cross the bridge and come! I have been waving at people for a year.' }]),
    ...silenced('nobori', 'Nobori the courier', 'folk:boy:nobori_courier', 16, 12, 'beat_bridge_breaker',
      '(He runs up, stops, runs back, stops. He can do things, but he cannot join them together.)',
      [{ ja: 'はしって、とまって、わたしました！', text: 'Hashitte, tomatte, watashimashita! I ran, I stopped, I handed it over. Three actions, one sentence. Beautiful.' }]),
    ...silenced('oshie', 'Oshie the crossing guard', 'folk:woman:oshie_guard', 3, 8, 'beat_bridge_breaker',
      '(She holds up a flag and points at the road. She cannot say "wait" or "please".)',
      [{ ja: 'まって ください。いま、わたっても いいですよ。', text: 'Matte kudasai: please wait. ...Now you may cross: わたっても いいですよ.' }]),
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(65, 68),
  music: 'river', weather: 'none', rideable: true,
};

// ── District 5: Manabi Hill (学び丘). School, study, work, and the plain forms. ──
const honsai_hill: MapDef = {
  id: 'honsai_hill', name: 'Manabi Hill', nameJa: 'まなびおか', area: 'honsai5',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'T........==........T',
    'T.^^^^^^...^^^^^^..T',
    'T.######...######..T',
    'T.##D###...###D##..T',
    'T........==........T',
    'T.S..*...==...*..S.T',
    'T........==........T',
    'T.L......==......L.T',
    'T..,,,...==...,,,..T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 11, to: 'honsai_bridges', toX: 9, toY: 1 },
    { x: 10, y: 11, to: 'honsai_bridges', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_harbour', toX: 9, toY: 10, requires: 'beat_forgetful_sensei', lockedText: 'The school gate is locked. A note on it says only: ……' },
    { x: 10, y: 0, to: 'honsai_harbour', toX: 10, toY: 10, requires: 'beat_forgetful_sensei', lockedText: 'The school gate is locked. A note on it says only: ……' },
  ],
  npcs: [
    { id: 'hokenshitsu', name: 'Nurse Iyashi', x: 6, y: 7, sprite: 'folk:woman:iyashi_nurse', facing: 'down', heals: true, stationary: true,
      dialogue: [{ speaker: 'Nurse Iyashi', ja: 'ほけんしつ', text: 'The hokenshitsu, the school sick room. Lie down. Even scribes fail tests sometimes.' }] },
    { id: 'hagane_forge', name: 'Hagane of the Hill Forge', x: 13, y: 7, sprite: 'folk:man:hagane_forge', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Hagane', ja: '普通形', text: 'Futsuukei: the plain forms. Friends, diaries and dictionaries all speak plain. 行く, 行かない, 行った, 行かなかった.' },
        { speaker: 'Hagane', text: 'Plain negative: the last kana moves to the あ-row and takes ない (う becomes わ: 買う → 買わない). Plain past is the て-form with た/だ: 読んで → 読んだ.' },
        { speaker: 'System', text: 'THE HILL FORGE: sparring with every form so far, from ます to たら. Fight as often as you like.' },
      ],
      battle: { winFlag: 'forge_spar_6', isBoss: false, pool: 'honsai_forge6', repeatable: true, foes: [
        { familyId: 'dvergr', level: 67, name: 'Hagane', nameJa: 'はがね', sprite: 'folk:man:hagane_forge', recruitable: false, hpScale: 4 },
      ] } },
    { id: 'forgetful_sensei', name: 'The Forgetful Sensei', x: 12, y: 1, sprite: 'folk:monk:forgetful_sensei', facing: 'left', hideIf: 'beat_forgetful_sensei',
      dialogue: [
        { speaker: 'The Forgetful Sensei', text: '……… (He points sternly at a blackboard covered in eraser smudges, then at you, as if you should know the answer.)' },
        { speaker: 'System', text: 'Wapul took everything he ever taught: subjects, jobs, and how to speak plainly. Give him his lessons back.' },
        { speaker: 'System', text: 'DISTRICT 5: school, study and work, and the plain forms: ない, た, なかった, たことがある, たり〜たり.' },
      ],
      battle: { winFlag: 'beat_forgetful_sensei', isBoss: true, foes: [
        { familyId: 'hitotsume', level: 70, name: 'The Forgetful Sensei', nameJa: 'わすれっぽい せんせい', sprite: 'folk:monk:forgetful_sensei', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'forgetful_sensei_freed', name: 'Sensei, remembering', x: 12, y: 1, sprite: 'folk:monk:forgetful_sensei', facing: 'left', showIf: 'beat_forgetful_sensei',
      dialogue: [
        { speaker: 'Sensei', ja: 'おもいだした！', text: 'Omoidashita: I remember! Mathematics, history, the plain past! Class is back in session.' },
        { speaker: 'Sensei', text: 'Over the hill is Minato Harbour. The harbour master has lost every word for "if". Ships cannot leave without an if.' },
      ] },
    ...silenced('gakusei', 'Manabu the student', 'folk:boy:manabu_student', 3, 5, 'beat_forgetful_sensei',
      '(He stares at his homework, pencil raised, unable to say a single subject.)',
      [{ ja: 'すうがくと れきしが すきです！', text: 'Suugaku to rekishi ga suki desu! I like maths and history! ...I never thought I would say that.' }]),
    ...silenced('kaishain', 'Tsutome the office worker', 'folk:man:tsutome_office', 16, 5, 'beat_forgetful_sensei',
      '(He bows to an empty desk, again and again. He cannot say "meeting" or "report".)',
      [{ ja: 'かいぎに いって、ほうこくしました。', text: 'Kaigi ni itte, houkoku shimashita: I went to the meeting and gave my report. My boss even said よくやった, well done.' }]),
    ...silenced('tomodachi', 'Aiko, the gossip', 'folk:girl:aiko_gossip', 4, 10, 'beat_forgetful_sensei',
      '(She leans in to tell you something exciting, opens her mouth, and gives up.)',
      [{ ja: 'ねえ、きいた？ せんせい、もどったよ！', text: 'Nee, kiita? Sensei modotta yo! Hey, did you hear? Sensei is back! (Friends talk in plain form: きいた, もどった.)' }]),
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(66, 69),
  music: 'village', weather: 'sakura', rideable: true,
};

// ── District 6: Minato Harbour (港). Travel, transport, places, and "if / when". ──
const honsai_harbour: MapDef = {
  id: 'honsai_harbour', name: 'Minato Harbour', nameJa: 'みなと', area: 'honsai6',
  rows: [
    'WWWWWWWWWWWWWWWWWWWW',
    'W~~~~~~~~~~~~~~~~~~W',
    '~~~ddd~~~~~~~~ddd~~~',
    'sssdddsssssssssdddss',
    'ssssssssssssssssssss',
    'T..^^^...==...^^^..T',
    'T..###...==...###..T',
    'T..#N#...==...#N#..T',
    'T........==........T',
    'T.L..,,,.==.,,,..L.T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 11, to: 'honsai_hill', toX: 9, toY: 1 },
    { x: 10, y: 11, to: 'honsai_hill', toX: 10, toY: 1 },
    // The gangplank: the end of the eastern pier, beside the ship.
    { x: 14, y: 2, to: 'honsai_kokoro', toX: 9, toY: 10, requires: 'beat_lost_navigator', lockedText: 'Every ship is tied up. Nobody can tell the captain where to go, or what to do if the weather turns.' },
  ],
  npcs: [
    { id: 'minato_healer', name: 'Nami of the harbour inn', x: 7, y: 10, sprite: 'folk:woman:nami_inn', facing: 'right', heals: true, stationary: true,
      dialogue: [{ speaker: 'Nami', ja: 'いらっしゃい！', text: 'Irasshai! A bed and a bowl of fish soup. Seasick scribes rest free.' }] },
    { id: 'harbour_master', name: 'Harbour Master Moshi', x: 12, y: 8, sprite: 'folk:oldman:moshi_harbour', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Moshi', ja: 'たら・ば・と', text: 'Three ways to say "if", and a sailor needs all three.' },
        { speaker: 'Moshi', ja: 'あめが ふったら', text: 'たら: one thing happens, then another. あめが ふったら、ふねは でない: if it rains, the ship won\'t sail. The most useful of the three.' },
        { speaker: 'Moshi', ja: 'いそげば', text: 'ば: if this condition holds. いそげば まにあう: if you hurry, you\'ll make it. Group 1 moves to the え-row and adds ば.' },
        { speaker: 'Moshi', ja: 'みぎに まがると', text: 'と: whenever A, B always follows. Directions, machines, nature: みぎに まがると、みなとが あります.' },
      ] },
    { id: 'lost_navigator', name: 'The Lost Navigator', x: 4, y: 3, sprite: 'folk:fisher:lost_navigator', facing: 'down', hideIf: 'beat_lost_navigator',
      dialogue: [
        { speaker: 'The Lost Navigator', text: '……… (He turns a compass round and round. Every ship in the harbour is tied up: nobody can say where to go, or what to do IF.)' },
        { speaker: 'System', text: 'Give him back the words of travel: tickets, trains, places, directions, and every kind of "if".' },
        { speaker: 'System', text: 'DISTRICT 6: travel and places, and the conditionals たら, ば and と.' },
      ],
      battle: { winFlag: 'beat_lost_navigator', isBoss: true, foes: [
        { familyId: 'wadachi', level: 71, name: 'The Lost Navigator', nameJa: 'まよった こうかいし', sprite: 'folk:fisher:lost_navigator', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'lost_navigator_freed', name: 'The Navigator', x: 4, y: 3, sprite: 'folk:fisher:lost_navigator', facing: 'down', showIf: 'beat_lost_navigator',
      dialogue: [
        { speaker: 'The Navigator', ja: 'かぜが ふいたら、しゅっぱつです。', text: 'Kaze ga fuitara, shuppatsu desu: when the wind blows, we sail. I know where I am going again.' },
        { speaker: 'The Navigator', text: 'Beyond the bay lies Kokoro Garden, where Wapul stole every word for a feeling. The people there cannot even say they are sad.' },
      ] },
    { id: 'kokoro_ship', name: 'Ship to Kokoro Garden', x: 16, y: 3, sprite: 'prop:treasureship', facing: 'down', showIf: 'beat_lost_navigator',
      dialogue: [{ speaker: 'Ship\'s Captain', ja: 'こころの にわ', text: 'Bound for Kokoro Garden, the land of feelings. Step onto the end of the pier when you are ready to sail.' }] },
    ...silenced('kippu', 'Kippu the ticket seller', 'folk:merchant:kippu_tickets', 2, 4, 'beat_lost_navigator',
      '(He holds up a ticket and points at two destinations. He cannot say one-way or return.)',
      [{ ja: 'かたみちですか、おうふくですか。', text: 'Katamichi desu ka, oufuku desu ka? One-way or return? Ahh, the sweet music of my trade.' }]),
    ...silenced('ryokou', 'Tabi the traveller', 'folk:woman:tabi_traveller', 17, 4, 'beat_lost_navigator',
      '(She studies a map, then a timetable, and sighs. She cannot ask the way.)',
      [{ ja: 'すみません、えきは どちらですか。', text: 'Sumimasen, eki wa dochira desu ka? Excuse me, which way is the station? I have wanted to ask that for weeks.' }]),
    ...silenced('fune', 'Kaito the deckhand', 'folk:fisher:deckhand_kaito', 15, 8, 'beat_lost_navigator',
      '(He coils a rope and looks at the sky, worried. He cannot say "if it rains".)',
      [{ ja: 'あめが ふったら、ふねは でません。', text: 'Ame ga futtara, fune wa demasen: if it rains, the ship won\'t sail. ...It is not raining. We sail!' }]),
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(67, 70),
  music: 'docks', weather: 'none', rideable: true,
};

export const HONSAI_MAPS_2: readonly MapDef[] = [honsai_bridges, honsai_hill, honsai_harbour];
