import type { MapDef } from '../types';
import { HONSAI_ENCOUNTERS, silenced } from './honsai';

// Honsai districts 7-9: Kokoro Garden (wants, intentions, how things look), Kaze Valley
// (can, is done to, becomes) and Matsuri Town (make and let, giving and receiving). Same
// shape as districts 1-6: words and grammar in the pool, silenced villagers, a teacher
// who explains the district's forms, a local healer and a lieutenant at the far end.

// ── District 7: Kokoro Garden (心の庭). Feelings, the body, health; たい, よう, そう. ──
// Reached by ship from Minato Harbour. Wapul ate every word for a feeling: the gardeners
// still feel everything, but cannot say so.
const honsai_kokoro: MapDef = {
  id: 'honsai_kokoro', name: 'Kokoro Garden', nameJa: 'こころのにわ', area: 'honsai7',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'T.S......==......S.T',
    'T..^^^...==...^^^..T',
    'T..###...==...###..T',
    'T..#D#...==...#D#..T',
    'T*.*.*...==...*.*.*T',
    'T........==........T',
    'T.~~~....==....,,,.T',
    'T.~~~..L.==.L..,,,.T',
    'T........==........T',
    'T*S*.....==.....*S*T',
    'WWWWWWWWWddWWWWWWWWW',
    'WWWWWWWWWddWWWWWWWWW',
  ],
  warps: [
    { x: 9, y: 12, to: 'honsai_harbour', toX: 14, toY: 4 },
    { x: 10, y: 12, to: 'honsai_harbour', toX: 14, toY: 4 },
    { x: 9, y: 0, to: 'honsai_valley', toX: 9, toY: 13, requires: 'beat_hollow_heart', lockedText: 'A hedge of thorns closes the garden gate. Somewhere behind it, someone is crying without a sound.' },
    { x: 10, y: 0, to: 'honsai_valley', toX: 10, toY: 13, requires: 'beat_hollow_heart', lockedText: 'A hedge of thorns closes the garden gate. Somewhere behind it, someone is crying without a sound.' },
  ],
  npcs: [
    { id: 'kokoro_healer', name: 'Iyasu the herbalist', x: 5, y: 9, sprite: 'folk:oldwoman:iyasu_herbalist', facing: 'down', heals: true, stationary: true,
      dialogue: [{ speaker: 'Iyasu', ja: 'どこが いたいですか。', text: 'Doko ga itai desu ka: where does it hurt? Lie on the moss. Herbs for the body, rest for the heart.' }] },
    { id: 'kimochi_teacher', name: 'Emi the gardener', x: 14, y: 6, sprite: 'folk:woman:emi_gardener', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Emi', ja: 'たい・よう・そう', text: 'Three little endings carry a whole heart: what you want, what you mean to do, how someone seems.' },
        { speaker: 'Emi', ja: 'みずが のみたい', text: 'たい: the ます-stem + たい. 飲みます → 飲みたい, I want to drink. It bends like an い-adjective: 飲みたくない.' },
        { speaker: 'Emi', ja: 'さあ、いこう！', text: 'Volitional, "let\'s": Group 1 moves to the お-row and adds う (行く → 行こう); Group 2 adds よう (食べよう); する → しよう, 来る → 来よう.' },
        { speaker: 'Emi', ja: 'かなしそうですね', text: 'そう: "looks ~". Drop い and add そう: 嬉しい → 嬉しそう. な-adjectives just add そう: 元気そう. And いい → よさそう.' },
        { speaker: 'Emi', text: 'One more thing: you can say 嬉しい about yourself, but nobody can see inside another heart. For others say 嬉しそう, or 欲しがっている.' },
      ] },
    { id: 'hollow_heart', name: 'The Hollow Heart', x: 12, y: 1, sprite: 'folk:ghost:hollow_heart', facing: 'left', hideIf: 'beat_hollow_heart',
      dialogue: [
        { speaker: 'The Hollow Heart', text: '……… (A figure with a hole where its chest should be. Petals fall through it. It does not seem sad. It does not seem anything.)' },
        { speaker: 'System', text: 'Wapul hollowed it out to hold every stolen feeling. Give them back, one word at a time.' },
        { speaker: 'System', text: 'DISTRICT 7: feelings, the body and health; たい (want to), the volitional (let\'s), and そう (looks ~).' },
      ],
      battle: { winFlag: 'beat_hollow_heart', isBoss: true, foes: [
        { familyId: 'yozakura', level: 72, name: 'The Hollow Heart', nameJa: 'からっぽの こころ', sprite: 'folk:ghost:hollow_heart', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'hollow_heart_freed', name: 'The Full Heart', x: 12, y: 1, sprite: 'folk:ghost:hollow_heart', facing: 'left', showIf: 'beat_hollow_heart',
      dialogue: [
        { speaker: 'The Full Heart', ja: 'うれしい。かなしい。なつかしい。', text: 'Ureshii. Kanashii. Natsukashii. Happy, sad, nostalgic: all of them at once. It is a lot. I would not give one back.' },
        { speaker: 'The Full Heart', text: 'North of the garden is Kaze Valley. Wapul stole its weather. No wind, no rain, no names for any of it: the whole valley is holding its breath.' },
      ] },
    ...silenced('naki', 'Naki, who cannot cry', 'folk:girl:naki_crying', 7, 6, 'beat_hollow_heart',
      '(Tears run down her face, but she only shrugs. She has no word for what she feels.)',
      [{ ja: 'かなしかった。でも、もう だいじょうぶ。', text: 'Kanashikatta. Demo, mou daijoubu: I was sad. But I am all right now. Saying it helped more than the crying.' }]),
    ...silenced('itami', 'Itami the woodcutter', 'folk:man:itami_woodcutter', 12, 6, 'beat_hollow_heart',
      '(He holds his shoulder and winces, then points at his head, his back, his knee. He cannot name any of them.)',
      [{ ja: 'かたと こしが いたいです。', text: 'Kata to koshi ga itai desu: my shoulder and lower back hurt. Ahh. Now Iyasu knows which herbs to give me.' }]),
    ...silenced('koi', 'Koi, the shy one', 'folk:boy:koi_shy', 16, 8, 'beat_hollow_heart',
      '(He looks at a girl across the garden, looks away, turns red, and says nothing at all.)',
      [{ ja: 'いっしょに はなびを みに いこう！', text: 'Issho ni hanabi wo mi ni ikou! Let\'s go and see the fireworks together! ...I said it. I actually said it.' }]),
    { id: 'kokoro_monk', name: 'Shizuka the garden monk', x: 8, y: 9, sprite: 'folk:monk:shizuka_garden', facing: 'down', showIf: 'beat_hollow_heart',
      dialogue: [{ speaker: 'Shizuka', ja: 'おちついて。', text: 'Ochitsuite: calm down. The heart is a pond. Stir it and you cannot see the bottom; let it settle and you see everything.' }] },
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(68, 71),
  music: 'garden', weather: 'sakura', rideable: true,
};

// ── District 8: Kaze Valley (風の谷). Weather, seasons, nature, animals; can, is done to, becomes. ──
const honsai_valley: MapDef = {
  id: 'honsai_valley', name: 'Kaze Valley', nameJa: 'かぜのたに', area: 'honsai8',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'Tpp.o....==....o.ppT',
    'Tp.......==.......pT',
    'T..,,,...==...,,,..T',
    'T..,,,...==...,,,..T',
    'T........==........T',
    'T.*.*....==....*.*.T',
    '~~~~~~~~~HH~~~~~~~~~',
    'T........==........T',
    'T.S..L...==...L..S.T',
    'T..^^^...==...^^^..T',
    'T..###...==...###..T',
    'T..#D#...==...#D#..T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 14, to: 'honsai_kokoro', toX: 9, toY: 1 },
    { x: 10, y: 14, to: 'honsai_kokoro', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_matsuri', toX: 9, toY: 10, requires: 'beat_windless', lockedText: 'The pass is choked with still, grey air. Nothing moves through it; not even you.' },
    { x: 10, y: 0, to: 'honsai_matsuri', toX: 10, toY: 10, requires: 'beat_windless', lockedText: 'The pass is choked with still, grey air. Nothing moves through it; not even you.' },
  ],
  npcs: [
    { id: 'valley_healer', name: 'Hinata of the valley inn', x: 6, y: 13, sprite: 'folk:woman:hinata_inn', facing: 'up', heals: true, stationary: true,
      dialogue: [{ speaker: 'Hinata', ja: 'さむかったでしょう。', text: 'Samukatta deshou: you must have been cold. Sit by the hearth. The valley gets chilly when the weather has no name.' }] },
    { id: 'weather_watcher', name: 'Old Sora the weather watcher', x: 15, y: 8, sprite: 'folk:oldman:sora_watcher', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Sora', ja: 'できる・される・なる', text: 'A valley is about what you can do, what is done to you, and what things become. Three forms for it.' },
        { speaker: 'Sora', ja: 'やまが みえる', text: 'Potential, "can": Group 1 moves to the え-row and adds る (書く → 書ける); Group 2 adds られる (食べられる); する → できる, 来る → 来られる. 見える and 聞こえる mean "can be seen, can be heard" by themselves.' },
        { speaker: 'Sora', ja: 'あめに ふられた', text: 'Passive: Group 1 moves to the あ-row and adds れる (噛む → 噛まれる); Group 2 adds られる. Japanese even says 雨に降られた, "I was rained on", when the weather spoils your day.' },
        { speaker: 'Sora', ja: 'あたたかく なる', text: 'Becoming: い-adjectives drop い and add く before なる (暖かくなる); な-adjectives and nouns take に (静かになる, 春になる).' },
      ] },
    { id: 'windless', name: 'Nagi, the Windless', x: 12, y: 1, sprite: 'folk:noble:nagi_windless', facing: 'left', hideIf: 'beat_windless',
      dialogue: [
        { speaker: 'Nagi', text: 'Hush. No wind. No rain. No birds, no names for the birds. Is it not peaceful? Wapul promised me a world where nothing happens.' },
        { speaker: 'System', text: 'Nagi holds the valley\'s weather in a closed fan. Name the sky, the land and every creature, and the fan will open.' },
        { speaker: 'System', text: 'DISTRICT 8: weather, nature and animals; the potential (can), the passive (is done to), and 〜くなる / 〜になる.' },
      ],
      battle: { winFlag: 'beat_windless', isBoss: true, foes: [
        { familyId: 'nekaze', level: 74, name: 'Nagi, the Windless', nameJa: 'なぎ', sprite: 'folk:noble:nagi_windless', recruitable: false, hpScale: 7 },
      ] } },
    { id: 'windless_freed', name: 'Nagi, with the wind', x: 12, y: 1, sprite: 'folk:noble:nagi_windless', facing: 'left', showIf: 'beat_windless',
      dialogue: [
        { speaker: 'Nagi', ja: 'かぜが ふいて、とりが なきはじめた。', text: 'Kaze ga fuite, tori ga nakihajimeta: the wind blew, and the birds began to sing. Noisy. I had forgotten how much I loved noise.' },
        { speaker: 'Nagi', text: 'Over the pass is Matsuri Town. Their festival stopped mid-drumbeat when Wapul came. Someone should start it again.' },
      ] },
    ...silenced('kawazu', 'Kawazu the farmer', 'folk:farmer:kawazu_farmer', 3, 5, 'beat_windless',
      '(He looks at the sky, at his dry field, at the sky again. He cannot ask whether it will rain.)',
      [{ ja: 'あしたは あめが ふりそうです。よかった！', text: 'Ashita wa ame ga furisou desu. Yokatta! It looks like rain tomorrow. Thank goodness: the rice will grow.' }]),
    ...silenced('shika', 'Shika the hunter', 'folk:warrior:shika_hunter', 16, 5, 'beat_windless',
      '(She points at tracks in the mud, makes antlers with her fingers, and gives up.)',
      [{ ja: 'しかの あしあとが みえますか。', text: 'Shika no ashiato ga miemasu ka? Can you see the deer tracks? ...No? Look harder. Seeing is a skill.' }]),
    ...silenced('tsubasa', 'Tsubasa, who keeps birds', 'folk:boy:tsubasa_birds', 15, 3, 'beat_windless',
      '(He holds out an empty cage. The bird inside flew off and he could not even call its name.)',
      [{ ja: 'からすに パンを とられました！', text: 'Karasu ni pan wo toraremashita! A crow stole my bread! (The passive: I had my bread taken by a crow.)' }]),
    { id: 'valley_child', name: 'Hotaru, chasing frogs', x: 4, y: 9, sprite: 'folk:girl:hotaru_frogs', facing: 'down', showIf: 'beat_windless',
      dialogue: [{ speaker: 'Hotaru', ja: 'かえるが なきはじめた！', text: 'Kaeru ga nakihajimeta! The frogs started croaking! That means rain is coming. Grandpa Sora taught me.' }] },
    { id: 'valley_shepherd', name: 'Mei the shepherd', x: 15, y: 9, sprite: 'folk:woman:mei_shepherd', facing: 'down',
      dialogue: [{ speaker: 'Mei', ja: 'ひつじが にげられた…', text: '(She sighs.) Hitsuji ni nigerareta: the sheep ran off on me. A passive of misfortune. Very useful for shepherds.' }] },
  ],
  encounterRate: 0.1,
  encounters: HONSAI_ENCOUNTERS(69, 72),
  music: 'mountain', weather: 'none', rideable: true,
};

// ── District 9: Matsuri Town (祭り町). Festivals, hobbies, sport, the arts; させる and giving. ──
const honsai_matsuri: MapDef = {
  id: 'honsai_matsuri', name: 'Matsuri Town', nameJa: 'まつりまち', area: 'honsai9',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'TL.......==.......LT',
    'T.NNN.NNN==NNN.NNN.T',
    'T........==........T',
    'TL.......==.......LT',
    'T.NNN.NNN..NNN.NNN.T',
    'T..................T',
    'T.S....L....L....S.T',
    'T..................T',
    'T*.*.*.*.==.*.*.*.*T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 11, to: 'honsai_valley', toX: 9, toY: 1 },
    { x: 10, y: 11, to: 'honsai_valley', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_court', toX: 9, toY: 11, requires: 'beat_silent_drummer', lockedText: 'The road north to Kotonoha, Wapul\'s capital, is closed while the festival stands frozen.' },
    { x: 10, y: 0, to: 'honsai_court', toX: 10, toY: 11, requires: 'beat_silent_drummer', lockedText: 'The road north to Kotonoha, Wapul\'s capital, is closed while the festival stands frozen.' },
  ],
  npcs: [
    { id: 'matsuri_healer', name: 'Ame the sweet seller', x: 4, y: 10, sprite: 'folk:merchant:ame_sweets', facing: 'up', heals: true, stationary: true,
      dialogue: [{ speaker: 'Ame', ja: 'あまい ものを どうぞ。', text: 'Amai mono wo douzo: have something sweet. Candied apple, on the house. Festivals are hard work.' }] },
    { id: 'festival_master', name: 'Master Hayashi of the festival', x: 15, y: 10, sprite: 'folk:oldman:hayashi_festival', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Hayashi', ja: 'させる・あげる・くれる・もらう', text: 'A festival is people doing things for each other, and letting each other do things. The grammar is the same.' },
        { speaker: 'Hayashi', ja: 'こどもを あそばせる', text: 'Causative, "make or let": Group 1 moves to the あ-row and adds せる (遊ぶ → 遊ばせる); Group 2 adds させる (食べさせる); する → させる, 来る → 来させる. Polite request: 休ませてください, "please let me rest".' },
        { speaker: 'Hayashi', ja: 'て + あげる', text: 'て-form + あげる: I do it for someone (教えてあげる). て-form + くれる: someone does it for me (教えてくれた). Xに て-form + もらう: I get X to do it for me (教えてもらった).' },
        { speaker: 'Hayashi', ja: 'ききながら', text: 'And ながら, "while": the ます-stem + ながら. 歌いながら おどる: dance while singing. That is what a festival is.' },
      ] },
    { id: 'shateki_stall', name: 'Kaname of the target stall', x: 6, y: 6, sprite: 'folk:man:kaname_stall', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Kaname', ja: 'しゃてき！', text: 'Shateki! The target stall! Every target is a verb. Hit it with the right form and win a prize.' },
        { speaker: 'System', text: 'THE TARGET STALL: sparring with every Verb Forge form, from ます to させる. Play as often as you like.' },
      ],
      battle: { winFlag: 'forge_spar_9', isBoss: false, pool: 'honsai_forge9', repeatable: true, foes: [
        { familyId: 'tanu', level: 73, name: 'Kaname', nameJa: 'かなめ', sprite: 'folk:man:kaname_stall', recruitable: false, hpScale: 4 },
      ] } },
    { id: 'silent_drummer', name: 'The Silent Drummer', x: 12, y: 3, sprite: 'folk:warrior:silent_drummer', facing: 'left', hideIf: 'beat_silent_drummer',
      dialogue: [
        { speaker: 'The Silent Drummer', text: '……… (He raises his sticks over a great taiko drum and holds them there. He has been holding them there for a year. Nobody in town has moved since.)' },
        { speaker: 'System', text: 'Wapul froze the festival on its last beat. Name its games, its songs and its people; make the drummer play again.' },
        { speaker: 'System', text: 'DISTRICT 9: festivals, hobbies, sport, the arts and machines; the causative (make, let), てあげる / てくれる / てもらう, and ながら.' },
      ],
      battle: { winFlag: 'beat_silent_drummer', isBoss: true, foes: [
        { familyId: 'tanu', level: 76, name: 'The Silent Drummer', nameJa: 'おとのない たいこうち', sprite: 'folk:warrior:silent_drummer', recruitable: false, hpScale: 5.5 },
      ] } },
    { id: 'silent_drummer_freed', name: 'The Drummer', x: 12, y: 3, sprite: 'folk:warrior:silent_drummer', facing: 'left', showIf: 'beat_silent_drummer',
      dialogue: [
        { speaker: 'The Drummer', ja: 'ドン！ドドン！', text: 'DON! DO-DON! The festival goes on! Thank you for letting me play: たたかせて くれて、ありがとう!' },
        { speaker: 'The Drummer', text: 'Wapul himself waits in Kotonoha, the capital of words, past the northern road. The court there speaks the hardest Japanese of all: keigo.' },
      ] },
    ...silenced('odori', 'Odori the dancer', 'folk:girl:odori_dancer', 14, 7, 'beat_silent_drummer',
      '(She stands frozen mid-step, one arm raised. Her eyes follow you, pleading.)',
      [{ ja: 'うたいながら おどりましょう！', text: 'Utainagara odorimashou! Let\'s dance while we sing! (ながら: two things at once.)' }]),
    ...silenced('senshu', 'Kakeru the runner', 'folk:boy:kakeru_runner', 4, 7, 'beat_silent_drummer',
      '(He has a number pinned to his shirt and keeps jogging on the spot. He cannot say "race" or "win".)',
      [{ ja: 'こんどの たいかいで ゆうしょうしたいです！', text: 'Kondo no taikai de yuushou shitai desu! I want to win the next tournament! Coach makes me run every morning: はしらせられる... that is causative-passive. Later.' }]),
    ...silenced('omen', 'Omen the mask maker', 'folk:man:omen_masks', 9, 7, 'beat_silent_drummer',
      '(He holds out a fox mask and a goblin mask, offering you one, but cannot ask which you want.)',
      [{ ja: 'こどもたちに おめんを つくって あげました。', text: 'Kodomotachi ni omen wo tsukutte agemashita: I made masks for the children. てあげる: doing something for someone.' }]),
    { id: 'matsuri_kid', name: 'Kingyo, with a goldfish bag', x: 15, y: 7, sprite: 'folk:boy:kingyo_kid', facing: 'down', showIf: 'beat_silent_drummer',
      dialogue: [{ speaker: 'Kingyo', ja: 'きんぎょ すくいで とった！', text: 'Kingyo sukui de totta! I caught it at the goldfish scooping! Mum says I can keep it if I feed it every day.' }] },
    { id: 'matsuri_couple', name: 'A couple in yukata', x: 6, y: 8, sprite: 'folk:woman:yukata_couple', facing: 'down', showIf: 'beat_silent_drummer',
      dialogue: [{ speaker: 'Yukata couple', ja: 'はなびを みながら はなしましょう。', text: 'Hanabi wo minagara hanashimashou: let\'s talk while we watch the fireworks.' }] },
  ],
  encounterRate: 0.08,
  encounters: HONSAI_ENCOUNTERS(70, 73),
  music: 'market', weather: 'fireflies', rideable: false,
};

export const HONSAI_MAPS_3: readonly MapDef[] = [honsai_kokoro, honsai_valley, honsai_matsuri];
