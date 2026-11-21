import type { MapDef, NpcDef } from '../types';
import { HONSAI_ENCOUNTERS, silenced } from './honsai';
import { LIBRARY_WINGS, HONSAI_WORDS, LIBRARY_DISTRICT } from '../../content/honsai/words';

// Honsai districts 10-12 and the Great Library: Kotonoha Court (keigo), Kawaraban Row (the
// city and its news; すぎる, そうだ, らしい), and the Tower of Silence, where Demon Lord Wapul
// sits on every word he ever ate. The Library, off the court, holds JMdict's common words
// in wings: optional, repeatable, and the way to 5,000.

// ── District 10: Kotonoha Court (言の葉の都). Keigo, the court, government, manners. ──
const honsai_court: MapDef = {
  id: 'honsai_court', name: 'Kotonoha Court', nameJa: 'ことのはのみやこ', area: 'honsai10',
  rows: [
    'mmmmmmmmm==mmmmmmmmm',
    'm.L.....g==g.....L.m',
    'm..^^^^.g==g.^^^^..m',
    'm..####.g==g.####..m',
    'm..##D#.g==g.#D##..m',
    'm......gg==gg......m',
    '=.S....g....g....S.m',
    'm......g....g......m',
    'm..L...g....g...L..m',
    'm......g....g......m',
    'm..,,,.g....g.,,,..m',
    'm......g....g......m',
    'mmmmmmmmm==mmmmmmmmm',
  ],
  warps: [
    { x: 9, y: 12, to: 'honsai_matsuri', toX: 9, toY: 1 },
    { x: 10, y: 12, to: 'honsai_matsuri', toX: 10, toY: 1 },
    { x: 0, y: 6, to: 'honsai_library', toX: 9, toY: 11 },
    { x: 9, y: 0, to: 'honsai_kawaraban', toX: 9, toY: 12, requires: 'beat_masked_chamberlain', lockedText: 'Guards cross their spears. "None may pass without leave of the Chamberlain." (They say it very politely.)' },
    { x: 10, y: 0, to: 'honsai_kawaraban', toX: 10, toY: 12, requires: 'beat_masked_chamberlain', lockedText: 'Guards cross their spears. "None may pass without leave of the Chamberlain." (They say it very politely.)' },
  ],
  npcs: [
    { id: 'court_physician', name: 'Court Physician Gen', x: 4, y: 11, sprite: 'folk:oldman:gen_physician', facing: 'up', heals: true, stationary: true,
      dialogue: [{ speaker: 'Gen', ja: 'おだいじに なさって ください。', text: 'Odaiji ni nasatte kudasai: please take good care of yourself. Even courtiers faint. Mostly from bowing.' }] },
    { id: 'keigo_teacher', name: 'Lady Uyamai, mistress of etiquette', x: 17, y: 9, sprite: 'folk:princess:uyamai_etiquette', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Lady Uyamai', ja: 'そんけいご・けんじょうご', text: 'At court there are two ladders. Raise the other person (尊敬語), or lower yourself (謙譲語). Never both at once, and never raise yourself.' },
        { speaker: 'Lady Uyamai', ja: 'いらっしゃる・おっしゃる・めしあがる', text: 'Honorific verbs, for what THEY do: 行く/来る/いる → いらっしゃる, 言う → おっしゃる, 食べる → 召し上がる, 見る → ご覧になる, する → なさる.' },
        { speaker: 'Lady Uyamai', ja: 'まいる・もうす・いただく', text: 'Humble verbs, for what YOU do for them: 行く/来る → 参る, 言う → 申す, 食べる/もらう → いただく, 見る → 拝見する, する → 致す, 訪ねる → 伺う.' },
        { speaker: 'Lady Uyamai', ja: 'お〜になる・お〜する', text: 'Any other verb: お + ます-stem + になる raises them (お帰りになる); お + ます-stem + する lowers you (お持ちします). する-nouns take ご: ご案内します.' },
      ] },
    { id: 'library_guide', name: 'Shiori the librarian', x: 2, y: 7, sprite: 'folk:woman:shiori_librarian', facing: 'left', stationary: true,
      dialogue: [
        { speaker: 'Shiori', ja: 'としょかんへ ようこそ。', text: 'Through the west door is the Great Library. Every word Wapul could not digest he shelved there, thousands of them, in fifteen wings.' },
        { speaker: 'Shiori', text: 'Each wing has a keeper who will spar with you as often as you like. Take the words back one wing at a time; the Word Ledger keeps count.' },
      ] },
    { id: 'masked_chamberlain', name: 'The Masked Chamberlain', x: 12, y: 1, sprite: 'folk:noble:masked_chamberlain', facing: 'left', hideIf: 'beat_masked_chamberlain',
      dialogue: [
        { speaker: 'The Masked Chamberlain', text: 'Speak. Oh, but carefully. One word too plain to a superior, one word too grand for yourself, and Wapul hears it. Here, every word is a test of rank.' },
        { speaker: 'System', text: 'He wears a mask for every level of politeness and none of them is his face. Answer him in proper keigo.' },
        { speaker: 'System', text: 'DISTRICT 10: the court, government and manners; honorific and humble verbs, お〜になる, お〜する, て-form + いただけますか.' },
      ],
      battle: { winFlag: 'beat_masked_chamberlain', isBoss: true, foes: [
        { familyId: 'noppera', level: 77, name: 'The Masked Chamberlain', nameJa: 'かめんの じじゅう', sprite: 'folk:noble:masked_chamberlain', recruitable: false, hpScale: 5.5 },
      ] } },
    { id: 'masked_chamberlain_freed', name: 'The Chamberlain, unmasked', x: 12, y: 1, sprite: 'folk:noble:masked_chamberlain', facing: 'left', showIf: 'beat_masked_chamberlain',
      dialogue: [
        { speaker: 'The Chamberlain', ja: 'しつれいいたしました。', text: 'Shitsurei itashimashita: I humbly beg your pardon. Keigo was meant to be kindness, not a cage. I had forgotten.' },
        { speaker: 'The Chamberlain', text: 'Beyond the court is Kawaraban Row, where the news is printed. Wapul fills it with rumours. And past the Row, his tower.' },
      ] },
    ...silenced('nyokan', 'Fumika the court lady', 'folk:princess:fumika_lady', 4, 6, 'beat_masked_chamberlain',
      '(She bows, opens her mouth, bows lower, and gives up. She is afraid any word might be the wrong level.)',
      [{ ja: 'ようこそ いらっしゃいました。', text: 'Youkoso irasshaimashita: welcome, you honour us by coming. ...There. A whole sentence, and nobody fainted.' }]),
    ...silenced('heishi', 'Mamoru the guard', 'folk:warrior:mamoru_guard', 15, 6, 'beat_masked_chamberlain',
      '(He salutes you, then the wall, then the sky, unsure whom he may speak to.)',
      [{ ja: 'しょうしょう おまち ください。', text: 'Shoushou omachi kudasai: please wait a moment. That is the most useful sentence a guard owns.' }]),
    ...silenced('shoshi', 'Kaku the scribe', 'folk:monk:kaku_scribe', 9, 8, 'beat_masked_chamberlain',
      '(He holds a letter to the king and cannot write the first line.)',
      [{ ja: 'へいかに もうしあげます。', text: 'Heika ni moushiagemasu: I humbly report to Your Majesty. (申し上げる: the humblest "say".)' }]),
  ],
  encounterRate: 0.06,
  encounters: HONSAI_ENCOUNTERS(72, 75),
  music: 'castle', weather: 'sakura', rideable: false,
};

// ── The Great Library (大図書館). Fifteen wings of JMdict's common words, one keeper each. ──
const WING_TITLES: Record<number, string> = { 1: 'Verbs', 2: 'Adjectives', 3: 'Adverbs', 14: 'Loanwords I', 15: 'Loanwords II' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const wingTitle = (n: number) => WING_TITLES[n] ?? `Nouns ${ROMAN[n - 4] ?? n - 3}`;
const KEEPER_SPOTS: [number, number][] = [
  [2, 2], [5, 2], [8, 2], [11, 2], [14, 2],
  [2, 5], [5, 5], [8, 5], [11, 5], [14, 5],
  [2, 8], [5, 8], [8, 8], [11, 8], [14, 8],
];
const KEEPER_LOOKS = ['monk', 'oldman', 'oldwoman', 'noble', 'woman', 'man', 'girl', 'boy'];

function wingKeeper(wing: number, i: number): NpcDef {
  const [x, y] = KEEPER_SPOTS[i] as [number, number];
  const words = HONSAI_WORDS.filter((w) => w.district === LIBRARY_DISTRICT && w.area === `honsai_lib${wing}`);
  const sample = words.slice(0, 3).map((w) => `${w.text} (${w.meaning.split(';')[0]})`).join(', ');
  const id = `wing_keeper_${wing}`;
  return {
    id, name: `Keeper of Wing ${wing}: ${wingTitle(wing)}`, x, y, facing: 'down', stationary: true,
    sprite: `folk:${KEEPER_LOOKS[i % KEEPER_LOOKS.length]}:${id}`,
    dialogue: [
      { speaker: `Keeper of Wing ${wing}`, ja: `だい${wing}の たな`, text: `Wing ${wing}, ${wingTitle(wing)}: ${words.length} words. ${sample}, and the rest on the shelves behind me.` },
      { speaker: 'System', text: 'A wing keeper spars as often as you like. Every word you answer comes back in review until it is yours.' },
    ],
    battle: { winFlag: `library_wing_${wing}`, isBoss: false, pool: `library${wing}`, repeatable: true, foes: [
      { familyId: 'baku', level: 72, name: `Keeper of Wing ${wing}`, nameJa: 'たなの ばん', sprite: `folk:${KEEPER_LOOKS[i % KEEPER_LOOKS.length]}:${id}`, recruitable: false, hpScale: 3 },
    ] },
  };
}

const honsai_library: MapDef = {
  id: 'honsai_library', name: 'The Great Library', nameJa: 'だいとしょかん', area: 'honsai_library',
  rows: [
    '####################',
    '#_##_##_##_##_##___#',
    '#__________________#',
    '#__________________#',
    '#_##_##_##_##_##___#',
    '#__________________#',
    '#__________________#',
    '#_##_##_##_##_##___#',
    '#__________________#',
    '#__________________#',
    '#__________________#',
    '#__________________#',
    '#########__#########',
  ],
  warps: [
    { x: 9, y: 12, to: 'honsai_court', toX: 1, toY: 6 },
    { x: 10, y: 12, to: 'honsai_court', toX: 1, toY: 6 },
  ],
  npcs: [
    ...LIBRARY_WINGS.slice(0, KEEPER_SPOTS.length).map(wingKeeper),
    { id: 'head_librarian', name: 'Head Librarian Fumikura', x: 17, y: 10, sprite: 'folk:oldwoman:fumikura_librarian', facing: 'left', stationary: true,
      dialogue: [
        { speaker: 'Fumikura', ja: 'いちにち ひとたな。', text: 'One shelf a day. Wapul swallowed these words whole; you will have to take them back one by one.' },
        { speaker: 'Fumikura', text: 'The words here are the ones Japanese newspapers, books and people use most, gathered from JMdict, the great open dictionary. Verbs by the door, nouns in the middle, loanwords at the back.' },
      ] },
  ],
  encounterRate: 0,
  encounters: [],
  music: 'temple', weather: 'none', rideable: false,
};

// ── District 11: Kawaraban Row (瓦版通り). The city, news, money, society; すぎる, そうだ, らしい. ──
const honsai_kawaraban: MapDef = {
  id: 'honsai_kawaraban', name: 'Kawaraban Row', nameJa: 'かわらばんどおり', area: 'honsai11',
  rows: [
    'TTTTTTTTT==TTTTTTTTT',
    'T.^^^^^..==..^^^^^.T',
    'T.#####..==..#####.T',
    'T.##D##..==..##D##.T',
    'T........==........T',
    'T........==........T',
    'T..NNN...==...NNN..T',
    'T........==........T',
    'T........==........T',
    'T.L......==......L.T',
    'T........==........T',
    'T..,,,...==...,,,..T',
    'T........==........T',
    'TTTTTTTTT==TTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 13, to: 'honsai_court', toX: 9, toY: 1 },
    { x: 10, y: 13, to: 'honsai_court', toX: 10, toY: 1 },
    { x: 9, y: 0, to: 'honsai_tower', toX: 9, toY: 12, requires: 'beat_rumour_eater', lockedText: 'A wall of shouting newsprint blocks the road. Every page says something different about what lies beyond.' },
    { x: 10, y: 0, to: 'honsai_tower', toX: 9, toY: 12, requires: 'beat_rumour_eater', lockedText: 'A wall of shouting newsprint blocks the road. Every page says something different about what lies beyond.' },
  ],
  npcs: [
    { id: 'kawaraban_healer', name: 'Yuzu of the bathhouse', x: 4, y: 12, sprite: 'folk:woman:yuzu_bath', facing: 'up', heals: true, stationary: true,
      dialogue: [{ speaker: 'Yuzu', ja: 'おふろで ゆっくり して ください。', text: 'Ofuro de yukkuri shite kudasai: have a long soak. The city is loud; the bath is quiet.' }] },
    { id: 'news_teacher', name: 'Old Kiji, the town crier', x: 15, y: 5, sprite: 'folk:oldman:kiji_crier', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Kiji', ja: 'そうだ・らしい・ようだ', text: 'A crier must say how he knows what he knows. Three endings for it.' },
        { speaker: 'Kiji', ja: 'ゆきが ふるそうだ', text: 'Plain form + そうだ: I hear that. ゆきが ふるそうだ, I hear it will snow. (ふりそう, with the ます-stem, means it LOOKS like snow. Different thing.)' },
        { speaker: 'Kiji', ja: 'らしい・ようだ', text: 'らしい: apparently, from what people say. ようだ: it seems, from what I see myself. いる ようだ: someone seems to be there.' },
        { speaker: 'Kiji', ja: 'たかすぎる！', text: 'And the city\'s favourite: すぎる, too much. ます-stem + すぎる (のみすぎる), い-adjectives drop い (たかすぎる), な-adjectives just add it (しずかすぎる).' },
      ] },
    { id: 'rumour_eater', name: 'The Rumour-Eater', x: 12, y: 1, sprite: 'folk:merchant:rumour_eater', facing: 'left', hideIf: 'beat_rumour_eater',
      dialogue: [
        { speaker: 'The Rumour-Eater', text: 'Did you hear? The bridges fell. Did you hear? The festival never stopped. Did you hear? Nobody knows what is true anymore, and nobody minds! Delicious.' },
        { speaker: 'System', text: 'He feeds on words used carelessly. Give the city back its true words: news, money, society, and how to say how you know.' },
        { speaker: 'System', text: 'DISTRICT 11: the city, news, money and society; すぎる, そうだ (hearsay), らしい, ようだ, ために, ように, ばかり.' },
      ],
      battle: { winFlag: 'beat_rumour_eater', isBoss: true, foes: [
        { familyId: 'baku', level: 78, name: 'The Rumour-Eater', nameJa: 'うわさぐい', sprite: 'folk:merchant:rumour_eater', recruitable: false, hpScale: 5 },
      ] } },
    { id: 'rumour_eater_freed', name: 'The Rumour-Eater, honest', x: 12, y: 1, sprite: 'folk:merchant:rumour_eater', facing: 'left', showIf: 'beat_rumour_eater',
      dialogue: [
        { speaker: 'The former Rumour-Eater', ja: 'ほんとうの ことを いうのは むずかしい。', text: 'Hontou no koto wo iu no wa muzukashii: telling the truth is hard. Rumours were easier. I will try the hard thing now.' },
        { speaker: 'The former Rumour-Eater', text: 'North of here is the Tower of Silence. Wapul is inside. They say... no. I KNOW: he has not spoken a word in a thousand years.' },
      ] },
    ...silenced('kisha', 'Shinbun the reporter', 'folk:man:shinbun_reporter', 4, 8, 'beat_rumour_eater',
      '(He holds up a notebook full of blank pages and a pencil worn to a stub.)',
      [{ ja: 'じけんの きじを かきました！', text: 'Jiken no kiji wo kakimashita! I wrote the article about the incident! Facts only. No rumours. (Well. Mostly.)' }]),
    ...silenced('kaimono', 'Okane the shopper', 'folk:oldwoman:okane_shopper', 15, 8, 'beat_rumour_eater',
      '(She points at a price tag, clutches her chest, and points again.)',
      [{ ja: 'たかすぎる！ ぶっかが また あがった。', text: 'Takasugiru! Bukka ga mata agatta: too expensive! Prices went up again. Ahh, it feels good to complain properly.' }]),
    ...silenced('chounai', 'Machiko of the neighbourhood watch', 'folk:woman:machiko_watch', 7, 5, 'beat_rumour_eater',
      '(She waves at you to come closer, as if to share some neighbourhood news, then sighs.)',
      [{ ja: 'となりの ひと、ひっこす らしいですよ。', text: 'Tonari no hito, hikkosu rashii desu yo: apparently the people next door are moving. (らしい: I heard it from someone. Probably.)' }]),
  ],
  encounterRate: 0.06,
  encounters: HONSAI_ENCOUNTERS(73, 76),
  music: 'market', weather: 'rain', rideable: false,
};

// ── District 12: the Tower of Silence (沈黙の塔). Ideas, logic, language; させられる. Wapul. ──
// Three halls stacked up the map. Each narrow door is held by a Seal of Silence; the
// last hall is Wapul's.
const honsai_tower: MapDef = {
  id: 'honsai_tower', name: 'Tower of Silence', nameJa: 'ちんもくのとう', area: 'honsai12',
  rows: [
    'mmmmmmmmmmmmmmmmmmmm',
    'm__________________m',
    'm__L____________L__m',
    'm__________________m',
    'mmmmmmmmm_mmmmmmmmmm',
    'm__________________m',
    'm__________________m',
    'm___L__________L___m',
    'm__________________m',
    'mmmmmmmmm_mmmmmmmmmm',
    'm__________________m',
    'm__________________m',
    'm__________________m',
    'mmmmmmmmm_mmmmmmmmmm',
  ],
  warps: [
    { x: 9, y: 13, to: 'honsai_kawaraban', toX: 9, toY: 1 },
  ],
  npcs: [
    { id: 'koe_tower', name: 'Koe', x: 4, y: 11, sprite: 'folk:girl:koe_tower', facing: 'right', heals: true, stationary: true,
      dialogue: [{ speaker: 'Koe', ja: 'わたしの こえを つかって。', text: 'Watashi no koe wo tsukatte: use my voice. I followed you all the way from the gate. Rest; I will keep talking so the silence cannot reach you.' }] },
    { id: 'tower_prisoner', name: 'Tsukasa, a prisoner of the tower', x: 15, y: 11, sprite: 'folk:man:tsukasa_prisoner', facing: 'down', stationary: true,
      dialogue: [
        { speaker: 'Tsukasa', ja: 'させられた。', text: 'Saserareta: I was made to. Made to carry, made to keep quiet, made to forget. There is a form for that.' },
        { speaker: 'Tsukasa', ja: 'のまされる・はなさせられる', text: 'Causative-passive, "be made to do": Group 1 moves to the あ-row and adds される (飲む → 飲まされる); す-verbs and Group 2 add させられる (話させられる, 食べさせられる); する → させられる.' },
        { speaker: 'Tsukasa', text: 'And Wapul\'s favourite words: わけ (it is not that...), はず (it should be), べき (one ought to), かぎり (as long as). He uses them to argue nobody needs to speak. Do not let him win the argument.' },
      ] },
    { id: 'seal_lower', name: 'Seal of Silence', x: 9, y: 9, sprite: 'yamabiko1', facing: 'down', hideIf: 'tower_seal_lower',
      dialogue: [{ speaker: 'Seal of Silence', text: '……………… (A shape of pure quiet fills the doorway. Words go in and do not come out.)' }],
      battle: { winFlag: 'tower_seal_lower', isBoss: false, foes: [
        { familyId: 'yamabiko', level: 78, name: 'Seal of Silence', nameJa: 'ちんもくの ふういん', sprite: 'yamabiko1', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'seal_upper', name: 'Seal of Silence', x: 9, y: 4, sprite: 'yamabiko2', facing: 'down', hideIf: 'tower_seal_upper',
      dialogue: [{ speaker: 'Seal of Silence', text: '……………… (Colder than the first. Behind it you can hear something breathing, slowly, enormous.)' }],
      battle: { winFlag: 'tower_seal_upper', isBoss: false, foes: [
        { familyId: 'yamabiko', level: 79, name: 'Seal of Silence', nameJa: 'ちんもくの ふういん', sprite: 'yamabiko2', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'wapul', name: 'Demon Lord Wapul', x: 9, y: 1, sprite: 'folk:ghost:wapul', facing: 'down', hideIf: 'beat_wapul',
      dialogue: [
        { speaker: 'Wapul', text: '...So. A voice. I have not heard one in here for a thousand years. I ate them all, you know. Every word anyone forgot to use.' },
        { speaker: 'Wapul', text: 'Why speak at all? Words hurt. Words lie. Words are misunderstood. A silent world has no quarrels. You ought to thank me. べきだ, you see? I know grammar too.' },
        { speaker: 'System', text: 'Demon Lord Wapul. Inside him is every word of Honsai. Speak them back into the world: all twelve districts, every form you have forged.' },
        { speaker: 'System', text: 'FINAL BATTLE: ideas, logic and language itself; causative-passive, わけ, はず, べき, かぎり, ても, ほど, につれて.' },
      ],
      battle: { winFlag: 'beat_wapul', isBoss: true, foes: [
        { familyId: 'noppera', level: 82, name: 'Demon Lord Wapul', nameJa: 'まおう ワプル', sprite: 'folk:ghost:wapul', recruitable: false, hpScale: 6 },
      ] } },
    { id: 'wapul_freed', name: 'Wapul, who listens', x: 9, y: 1, sprite: 'folk:ghost:wapul', facing: 'down', showIf: 'beat_wapul',
      dialogue: [
        { speaker: 'Wapul', ja: 'ありがとう。', text: 'Arigatou. ...I had forgotten that word. I ate it so long ago. Nobody ever said it to me, so I thought it was safe to swallow.' },
        { speaker: 'Wapul', text: 'I was the spirit of unspoken words. Every word people meant to say and never did came to me. There were so many. I was so full, and so lonely.' },
        { speaker: 'Wapul', ja: 'ことばは つかわなければ きえる。', text: 'Kotoba wa tsukawanakereba kieru: words vanish if you do not use them. That was never my doing. Go. Use them. All five thousand.' },
      ] },
    { id: 'kaito_finale', name: 'Master Kaito', x: 11, y: 2, sprite: 'master', facing: 'left', showIf: 'beat_wapul',
      dialogue: [
        { speaker: 'Master Kaito', ja: 'よく やった。', text: 'Yoku yatta: well done. When you came to my dojo you could not read あ. Now Honsai speaks again because of you.' },
        { speaker: 'Master Kaito', text: 'A scribe\'s work is never finished, though. The Library still has shelves you have not read, and the review never ends. That is not a curse. That is what knowing a language is.' },
        { speaker: 'System', text: 'HONSAI IS RESTORED. The Great Library stays open, and every district and keeper can be challenged again.' },
      ] },
    ...silenced('shijin', 'Uta, the last poet', 'folk:oldwoman:uta_poet', 6, 6, 'beat_wapul',
      '(She holds a brush over an empty page. Her lips move, but the tower swallows the sound.)',
      [{ ja: 'ことばは いきて いる。', text: 'Kotoba wa ikite iru: words are alive. I will write that first, and then everything else.' }]),
    ...silenced('honyaku', 'Tsuuji the interpreter', 'folk:man:tsuuji_interpreter', 13, 6, 'beat_wapul',
      '(He listens to two people who cannot hear each other, and has no words to carry between them.)',
      [{ ja: 'つまり、おたがいに わかりあいたい わけですね。', text: 'Tsumari, otagai ni wakariaitai wake desu ne: in other words, you both want to understand each other. That is all translation ever is.' }]),
  ],
  encounterRate: 0.05,
  encounters: HONSAI_ENCOUNTERS(75, 78),
  music: 'boss', weather: 'none', rideable: false,
};

export const HONSAI_MAPS_4: readonly MapDef[] = [honsai_court, honsai_library, honsai_kawaraban, honsai_tower];
