import type { DialogueLine, Facing, NpcDef } from './types';

/**
 * The townsfolk: people who live along the road and each teach one small thing,
 * a word, a rule or a custom, in their own voice. No battles and no flags: they
 * are there so a region feels lived in and every conversation teaches.
 *
 * Every one is unique (the test checks names and lessons never repeat) and wears
 * a look generated from their id (`folk:<id>`), so no two share a sprite either.
 * Positions were picked on open ground, each tile inside a fully open 3x3, so a
 * townsperson can never block a path. Lines match the arc's script: hiragana in
 * Arc 1, katakana from Arc 2, kanji from Arc 3.
 */
type Line = [ja: string | undefined, text: string];
type Folk = [id: string, name: string, x: number, y: number, lines: Line[], facing?: Facing];

const F: Record<string, Folk[]> = {
  // ── Arc 1: Sakura Valley (hiragana) ─────────────────────────────────
  hayate_dojo: [
    ['taro_sweeper', 'Taro the Sweeper', 10, 8, [
      ['そうじ', 'Souji: cleaning. In Japanese schools and dojos the students clean their own floors. Sweeping is training too.'],
      ['おはよう ございます', 'Say ohayou gozaimasu to your teacher in the morning. Plain おはよう is for friends.'],
    ]],
    ['yumi_archer', 'Archer Yumi', 10, 3, [
      ['ゆみ と や', 'Yumi is a bow, ya an arrow. In kyuudou, the way of the bow, a calm mind matters more than the target.'],
      [undefined, 'あ い う え お: every Japanese sound ends in one of these five vowels. Only ん stands alone.'],
    ]],
  ],
  sakura_village: [
    ['old_ine', 'Old Ine, rice farmer', 2, 6, [
      ['おこめ と ごはん', 'Okome is raw rice. Cooked, it is ごはん, and ごはん also means a whole meal. That is how much rice matters.'],
      ['いただきます', 'Say itadakimasu before you eat and ごちそうさま after. You thank the food, and everyone who made it.'],
    ]],
    ['kenta_kite', 'Kenta and his kite', 11, 11, [
      ['たこ！', 'Tako means a kite... and an octopus! Same sound, two words. Japanese is full of those.'],
      [undefined, 'Sing the vowels with me: あ (ah), い (ee), う (oo), え (eh), お (oh). Short and clean, never sliding.'],
    ]],
  ],
  bamboo_grove: [
    ['take_weaver', 'Take, basket weaver', 2, 16, [
      ['たけ', 'Take: bamboo. I weave it into baskets, flutes and fences. It grows almost a metre in a day.'],
      ['き、 こ、 かき', 'き is a tree, こ a child, and かき a persimmon. The K-row builds a lot of words.'],
    ]],
    ['mayoi_lost', 'Mayoi, forever lost', 16, 13, [
      ['ここ？ そこ？ あそこ？', 'Koko is here, soko is there (near you), asoko is over there (far from both of us). I say them all day.'],
      ['どこ？', 'Doko? Where? Add ですか for strangers: どこですか. I ask it a lot.'],
    ]],
  ],
  river_crossing: [
    ['sachi_ferry', 'Sachi, ferryman\'s daughter', 7, 2, [
      ['すし と さしみ', 'Sushi is about the vinegared rice. Raw fish on its own is さしみ, sashimi.'],
      [undefined, 'し is shi, not si. ち is chi, つ is tsu. The S- and T-rows bend those three.'],
    ]],
    ['tetsu_fisher', 'Old Tetsu, angler', 2, 5, [
      ['いってきます', 'Leaving home I say ittekimasu, "I go and come back". My wife answers いってらっしゃい.'],
      ['ただいま / おかえり', 'Coming home: tadaima, "I\'m back". She says okaeri, "welcome back". Every house in Japan, every day.'],
    ]],
  ],
  kappa_pond: [
    ['tsune_frogs', 'Tsune, frog watcher', 2, 8, [
      ['かえる', 'Kaeru: a frog. It also means "to go home". A frog charm in your purse brings your money back home.'],
      ['けろけろ', 'Japanese frogs say kero kero, not ribbit. Even animal sounds are different here.'],
    ]],
  ],
  ninja_hideout: [
    ['hana_shinobi', 'Hana, ninja apprentice', 6, 14, [
      ['しのびあし', 'Shinobi-ashi: the silent ninja walk. Real ninja were mostly spies and scouts, not assassins in black.'],
      ['わたし は', 'は is ha, but as a particle it is read わ: わたし は. A hidden trick, ninja style.'],
    ]],
    ['nobu_polisher', 'Nobu, star polisher', 6, 2, [
      ['にんじゃ', 'Ninja means "one who endures". They were also called しのび, from しのぶ: to bear, to hide.'],
      [undefined, 'ふ sits between hu and fu: blow softly, like on a candle. ほ, ひ, へ are plain h.'],
    ]],
  ],
  mountain_pass: [
    ['ryou_yamabushi', 'Ryou, mountain ascetic', 13, 2, [
      ['やま', 'Yama: mountain. ふじさん is Mount Fuji, and that さん is a mountain, not "Mr."'],
      ['や ゆ よ', 'The Y-row has only three letters. Old Japanese lost yi and ye long ago.'],
    ]],
    ['rin_lanterns', 'Rin, lantern seller', 3, 5, [
      ['ありがとう', 'Arigatou: thank you. The Japanese r is one quick tap of the tongue, between r and l.'],
      ['ほん', 'ん is the only letter that is a whole beat on its own: ほ-ん, two beats. Hon: book.'],
    ]],
  ],
  moon_shrine: [
    ['kagura_maiden', 'Kagura, shrine dancer', 3, 11, [
      ['じんじゃ', 'Jinja: a Shinto shrine. To pray: bow twice, clap twice, bow once more.'],
      [undefined, 'Two little marks ゛ voice a sound: か ka becomes が ga, さ sa becomes ざ za.'],
    ]],
    ['omi_fortunes', 'Omi, fortune seller', 2, 3, [
      ['おみくじ', 'Omikuji: a paper fortune. Drew a bad one? Tie it to the rope here and leave the bad luck behind.'],
      [undefined, 'The small circle ゜ only goes on the H-row: は ha becomes ぱ pa. ぱん, ぴかぴか, ぽんぽん!'],
    ]],
  ],
  broken_gate: [
    ['daiku_carpenter', 'Daiku, gate carpenter', 3, 8, [
      ['だいく', 'Daiku: carpenter. The old gates were built with no nails at all: the joints lock the wood together.'],
      ['きゃ きゅ きょ', 'A small ゃ ゅ ょ fuses two sounds into one beat: き + ゃ = きゃ, kya.'],
    ]],
    ['chiyo_tea', 'Chiyo, tea girl', 13, 8, [
      ['おちゃ', 'Ocha: tea. ちゃ is one beat. Write the や big, ちや, and it becomes two: chi-ya.'],
      ['きょう', 'Kyou: today. One small ょ changes the whole word. Read small kana carefully!'],
    ]],
  ],

  // ── Arc 2: Frost Harbor (katakana) ──────────────────────────────────
  frost_harbor: [
    ['erik_sailor', 'Erik, coffee sailor', 8, 2, [
      ['コーヒー', 'Koohii: coffee. The bar ー stretches a sound. Without it you get コヒ, which is nothing at all.'],
      [undefined, 'Katakana writes words from other languages, animal sounds, and words you want to SHOUT.'],
    ]],
    ['astrid_crabs', 'Astrid, crab catcher', 17, 9, [
      ['カニ', 'Kani: crab. Menus and science books often write animals in katakana.'],
      ['ア イ ウ エ オ', 'The same five vowels, new shapes. Doesn\'t ア look like a sail?'],
    ]],
  ],
  longship_docks: [
    ['bjorn_ropes', 'Bjorn, rope maker', 2, 2, [
      ['ロープ', 'Roopu: rope. Japanese syllables end in vowels, so English words get vowels added: ro-o-pu.'],
      ['ストライク', 'That is why "strike" is su-to-ra-i-ku: five beats for one English syllable.'],
    ]],
    ['sigrid_cook', 'Sigrid, ship\'s cook', 3, 10, [
      ['パン', 'Pan: bread. It came from Portuguese traders in the 1500s, not from English.'],
      ['テンプラ', 'Tempura arrived with them too. Old loanwords hide in plain sight.'],
    ]],
  ],
  pine_shore: [
    ['leif_beachcomber', 'Leif, beachcomber', 2, 2, [
      ['シ と ツ', 'シ and ツ look alike. シ\'s dots sit on the left and its stroke sweeps up; ツ\'s dots sit on top and its stroke falls down.'],
      ['ソ と ン', 'ソ and ン are the same trap: ソ falls from the top, ン rises from below. Watch the angle.'],
    ]],
    ['ingrid_poet', 'Ingrid, haiku poet', 13, 2, [
      ['ふるいけや', 'An old pond, a frog jumps in, the sound of water. Basho\'s haiku, three lines of 5, 7, 5 beats.'],
      ['ハイク', 'Abroad they spell it ハイク. At home it is written in kanji. Same poem, two scripts.'],
    ]],
  ],
  fjord_caves: [
    ['oskar_lamp', 'Oskar, cave explorer', 14, 3, [
      ['ライト', 'Raito: a light. Careful, it is also "right". R and L are one sound in Japanese.'],
      ['ラ リ ル レ ロ', 'This one row covers both r and l. ロック is rock, and also lock.'],
    ]],
    ['yuki_echo', 'Yuki, echo listener', 16, 5, [
      ['ゲーム', 'Geemu: game. The voicing marks work in katakana too: カ ka, ガ ga.'],
      ['ヴ', 'Katakana even made a new letter, ヴ, for the English v. Most people still just say バ.'],
    ]],
  ],
  rune_watchtower: [
    ['gunnar_watch', 'Gunnar, night watchman', 2, 7, [
      ['パソコン', 'Pasokon: personal computer. Long loanwords get clipped: パーソナル コンピューター became パソコン.'],
      ['ベッド', 'A small ッ is a tiny pause that doubles the next sound: be-d-do. Bed. キッチン: kitchen.'],
    ]],
  ],
  jarl_longship: [
    ['ulf_oarsman', 'Ulf, oarsman', 3, 6, [
      ['ファイト！', 'Faito! Japanese crowds shout "fight" to mean "you can do it!"'],
      ['ファ フィ フェ フォ', 'A small vowel after フ makes sounds old Japanese never had.'],
    ]],
  ],

  // ── Arc 3: the Castle Town (N5 kanji) ──────────────────────────────
  castle_town: [
    ['koyomi_calendar', 'Koyomi, calendar maker', 17, 2, [
      ['月曜日', 'Getsuyoubi: Monday, the moon\'s day. 火 fire Tuesday, 水 water Wednesday, 木 wood Thursday, 金 gold Friday, 土 earth Saturday, 日 sun Sunday.'],
      [undefined, 'The week is named for the sun, the moon and the five old elements.'],
    ]],
    ['zeni_counter', 'Zeni, coin counter', 9, 7, [
      ['一、二、三', 'One, two, three are just strokes. 四 four is read よん more than し, because し sounds like 死, death.'],
      ['九', 'Nine is usually きゅう, not く, which sounds like 苦, suffering. Numbers can be unlucky here.'],
    ]],
  ],
  market_street: [
    ['yasai_greengrocer', 'Yasai, greengrocer', 2, 5, [
      ['いくらですか', 'Ikura desu ka? How much? Prices are in 円, えん: 百円 is a hundred yen.'],
      ['いらっしゃいませ！', 'Every shop shouts irasshaimase when you walk in. You don\'t have to answer it; a nod is fine.'],
    ]],
    ['sakana_fishmonger', 'Sakana, fishmonger', 13, 5, [
      ['魚', 'Sakana: fish. See it? A head on top, a body, and the fins below. Kanji began as pictures.'],
      ['山 川 木', 'A mountain, a river, a tree. Squint and you can still see them.'],
    ]],
  ],
  teahouse: [
    ['amami_sweets', 'Amami, sweet maker', 14, 7, [
      ['おいしい！', 'Oishii: delicious. Say it about food someone made you; it is the best thank-you there is.'],
      [undefined, 'Our sweets follow the seasons: sakura in spring, chestnut in autumn. You eat the calendar.'],
    ]],
    ['matcha_apprentice', 'Matcha, tea apprentice', 2, 7, [
      ['どうぞ', 'Douzo: please, go ahead. Turn the bowl so its front faces away from you, then drink.'],
      ['口 と 目', 'Mouth and eye, 口 and 目: a tea master watches with one and tastes with the other.'],
    ]],
  ],
  castle_gardens: [
    ['niwa_gardener', 'Niwa, the gardener', 12, 8, [
      ['お花見', 'Ohanami: flower viewing. Every spring, picnics under the cherry trees.'],
      ['花 と 鼻', 'はな is a flower, 花, and a nose, 鼻. Kanji keep them apart.'],
    ]],
    ['koiko_keeper', 'Koiko, koi keeper', 4, 2, [
      ['大きい・小さい', 'Big and small. 大 is a person with arms spread wide: this big!'],
      ['こいのぼり', 'A carp that swims up a waterfall becomes a dragon, so families fly carp flags for their children in May.'],
    ]],
  ],
  castle_keep: [
    ['yoroi_armorer', 'Yoroi, armorer', 12, 7, [
      ['上・下', 'Up and down: うえ and した. The short stroke points the way.'],
      [undefined, 'Samurai armor was laced with silk cords: light enough to run and ride in.'],
    ]],
    ['mamoru_guard', 'Captain Mamoru', 2, 7, [
      ['右・左', 'Right, みぎ, and left, ひだり. Their first strokes are written in a different order. Tricky!'],
      ['城', 'Shiro: castle. 姫路城, Himeji Castle, is called the White Heron for its white walls.'],
    ]],
  ],
  shogun_hall: [
    ['fude_scribe', 'Fude, the shogun\'s scribe', 2, 5, [
      ['名前', 'Namae: name. Family name comes first: 田中ゆき is Yuki of the Tanaka family.'],
      ['さん', 'さん goes after other people\'s names, never your own. 先生 is for teachers and doctors.'],
    ]],
  ],

  // ── Arc 4: the Mountains (N4) ──────────────────────────────────────
  mountain_foothills: [
    ['ojii_grandpa', 'Grandpa Genzo', 17, 7, [
      ['父・母', 'My own father and mother are 父 ちち and 母 はは. Yours are お父さん and お母さん.'],
      [undefined, 'Humble words for your own family, polite ones for someone else\'s. That is Japanese manners.'],
    ]],
    ['haru_hiker', 'Haru, the hiker', 2, 2, [
      ['春夏秋冬', 'Spring, summer, autumn, winter: はる、なつ、あき、ふゆ.'],
      ['紅葉', 'Momiji: red autumn leaves. People travel to see them just like the spring blossoms.'],
    ]],
  ],
  mountain_village: [
    ['yu_onsen', 'Yu, onsen keeper', 10, 5, [
      ['温泉', 'Onsen: hot spring. Wash before you get in, and never let your towel touch the water.'],
      ['そば', 'Mountain soba noodles are slurped loudly. Here, that is polite: it shows they are good.'],
    ]],
    ['fuyuko_snow', 'Fuyuko, snow child', 12, 2, [
      ['雪', 'Yuki: snow. See the 雨 rain roof on top? 雲 cloud and 雷 thunder wear it too.'],
      ['雪だるま', 'A snowman! Ours have two balls, not three, like a little daruma doll.'],
    ]],
  ],
  monastery: [
    ['shin_novice', 'Shin, novice monk', 11, 4, [
      ['雨がふっています', '～ています is something going on now: it is raining. 待っています: I am waiting.'],
      ['精進料理', 'Shoujin ryouri: temple food, with no meat and no fish.'],
    ]],
    ['kane_bellringer', 'Kane, bell ringer', 8, 6, [
      ['除夜の鐘', 'On New Year\'s Eve, temple bells ring 108 times: once for each worldly desire.'],
      ['鐘 と お金', 'かね is a bell, 鐘, and おかね is money, お金. I ring one and never have the other.'],
    ]],
  ],
  waterfall_forest: [
    ['kinoko_picker', 'Kinoko, mushroom picker', 14, 7, [
      ['食べてもいいですか', '～てもいいですか: may I? May I eat this? ...Not that one!'],
      ['食べてはいけません', '～てはいけません: you must not. That mushroom is 食べてはいけません.'],
    ]],
    ['taki_ascetic', 'Taki, waterfall monk', 12, 2, [
      ['滝', 'Taki: waterfall. Monks stand under icy falls to train the mind: 滝行.'],
      ['氵', 'The three drops on the left mean water: 海 sea, 池 pond, 泳ぐ swim. All wet.'],
    ]],
  ],
  tengu_peaks: [
    ['karasu_messenger', 'Karasu, crow messenger', 4, 7, [
      ['天狗', 'Tengu: red-faced mountain spirits. Legend says they taught the boy Yoshitsune the sword.'],
      [undefined, '天 is heaven. Heaven, mountains, birds: tengu live where all three meet.'],
    ]],
    ['noboru_climber', 'Noboru, climber', 16, 7, [
      ['登ったことがあります', '～たことがあります: have done before. 富士山に登ったことがあります: I have climbed Fuji.'],
      ['こんにちは', 'On a mountain trail, greet everyone you pass. Strangers too.'],
    ]],
  ],
  tengu_summit: [
    ['sennin_hermit', 'Sennin, cloud hermit', 2, 5, [
      ['行かなければなりません', '～なければなりません: must. I must go. So long that people say 行かなきゃ.'],
      [undefined, 'A sennin is a mountain sage who lives on mist. I mostly live on rice crackers.'],
    ]],
  ],

  // ── Arc 5: the Rune Coast (N3) ─────────────────────────────────────
  rune_coast: [
    ['hilde_translator', 'Hilde, translator', 17, 5, [
      ['敬語', 'Keigo: polite language. です and ます are only the start; shops say ございます and いらっしゃいます.'],
      [undefined, 'Learn to hear keigo before you try to speak it. Everyone does.'],
    ]],
    ['tove_carver', 'Tove, driftwood carver', 2, 2, [
      ['雨が降りそう', '～そう: looks like. It looks like rain. おいしそう: that looks tasty!'],
      ['～そうです', 'But after a plain form, そうです means "I heard": 雨が降るそうです, they say it will rain.'],
    ]],
  ],
  glacier_pass: [
    ['frode_icecutter', 'Frode, ice cutter', 2, 2, [
      ['寒い・冷たい', 'さむい is cold weather; つめたい is cold to the touch. The wind is 寒い, the ice is 冷たい.'],
      ['暑い・熱い', 'Hot works the same way: a hot day is 暑い, hot soup is 熱い. Both あつい.'],
    ]],
    ['saga_herder', 'Saga, reindeer herder', 7, 3, [
      ['急げば間に合う', '～ば: if. If you hurry, you will make it in time.'],
      ['～たら', '～たら is "if" or "when" in everyday talk: 着いたら電話して, call me when you arrive.'],
    ]],
  ],
  dvergr_forge: [
    ['brokk_apprentice', 'Brokk, smith\'s apprentice', 8, 2, [
      ['日本刀', 'Nihontou: the Japanese sword. Hard steel for the edge, soft steel for the spine, so it cuts and does not snap.'],
      ['刀 と 刃', '刀 is a sword; 刃, a blade, is the sword with a mark on its edge.'],
    ]],
    ['eitri_bellows', 'Eitri, bellows keeper', 13, 6, [
      ['一生懸命', 'Isshoukenmei: with all your might. Said of work, study, sport, anything.'],
      ['頑張って！', 'Ganbatte: do your best! The most-heard cheer in Japan.'],
    ]],
  ],
  hall_of_valor: [
    ['torvald_veteran', 'Torvald, old veteran', 17, 6, [
      ['先生にほめられた', '～られる is the passive: I was praised by the teacher.'],
      ['雨に降られた', 'It also means trouble done to you: I got rained on. Japanese can be annoyed in grammar.'],
    ]],
    ['bragi_skald', 'Bragi, the skald', 12, 7, [
      ['猿も木から落ちる', 'Even monkeys fall from trees: even experts slip.'],
      ['出る杭は打たれる', 'The nail that sticks out gets hammered down. A proverb about fitting in, for better or worse.'],
    ]],
  ],
  runeforge_gate: [
    ['runhild_scholar', 'Runhild, rune scholar', 16, 7, [
      ['書くようにしています', '～ようにする: make a habit of. I make a point of writing kanji every day.'],
      ['読めるようになった', '～ようになる: come to be able. I became able to read it. That is you, now.'],
    ]],
    ['kaze_ronin', 'Kaze, wandering ronin', 15, 2, [
      ['合格するために', '～ために: in order to. I study in order to pass the exam.'],
      ['浪人', 'A ronin is a samurai with no master. Today it also means a student studying a year to retake the entrance exam.'],
    ]],
  ],
  runeforge_throne: [
    ['ord_runesmith', 'Ord, the last runesmith', 2, 5, [
      ['野菜を食べさせる', '～させる: make or let someone do. Make the children eat their vegetables.'],
      ['手伝わせてください', '～させてください: please let me. Let me help. The politest way to offer.'],
    ]],
  ],
};

/** Townsfolk for a map, as ordinary NPCs. */
export function townsfolkFor(mapId: string): NpcDef[] {
  return (F[mapId] ?? []).map(([id, name, x, y, lines, facing]) => ({
    id: `folk_${id}`,
    name,
    x,
    y,
    sprite: `folk:${id}`,
    facing: facing ?? 'down',
    dialogue: lines.map(([ja, text]): DialogueLine => ({ speaker: name, text, ...(ja ? { ja } : {}) })),
  }));
}

export const TOWNSFOLK_MAPS = Object.keys(F);
