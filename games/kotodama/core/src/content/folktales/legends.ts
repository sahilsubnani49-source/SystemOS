import { pg, tale, type TaleSite } from './types';

// Myths of the gods, legends of heroes, the great ghost plays of Edo, and the tales
// that travelled abroad in early English collections.

export const LEGEND_SITES: TaleSite[] = [
  // ── Myths of the gods ──────────────────────────────────────────────
  {
    host: 'dvergr_forge', scene: 'cave', place: 'The Slope to Yomi', placeJa: 'よもつひらさか',
    tale: tale('izanagi', 'Izanagi and Izanami in the Land of the Dead', 'いざなぎと いざなみ', [
      pg('いざなぎと いざなみの かみさまは、 にほんの しまじまと たくさんの かみを うみました。',
        'イザナギとイザナミの神様は、日本の島々とたくさんの神を生みました。',
        'The gods Izanagi and Izanami gave birth to the islands of Japan and many gods.'),
      pg('いざなみが なくなると、 いざなぎは しの くに、 よみへ むかえに いきました。',
        'イザナミが亡くなると、イザナギは死の国、黄泉へ迎えに行きました。',
        'When Izanami died, Izanagi went down to Yomi, the land of the dead, to bring her back.'),
      pg('「わたしを みないで。」 でも いざなぎは ひを ともして、 かわりはてた つまを みて しまいました。',
        '「私を見ないで。」でもイザナギは火を灯して、変わり果てた妻を見てしまいました。',
        '"Do not look at me," she said. But he lit a flame, and saw how death had changed her.'),
      pg('いざなぎは にげて、 おおきな いわで よみの いりぐちを ふさぎました。',
        'イザナギは逃げて、大きな岩で黄泉の入り口をふさぎました。',
        'He fled, and sealed the entrance to Yomi with a great boulder. Life and death were parted ever after.'),
    ]),
    heart: { name: 'The Sealing Stone', sprite: 'prop:boulder', lines: [
      ['よみ', 'Yomi: the land of the dead in Japan\'s oldest book, the Kojiki, written in 712.'],
      [undefined, 'Here too: "do not look", and someone looks. Japanese myths keep warning about that.'],
    ] },
    people: [
      { name: 'Izanagi', sprite: 'folk:noble:izanagi', lines: [
        ['みては いけなかった', 'Mite wa ikenakatta: I should not have looked. The past of ～てはいけない.'],
      ] },
    ],
  },
  {
    host: 'glacier_pass', scene: 'cave', place: 'The Heavenly Rock Cave', placeJa: 'あまのいわと',
    tale: tale('amaterasu', 'Amaterasu and the Heavenly Rock Cave', 'あまのいわと', [
      pg('たいようの かみ、 あまてらすは、 おとうとの すさのおの らんぼうに おこりました。',
        '太陽の神、アマテラスは、弟のスサノオの乱暴に怒りました。',
        'Amaterasu, goddess of the sun, was furious at the rampages of her brother Susanoo.'),
      pg('あまてらすが いわやに かくれると、 せかいは まっくらに なりました。',
        'アマテラスが岩屋に隠れると、世界は真っ暗になりました。',
        'She hid in a cave and shut the rock door, and the whole world went dark.'),
      pg('かみさまたちは そとで にわとりを なかせ、 うずめが おもしろい おどりを おどりました。 みんな おおわらいしました。',
        '神様たちは外で鶏を鳴かせ、ウズメが面白い踊りを踊りました。みんな大笑いしました。',
        'Outside, the gods set roosters crowing, and Uzume danced so wildly that everyone roared with laughter.'),
      pg('あまてらすが ふしぎに おもって いわを すこし あけると、 かがみに じぶんの ひかりが うつりました。 せかいに ひかりが もどりました。',
        'アマテラスが不思議に思って岩を少し開けると、鏡に自分の光が映りました。世界に光が戻りました。',
        'Curious, she opened the door a crack and saw her own light in a mirror. Light returned to the world.'),
    ]),
    heart: { name: 'The Rock Door', sprite: 'prop:boulder', lines: [
      ['まっくら', 'Makkura: pitch dark. ま before a word makes it extreme: まっしろ pure white, まっか bright red.'],
    ] },
    people: [
      { name: 'Ame-no-Uzume', sprite: 'folk:woman:uzume', lines: [
        ['わらう かどには ふく きたる', 'Laughter brings fortune through the gate. A proverb. I proved it by dancing on a tub.'],
      ] },
      { name: 'Eternal Rooster', sprite: 'prop:rooster', lines: [
        ['こけこっこー', 'Kokekokkoo! A Japanese rooster. We called the sun out of a cave, so shrines keep chickens to this day.'],
      ] },
      { name: 'The Sacred Mirror', sprite: 'prop:mirror', lines: [
        ['やたの かがみ', 'The Yata Mirror, one of the three imperial treasures. The sword from the eight-headed serpent is another.'],
      ] },
    ],
  },
  {
    host: 'pine_shore', scene: 'shore', place: 'Cape Keta', placeJa: 'けたの みさき',
    tale: tale('shirousagi', 'The White Hare of Inaba', 'いなばの しろうさぎ', [
      pg('しまに いた しろうさぎは、 うみを わたりたくて、 わにざめを だましました。 「なかまの かずを くらべよう。」',
        '島にいた白兎は、海を渡りたくて、ワニザメをだましました。「仲間の数を比べよう。」',
        'A white hare on an island wanted to cross the sea, so it tricked the sharks: "Let\'s count which family is bigger."'),
      pg('わにざめが ならぶと、 うさぎは せなかを ぴょんぴょん わたりました。 さいごに 「だまされたね」と いって しまいました。',
        'ワニザメが並ぶと、兎は背中をぴょんぴょん渡りました。最後に「だまされたね」と言ってしまいました。',
        'The sharks lined up and the hare hopped across their backs, but at the end it boasted, "You were fooled!"'),
      pg('おこった わにざめに けを むしられ、 うさぎは ないて いました。',
        '怒ったワニザメに毛をむしられ、兎は泣いていました。',
        'The angry sharks tore off its fur, and the hare sat weeping on the shore.'),
      pg('やさしい おおくにぬしの かみが、 みずで あらい、 がまの ほに ねる ように おしえて くれました。 うさぎは もとに もどりました。',
        '優しいオオクニヌシの神が、水で洗い、がまの穂に寝るように教えてくれました。兎は元に戻りました。',
        'The kind god Ōkuninushi told it to wash in fresh water and roll in cattail fluff, and its white fur grew back.'),
    ]),
    heart: { name: 'The White Hare', sprite: 'prop:hare', lines: [
      ['だまされたね', 'Damasareta ne: you got fooled! The passive again. I said it one shark too early.'],
    ] },
    people: [
      { name: 'Ōkuninushi', sprite: 'folk:noble:okuninushi', lines: [
        ['やさしさ', 'Yasashisa: kindness. ～さ turns an adjective into a noun: やさしい, kind, becomes kindness.'],
      ] },
      { name: 'Grumpy Shark', sprite: 'prop:shark', lines: [
        ['わに', 'Wani: in old Japanese a shark or sea monster. Today it means crocodile. Words drift like we do.'],
      ] },
    ],
  },
  {
    host: 'rune_coast', scene: 'shore', place: 'The Sea God\'s Gate', placeJa: 'わたつみの もん',
    tale: tale('yamasachi', 'Luck of the Sea, Luck of the Mountains', 'うみさち やまさち', [
      pg('あにの うみさちは りょうが、 おとうとの やまさちは かりが とくいでした。 ふたりは どうぐを とりかえました。',
        '兄の海幸は漁が、弟の山幸は狩りが得意でした。二人は道具を取り替えました。',
        'Elder brother Umisachi fished; younger brother Yamasachi hunted. One day they swapped tools.'),
      pg('やまさちは あにの つりばりを うみで なくして しまいました。 あには ゆるして くれません。',
        '山幸は兄の釣り針を海でなくしてしまいました。兄は許してくれません。',
        'Yamasachi lost his brother\'s fish hook in the sea, and his brother would not forgive him.'),
      pg('やまさちは うみの そこの わたつみの みやへ いき、 とよたまひめと けっこんしました。 たいの のどから はりが みつかりました。',
        '山幸は海の底の綿津見の宮へ行き、豊玉姫と結婚しました。鯛の喉から針が見つかりました。',
        'He went down to the Sea God\'s palace, married Princess Toyotama, and the hook was found in a sea bream\'s throat.'),
      pg('うみの かみは しおの みちひきを あやつる たまを くれました。 やまさちは それで あにと なかなおりしました。',
        '海の神は潮の満ち引きを操る玉をくれました。山幸はそれで兄と仲直りしました。',
        'The Sea God gave him two jewels that raise and lower the tide, and with them he made peace with his brother.'),
    ]),
    heart: { name: 'The Lost Fish Hook', sprite: 'prop:hook', lines: [
      ['つりばり', 'Tsuribari: fish hook. つり fishing, はり needle. A tiny thing that caused a big quarrel.'],
    ] },
    people: [
      { name: 'Yamasachi', sprite: 'folk:man:yamasachi', lines: [
        ['なかなおり', 'Nakanaori: making up after a fight. なか, the relationship, なおる, gets fixed.'],
      ] },
      { name: 'Princess Toyotama', sprite: 'folk:princess:toyotama', lines: [
        ['しお', 'Shio: the tide. Also salt. The sea gives both.'],
      ] },
    ],
  },
  {
    host: 'pine_shore', scene: 'shore', place: 'The Pine of Miho', placeJa: 'みほの まつ',
    tale: tale('hagoromo', 'Hagoromo, the Feather Robe', 'はごろも', [
      pg('みほの まつばらで、 りょうしが まつの えだに かかった うつくしい ころもを みつけました。',
        '三保の松原で、漁師が松の枝にかかった美しい衣を見つけました。',
        'On the pine beach of Miho, a fisherman found a beautiful robe hanging on a branch.'),
      pg('てんにょが あらわれて、 「それが ないと てんに かえれません」と なきました。',
        '天女が現れて、「それがないと天に帰れません」と泣きました。',
        'A heavenly maiden appeared, weeping: "Without it I cannot return to the sky."'),
      pg('りょうしは 「てんの まいを みせて くれたら かえします」と いいました。',
        '漁師は「天の舞を見せてくれたら返します」と言いました。',
        '"Show me a dance of heaven," said the fisherman, "and I will give it back."'),
      pg('てんにょは ころもを きて まい、 ふじさんの うえを とおって そらへ かえって いきました。',
        '天女は衣を着て舞い、富士山の上を通って空へ帰っていきました。',
        'She put on the robe and danced, rising over Mount Fuji, back into the sky.'),
    ]),
    heart: { name: 'The Feather Robe', sprite: 'prop:robe', lines: [
      ['はごろも', 'Hagoromo: a robe of feathers, lighter than air. The Noh play of this tale is still performed at Miho.'],
    ] },
    people: [
      { name: 'Hakuryō the Fisherman', sprite: 'folk:fisher:hakuryo', lines: [
        ['かえします', 'Kaeshimasu: I\'ll give it back. I nearly didn\'t. A heavenly dance was the better bargain.'],
      ] },
      { name: 'The Heavenly Maiden', sprite: 'folk:princess:tennyo', lines: [
        ['うたがいは にんげんに あり', '"Doubt is for humans; in heaven there are no lies." I danced first, and he trusted me.'],
      ] },
    ],
  },
  {
    host: 'castle_gardens', scene: 'field', place: 'The Wishing Bamboo', placeJa: 'たなばたの ささ',
    tale: tale('tanabata', 'Tanabata, the Weaver and the Cowherd', 'たなばた', [
      pg('そらの かみさまの むすめ、 おりひめは まいにち はたを おって いました。',
        '空の神様の娘、織姫は毎日機を織っていました。',
        'Orihime, daughter of the god of the sky, wove cloth every day.'),
      pg('おりひめは うしかいの ひこぼしと けっこんしました。 でも ふたりは あそんで ばかりで、 しごとを しなく なりました。',
        '織姫は牛飼いの彦星と結婚しました。でも二人は遊んでばかりで、仕事をしなくなりました。',
        'She married the cowherd Hikoboshi, but the two only played and stopped working.'),
      pg('おこった かみさまは、 あまのがわの りょうがわに ふたりを はなしました。',
        '怒った神様は、天の川の両側に二人を離しました。',
        'Angry, the god set them on opposite banks of the Milky Way, the River of Heaven.'),
      pg('いちねんに いちど、 しちがつ なのかだけ、 ふたりは あう ことが できます。',
        '一年に一度、七月七日だけ、二人は会うことができます。',
        'Only once a year, on the seventh day of the seventh month, can they meet.'),
    ]),
    heart: { name: 'The Wishing Bamboo', sprite: 'prop:wishbamboo', lines: [
      ['たんざく', 'Tanzaku: paper strips. On July 7 people write wishes on them and hang them on bamboo. Write yours!'],
    ] },
    people: [
      { name: 'Orihime', sprite: 'folk:princess:orihime', lines: [
        ['あいたい', 'Aitai: I want to see you. I am the star Vega. He is Altair. Look up in summer.'],
      ] },
      { name: 'Hikoboshi', sprite: 'folk:farmer:hikoboshi', lines: [
        ['あまのがわ', 'Amanogawa: the River of Heaven, the Milky Way. If it rains on Tanabata, magpies make a bridge for us.'],
      ] },
      { name: 'Hikoboshi\'s Ox', sprite: 'prop:cow', lines: [
        ['もう', 'Mou! Japanese cows say mou. Also a word for "already". The ox has been waiting a long time already.'],
      ] },
    ],
  },
  // ── Heroes ─────────────────────────────────────────────────────────
  {
    host: 'castle_gardens', scene: 'bridge', place: 'Gojō Bridge', placeJa: 'ごじょうおおはし',
    tale: tale('benkei', 'Benkei and Ushiwakamaru on Gojō Bridge', 'べんけいと うしわかまる', [
      pg('おおきな そうへい、 べんけいは、 せんぼんの かたなを あつめる ため、 ごじょうの はしで ぶしと たたかいました。',
        '大きな僧兵、弁慶は、千本の刀を集めるため、五条の橋で武士と戦いました。',
        'Benkei, a giant warrior-monk, stood on Gojō Bridge taking swords from passing warriors, aiming to collect a thousand.'),
      pg('きゅうひゃくきゅうじゅうきゅうほん あつまった よる、 ふえを ふく わかい うしわかまるが きました。',
        '九百九十九本集まった夜、笛を吹く若い牛若丸が来ました。',
        'On the night he had 999, young Ushiwakamaru came across, playing a flute.'),
      pg('うしわかまるは てんぐに ならった かるい うごきで、 らんかんの うえを ひらりひらりと とびました。',
        '牛若丸は天狗に習った軽い動きで、欄干の上をひらりひらりと飛びました。',
        'With the light moves the tengu had taught him, he leapt along the bridge rails, fluttering like a leaf.'),
      pg('まけた べんけいは けらいに なり、 さいごまで よしつねを まもりました。',
        '負けた弁慶は家来になり、最後まで義経を守りました。',
        'Beaten, Benkei became his loyal follower, and guarded Yoshitsune to his very last day.'),
    ]),
    heart: { name: 'Benkei', sprite: 'folk:monk:benkei', lines: [
      ['べんけいの なきどころ', 'Benkei no nakidokoro: Benkei\'s weeping spot. The shin! Even I cry if you kick me there.'],
      [undefined, 'They say I died standing, still guarding the gate. 弁慶の立ち往生.'],
    ] },
    people: [
      { name: 'Ushiwakamaru', sprite: 'folk:boy:ushiwaka_gojo', lines: [
        ['ひらり', 'Hirari: a light, nimble leap. The tengu of Kurama taught me. Read their tale on the mountain.'],
      ] },
      { name: 'Benkei\'s Last Sword', sprite: 'prop:sword', lines: [
        ['せんぼん', 'Senbon: a thousand long things. ほん counts long objects: pens, bottles, swords.'],
      ] },
    ],
  },
  {
    host: 'castle_keep', scene: 'palace', place: 'The Onmyōji\'s Residence', placeJa: 'せいめいの やしき',
    tale: tale('seimei', 'Abe no Seimei, the Court Magician', 'あべのせいめい', [
      pg('あべのせいめいは、 ほしを よみ、 みらいを うらなう おんみょうじでした。',
        '安倍晴明は、星を読み、未来を占う陰陽師でした。',
        'Abe no Seimei was an onmyōji, a court diviner who read the stars and foretold the future.'),
      pg('ある ひ、 ライバルの どうまんが うでくらべを しかけました。 はこの なかみを あてる しょうぶです。',
        'ある日、ライバルの道満が腕比べを仕掛けました。箱の中身を当てる勝負です。',
        'His rival Dōman challenged him to a contest: guess what was in a closed box.'),
      pg('どうまんは 「みかんが じゅうごこ」と いいました。 せいめいは じゅつで みかんを ねずみに かえ、 「ねずみが じゅうごひき」と いいました。',
        '道満は「みかんが十五個」と言いました。晴明は術でみかんをねずみに変え、「ねずみが十五匹」と言いました。',
        'Dōman said "fifteen tangerines". Seimei turned them into mice with a spell and said "fifteen mice".'),
      pg('はこを あけると、 ねずみが じゅうごひき とびだしました。 せいめいの かちでした。',
        '箱を開けると、ねずみが十五匹飛び出しました。晴明の勝ちでした。',
        'They opened the box, and out ran fifteen mice. Seimei won.'),
    ]),
    heart: { name: 'Abe no Seimei', sprite: 'folk:noble:seimei', lines: [
      ['こ と ひき', 'Notice the counters: みかん じゅうごこ (個, small things), ねずみ じゅうごひき (匹, small animals).'],
      [undefined, 'My crest is a five-pointed star. My mother, people say, was a fox from Shinoda forest.'],
    ] },
    people: [
      { name: 'Ashiya Dōman', sprite: 'folk:monk:doman', lines: [
        ['くやしい', 'Kuyashii: so frustrating! The word for losing when you know you were close.'],
      ] },
      { name: 'Shikigami', sprite: 'prop:paperdoll', lines: [
        ['しきがみ', 'Shikigami: a spirit servant, often a paper cut-out. I fetch Seimei\'s tea.'],
      ] },
    ],
  },
  {
    host: 'ninja_hideout', scene: 'mountain', place: 'The Toad Master\'s Crag', placeJa: 'がまの いわば',
    tale: tale('jiraiya', 'Jiraiya, the Toad Ninja', 'じらいや', [
      pg('じらいやは ぬすみを する けれど、 まずしい ひとを たすける ぎぞくでした。',
        '自来也は盗みをするけれど、貧しい人を助ける義賊でした。',
        'Jiraiya was a noble thief: he stole, but only to help the poor.'),
      pg('やまの せんにんから、 おおきな がまがえるを よびだす じゅつを ならいました。',
        '山の仙人から、大きながまがえるを呼び出す術を習いました。',
        'A mountain sage taught him the art of summoning a giant toad.'),
      pg('じらいやの ライバルは へびの じゅつを つかい、 なかまの つなでは なめくじの じゅつを つかいました。',
        '自来也のライバルは蛇の術を使い、仲間の綱手はなめくじの術を使いました。',
        'His rival used serpent magic, and his partner Tsunade used slug magic.'),
      pg('かえるは へびに、 へびは なめくじに、 なめくじは かえるに よわい。 さんすくみです。',
        '蛙は蛇に、蛇はなめくじに、なめくじは蛙に弱い。三すくみです。',
        'Frog fears snake, snake fears slug, slug fears frog: a three-way standoff, like rock-paper-scissors.'),
    ]),
    heart: { name: 'Gama, the Giant Toad', sprite: 'prop:toad', lines: [
      ['げろげろ', 'Gero gero! A big toad\'s croak. This tale gave its names to a very famous ninja comic.'],
    ] },
    people: [
      { name: 'Jiraiya', sprite: 'rogueninja', lines: [
        ['じらいや', 'Jiraiya: "I have come". I left those words on every wall I robbed.'],
      ] },
      { name: 'Tsunade', sprite: 'kunoichi', lines: [
        ['じゃんけん ぽん', 'Rock, paper, scissors: じゃんけんぽん! Toad, snake, slug is the old ninja version.'],
      ] },
    ],
  },
  {
    host: 'river_crossing', scene: 'bridge', place: 'Seta Bridge', placeJa: 'せたの からはし',
    tale: tale('tawara', 'My Lord Bag of Rice and the Giant Centipede', 'たわらとうだ', [
      pg('せたの はしに おおきな へびが ねて いて、 だれも わたれませんでした。 ふじわらの ひでさとは へいきで ふんで わたりました。',
        '瀬田の橋に大きな蛇が寝ていて、誰も渡れませんでした。藤原秀郷は平気で踏んで渡りました。',
        'A huge serpent lay across Seta Bridge and no one dared cross. Fujiwara no Hidesato simply stepped over it.'),
      pg('へびは りゅうおうの むすめでした。 「やまの むかでを たいじして ください。」',
        '蛇は竜王の娘でした。「山のむかでを退治してください。」',
        'The serpent was the Dragon King\'s daughter. "Please destroy the centipede of the mountain."'),
      pg('むかでは やまを ななまきも する おおきさでした。 ひでさとは つばを つけた やで むかでを いぬきました。',
        'むかでは山を七巻きもする大きさでした。秀郷はつばをつけた矢でむかでを射抜きました。',
        'The centipede was long enough to coil seven times round the mountain. Hidesato shot it with an arrow wet with his own spit, which centipedes cannot bear.'),
      pg('おれいに、 いくら つかっても なくならない こめの たわらを もらいました。 だから 「たわらとうだ」と よばれました。',
        'お礼に、いくら使ってもなくならない米の俵をもらいました。だから「俵藤太」と呼ばれました。',
        'His reward was a bag of rice that never ran out, and so he was called Tawara Tōda: My Lord Bag of Rice.'),
    ]),
    heart: { name: 'The Giant Centipede', sprite: 'prop:centipede', lines: [
      ['むかで', 'Mukade: centipede. Counted with 匹. This one would need a lot of shoes.'],
    ] },
    people: [
      { name: 'Hidesato', sprite: 'folk:warrior:hidesato', lines: [
        ['へいき', 'Heiki: unbothered, totally fine. へいきです is how you say "I\'m okay" when you mean it.'],
      ] },
      { name: 'Dragon Princess', sprite: 'folk:princess:ryujo', lines: [
        ['たわら', 'Tawara: a straw rice bale. His never empties. Kitchens dream of it.'],
      ] },
    ],
  },
  {
    host: 'tengu_summit', scene: 'mountain', place: 'The Paper Crane Peak', placeJa: 'かみの つるの みね',
    tale: tale('sentaro', 'Sentarō, the Man Who Did Not Wish to Die', 'しなない ねがいの せんたろう', [
      pg('せんたろうは しぬのが こわくて、 えいえんに いきる ほうほうを さがしました。',
        '仙太郎は死ぬのが怖くて、永遠に生きる方法を探しました。',
        'Sentarō was afraid of death and searched for a way to live forever.'),
      pg('せんにんは かみの つるを くれました。 つるに のって、 しなない ひとの くにへ いきました。',
        '仙人は紙の鶴をくれました。鶴に乗って、死なない人の国へ行きました。',
        'A sage gave him a paper crane. He rode it to the Land of Perpetual Life.'),
      pg('でも その くにの ひとは、 しにたくて どくを たべて いました。 たいくつ だったのです。',
        'でもその国の人は、死にたくて毒を食べていました。退屈だったのです。',
        'But the people there ate poison trying to die. Living forever had made them unbearably bored.'),
      pg('せんたろうは かえりたく なりました。 そして いまの いのちを たいせつに いきる ことに しました。',
        '仙太郎は帰りたくなりました。そして今の命を大切に生きることにしました。',
        'Sentarō longed to go home, and decided to treasure the life he had.'),
    ]),
    heart: { name: 'The Paper Crane', sprite: 'prop:papercrane', lines: [
      ['おりがみ', 'Origami: folded paper. おる, to fold, and かみ, paper. This crane flies, if you hold on tight.'],
    ] },
    people: [
      { name: 'Sentarō', sprite: 'folk:man:sentaro', lines: [
        ['いまを たいせつに', 'Ima wo taisetsu ni: treasure the now. It took a trip to the land of the undying to learn it.'],
      ] },
    ],
  },
  // ── Edo ghost stories and Hearn's tales ────────────────────────────
  {
    host: 'dvergr_forge', scene: 'night', place: 'Yotsuya Lane', placeJa: 'よつやの こみち',
    tale: tale('yotsuya', 'Oiwa, the Ghost of Yotsuya', 'よつやかいだん', [
      pg('おいわは ろうにんの いえもんと けっこんして いました。 でも いえもんは おかねもちの むすめと けっこんしたく なりました。',
        'お岩は浪人の伊右衛門と結婚していました。でも伊右衛門はお金持ちの娘と結婚したくなりました。',
        'Oiwa was married to a masterless samurai, Iemon, who wanted to marry a rich man\'s daughter instead.'),
      pg('いえもんの わるい たくらみで、 おいわは びょうきに なり、 かなしみの なかで なくなりました。',
        '伊右衛門の悪いたくらみで、お岩は病気になり、悲しみの中で亡くなりました。',
        'Through Iemon\'s cruel scheme, Oiwa fell ill and died in grief.'),
      pg('それから いえもんの まわりで、 ちょうちんや かべに おいわの かおが あらわれる ように なりました。',
        'それから伊右衛門の周りで、提灯や壁にお岩の顔が現れるようになりました。',
        'From then on, Oiwa\'s face appeared to Iemon in lanterns and on walls.'),
      pg('いまも この はなしを げきに する ときは、 やくしゃが おいわの じんじゃに おまいりします。',
        '今もこの話を劇にする時は、役者がお岩の神社にお参りします。',
        'Even today, actors visit Oiwa\'s shrine before staging the play, to ask her blessing.'),
    ]),
    heart: { name: 'Oiwa\'s Lantern', sprite: 'akari2', lines: [
      ['うらめしや', 'Urameshiya: "how bitter I am". The classic ghost greeting in kabuki. The lantern flickers.'],
    ] },
    people: [
      { name: 'Kabuki Actor Kikugorō', sprite: 'folk:man:kikugoro', lines: [
        ['かぶき', 'Kabuki: the theatre of Edo. Yotsuya Kaidan was first staged in 1825 and still fills houses every summer.'],
      ] },
    ],
  },
  {
    host: 'castle_keep', scene: 'night', place: 'The Dish Mansion Well', placeJa: 'さらやしきの いど',
    tale: tale('okiku', 'Okiku and the Dish Mansion', 'ばんちょうさらやしき', [
      pg('おきくは やしきで はたらいて いました。 やしきには じゅうまいの たいせつな おさらが ありました。',
        'お菊は屋敷で働いていました。屋敷には十枚の大切なお皿がありました。',
        'Okiku served in a samurai mansion that owned ten precious plates.'),
      pg('ある ひ、 いちまい なくなりました。 おきくは せめられて、 いどに おちて なくなりました。',
        'ある日、一枚なくなりました。お菊は責められて、井戸に落ちて亡くなりました。',
        'One went missing. Okiku was blamed, and she fell into the well and died.'),
      pg('よるに なると、 いどから こえが します。 「いちまい、 にまい、 さんまい……」',
        '夜になると、井戸から声がします。「一枚、二枚、三枚……」',
        'At night a voice rises from the well: "One plate, two plates, three plates..."'),
      pg('「きゅうまい。 いちまい たりない。」 ある おぼうさんが 「じゅう！」と いって あげると、 こえは やみました。',
        '「九枚。一枚足りない。」あるお坊さんが「十！」と言ってあげると、声はやみました。',
        '"...nine. One is missing." A priest once called out "Ten!" for her, and the voice was at peace.'),
    ]),
    heart: { name: 'The Old Well', sprite: 'prop:well', lines: [
      ['いちまい、 にまい', 'Ichimai, nimai: one, two (flat things). まい counts plates, paper, shirts and tickets.'],
    ] },
    people: [
      { name: 'Okiku', sprite: 'folk:ghost:okiku', lines: [
        ['たりない', 'Tarinai: not enough, one short. It was never my fault. Count them for me?'],
      ] },
      { name: 'Priest Ryōkai', sprite: 'folk:monk:ryokai', lines: [
        ['じゅう！', 'Juu! Ten! Sometimes the kindest thing is to finish someone\'s sentence for them.'],
      ] },
    ],
  },
  {
    host: 'castle_gardens', scene: 'night', place: 'The Peony Lantern Gate', placeJa: 'ぼたんどうろうの もん', weather: 'fireflies',
    tale: tale('botandoro', 'The Peony Lantern', 'ぼたんどうろう', [
      pg('おぼんの よる、 しんざぶろうの いえに、 ぼたんの とうろうを もった おつゆが たずねて きました。',
        'お盆の夜、新三郎の家に、牡丹の灯籠を持ったお露が訪ねてきました。',
        'On an Obon night, Otsuyu came to Shinzaburō\'s house carrying a peony lantern.'),
      pg('ふたりは まえから おもいあって いました。 まいばん からんころんと げたの おとが して、 おつゆが きました。',
        '二人は前から思い合っていました。毎晩カランコロンと下駄の音がして、お露が来ました。',
        'They had long loved each other. Every night came the clack of her wooden sandals, karan koron.'),
      pg('でも おつゆは もう なくなって いたのです。 となりの ひとが のぞくと、 しんざぶろうは ほねと はなして いました。',
        'でもお露はもう亡くなっていたのです。隣の人がのぞくと、新三郎は骨と話していました。',
        'But Otsuyu had already died. A neighbour peeked and saw him talking with bones.'),
      pg('おふだで いえを まもりましたが、 さいごに しんざぶろうは おつゆと いっしょに いく ことを えらびました。',
        'お札で家を守りましたが、最後に新三郎はお露と一緒に行くことを選びました。',
        'Charms guarded the house, but in the end Shinzaburō chose to go with her.'),
    ]),
    heart: { name: 'The Peony Lantern', sprite: 'prop:peonylantern', lines: [
      ['からん ころん', 'Karan koron: the sound of geta, wooden sandals, on stone. The scariest sound in Edo theatre.'],
      ['ぼたん', 'Botan: peony. Also button! A loanword from Portuguese. Context, always context.'],
    ] },
    people: [
      { name: 'Otsuyu', sprite: 'folk:ghost:otsuyu', lines: [
        ['まって いました', 'Matte imashita: I was waiting. ～ていました: was doing, for a long while.'],
      ] },
      { name: 'Shinzaburō', sprite: 'folk:man:shinzaburo', lines: [
        ['いっしょに いこう', 'Issho ni ikou: let\'s go together. The volitional form: いこう, let\'s go.'],
      ] },
    ],
  },
  {
    host: 'pine_shore', scene: 'temple', place: 'Amida-ji Temple', placeJa: 'あみだじ',
    tale: tale('hoichi', 'Hōichi the Earless', 'みみなしほういち', [
      pg('めの みえない ほういちは、 びわを ひいて へいけの ものがたりを うたう めいじんでした。',
        '目の見えない芳一は、琵琶を弾いて平家の物語を歌う名人でした。',
        'Blind Hōichi was a master of the biwa, singing the Tale of the Heike.'),
      pg('まいばん、 ぶしが きて、 ほういちを りっぱな やしきへ つれて いきました。 それは へいけの ぼうれいの はかばでした。',
        '毎晩、武士が来て、芳一を立派な屋敷へ連れて行きました。それは平家の亡霊の墓場でした。',
        'Each night a warrior led him to a grand hall to perform. It was really the graveyard of the Heike dead.'),
      pg('おしょうさんは ほういちの からだ じゅうに おきょうを かきました。 でも みみに かくのを わすれました。',
        'おしょうさんは芳一の体中にお経を書きました。でも耳に書くのを忘れました。',
        'The priest painted sutras all over Hōichi\'s body to hide him, but forgot his ears.'),
      pg('ぼうれいには みみだけが みえ、 みみを もって いって しまいました。 ほういちは いのちが たすかりました。',
        '亡霊には耳だけが見え、耳を持って行ってしまいました。芳一は命が助かりました。',
        'The ghost could see only his ears, and took them. Hōichi lost his ears, but kept his life.'),
    ]),
    heart: { name: 'Hōichi', sprite: 'folk:monk:hoichi', lines: [
      ['へいけ ものがたり', 'The Tale of the Heike: the war of the Taira and Minamoto, sung to the biwa for 800 years.'],
      [undefined, 'Don\'t answer when they call your name tonight. I learned that the hard way.'],
    ] },
    people: [
      { name: 'Priest of Amida-ji', sprite: 'abbot', lines: [
        ['わすれた', 'Wasureta: I forgot. The worst word in this story. Two little ears.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'mountain', place: 'The Mountain of Leaving', placeJa: 'うばすてやま',
    tale: tale('ubasute', 'The Mountain Where the Old Were Left', 'うばすてやま', [
      pg('むかし、 ある とのさまは 「としよりは やまに すてよ」と めいれいしました。',
        '昔、ある殿様は「年寄りは山に捨てよ」と命令しました。',
        'Long ago a lord ordered that the old be left on a mountain.'),
      pg('むすこは ははを せおって やまへ いきました。 ははは かえりみちが わかる ように えだを おって いました。 むすこの ために。',
        '息子は母を背負って山へ行きました。母は帰り道が分かるように枝を折っていました。息子のために。',
        'A son carried his mother up. On the way she snapped twigs to mark the path, so that HE could find his way home.'),
      pg('むすこは ははを すてられず、 こっそり いえに かくしました。',
        '息子は母を捨てられず、こっそり家に隠しました。',
        'He could not leave her, and secretly hid her at home.'),
      pg('となりの くにが むずかしい なぞを だした とき、 ははの ちえが くにを すくいました。 とのさまは めいれいを やめました。',
        '隣の国が難しいなぞを出した時、母の知恵が国を救いました。殿様は命令をやめました。',
        'When a neighbouring land posed impossible riddles, the mother\'s wisdom saved the realm, and the lord ended the order.'),
    ]),
    heart: { name: 'The Wise Mother', sprite: 'folk:oldwoman:ubasute', lines: [
      ['はいで なわを つくる', 'Make a rope out of ash: soak a straw rope in salt water and burn it whole. That riddle was mine.'],
      [undefined, 'In Japan, Respect for the Aged Day is a national holiday each September.'],
    ] },
    people: [
      { name: 'The Son', sprite: 'folk:farmer:ubasute_son', lines: [
        ['ちえ', 'Chie: wisdom. The lord wanted strong backs. He needed old heads.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'cave', place: 'The Deep Well of Tateshina', placeJa: 'たてしなの あな',
    tale: tale('koga', 'Kōga Saburō and the Land Below', 'こうがさぶろう', [
      pg('こうがさぶろうは、 いなくなった つまを さがして ふかい あなの そこへ おりました。',
        '甲賀三郎は、いなくなった妻を探して深い穴の底へ降りました。',
        'Kōga Saburō went down a deep pit searching for his lost wife.'),
      pg('きょうだいに なわを きられ、 さぶろうは ちかの くにを なんねんも さまよいました。',
        '兄弟に縄を切られ、三郎は地下の国を何年もさまよいました。',
        'His jealous brothers cut the rope, and Saburō wandered the underground lands for years.'),
      pg('やっと ちじょうに もどると、 じぶんの すがたが おおきな へびに なって いました。',
        'やっと地上に戻ると、自分の姿が大きな蛇になっていました。',
        'When at last he came back to the surface, he had become a great serpent.'),
      pg('ほとけさまの おしえで ひとの すがたに もどり、 すわこの かみに なった と いわれます。',
        '仏様の教えで人の姿に戻り、諏訪湖の神になったと言われます。',
        'Through the Buddha\'s teaching he regained his human form, and became, they say, the god of Lake Suwa.'),
    ]),
    heart: { name: 'The Endless Pit', sprite: 'prop:well', lines: [
      ['ふかい', 'Fukai: deep. The rope goes down further than the light. Someone cut it.'],
    ] },
    people: [
      { name: 'Kōga Saburō', sprite: 'folk:warrior:saburo', lines: [
        ['ちか', 'Chika: underground. ちかてつ, the subway, is literally "underground iron".'],
      ] },
    ],
  },
  {
    host: 'runeforge_gate', scene: 'house', place: 'The Mirror Room', placeJa: 'かがみの へや',
    tale: tale('matsuyama', 'The Mirror of Matsuyama', 'まつやまかがみ', [
      pg('みやこから かえった ちちは、 むすめに はじめて かがみを おみやげに くれました。',
        '都から帰った父は、娘に初めて鏡をお土産にくれました。',
        'Back from the capital, a father brought his daughter her first mirror as a gift.'),
      pg('ははは むすめに いいました。 「さびしい とき、 これを みて ごらん。 わたしが いるよ。」',
        '母は娘に言いました。「寂しい時、これを見てごらん。私がいるよ。」',
        'Her mother told her: "When you are lonely, look into this. I will be there."'),
      pg('ははが なくなった あと、 むすめは まいばん かがみを みて、 ははに はなしかけました。',
        '母が亡くなった後、娘は毎晩鏡を見て、母に話しかけました。',
        'After her mother died, the girl looked into the mirror every night and talked to her.'),
      pg('かがみの なかの かおは じぶんでした。 でも むすめが ははに にて きて いたので、 ははに みえたのです。',
        '鏡の中の顔は自分でした。でも娘が母に似てきていたので、母に見えたのです。',
        'The face was her own. But she had grown so like her mother that it was her mother she saw.'),
    ]),
    heart: { name: 'The Mirror', sprite: 'prop:mirror', lines: [
      ['にて いる', 'Nite iru: resembles. ははに にて いる: looks like her mother. ～ている for a lasting state.'],
    ] },
    people: [
      { name: 'The Daughter', sprite: 'folk:girl:matsuyama', lines: [
        ['おかあさん', 'Okaasan: Mother. I say it to the mirror and someone smiles back.'],
      ] },
      { name: 'The Father', sprite: 'folk:man:matsuyama_father', lines: [
        ['おみやげ', 'Omiyage: a souvenir gift from a trip. In Japan you never come home without one.'],
      ] },
    ],
  },
  {
    host: 'monastery', scene: 'temple', place: 'The Haunted Temple', placeJa: 'おばけでら',
    tale: tale('drewcats', 'The Boy Who Drew Cats', 'ねこを かいた こども', [
      pg('おてらの こどもは べんきょうより ねこの えを かくのが すきでした。 おしょうさんは こどもを てらから だしました。',
        'お寺の子どもは勉強より猫の絵を描くのが好きでした。おしょうさんは子どもを寺から出しました。',
        'A temple boy loved drawing cats more than studying, so the priest sent him away.'),
      pg('「よるは ひろい ところを さけ、 せまい ところに いなさい。」 それが さいごの ことばでした。',
        '「夜は広い所を避け、狭い所にいなさい。」それが最後の言葉でした。',
        '"At night, avoid large places. Keep to small ones." Those were the priest\'s parting words.'),
      pg('こどもは だれも いない おてらに とまり、 びょうぶに ねこの えを たくさん かいて、 ちいさな とだなで ねました。',
        '子どもは誰もいないお寺に泊まり、屏風に猫の絵をたくさん描いて、小さな戸棚で寝ました。',
        'He sheltered in an empty temple, covered the screens with cats, and slept in a small cupboard.'),
      pg('あさ、 おおきな ねずみの おばけが たおれて いました。 えの ねこたちの くちは あかく ぬれて いました。',
        '朝、大きなねずみのお化けが倒れていました。絵の猫たちの口は赤く濡れていました。',
        'In the morning, a monstrous goblin rat lay dead. The painted cats\' mouths were wet with red.'),
    ]),
    heart: { name: 'The Cat Screen', sprite: 'prop:catscroll', lines: [
      ['ねこ', 'Neko: cat. Painted cats, a hundred of them, all looking at the same corner.'],
    ] },
    people: [
      { name: 'The Boy Artist', sprite: 'folk:boy:sesshu', lines: [
        ['かくのが すき', 'Kaku no ga suki: I like drawing. の turns a verb into a thing you can like.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'night', place: 'Adachigahara Moor', placeJa: 'あだちがはら',
    tale: tale('kurozuka', 'The Hag of Adachigahara', 'くろづか', [
      pg('たびの おぼうさんが、 のはらの ひとつやに とめて もらいました。 やさしい おばあさんが いました。',
        '旅のお坊さんが、野原の一軒家に泊めてもらいました。優しいおばあさんがいました。',
        'A travelling priest found shelter in a lone hut on the moor, kept by a kindly old woman.'),
      pg('「たきぎを とって くる。 おくの へやは みないで ください。」',
        '「薪を取ってくる。奥の部屋は見ないでください。」',
        '"I am going for firewood. Do not look in the back room."'),
      pg('おぼうさんが のぞくと、 ほねが やまのように つんで ありました。 おばあさんは おにばばでした。',
        'お坊さんがのぞくと、骨が山のように積んでありました。おばあさんは鬼婆でした。',
        'He peeked, and found bones piled like a hill. The old woman was a demon hag.'),
      pg('おぼうさんは にげながら おきょうを となえ、 ほとけさまの ちからで おにばばを たおしました。',
        'お坊さんは逃げながらお経を唱え、仏様の力で鬼婆を倒しました。',
        'He fled chanting sutras, and by the Buddha\'s power the hag was defeated.'),
    ]),
    heart: { name: 'The Old Woman of the Moor', sprite: 'folk:oldwoman:kurozuka', lines: [
      ['ゆっくり やすんで', 'Yukkuri yasunde: rest well. ...Don\'t look in the back room, dear.'],
    ] },
    people: [
      { name: 'Priest Yūkei', sprite: 'folk:monk:yukei', lines: [
        ['また みては いけない へや', 'Another room I was told not to look in. In Japanese tales, you always look.'],
      ] },
    ],
  },
  {
    host: 'castle_keep', scene: 'palace', place: 'Nabeshima Castle', placeJa: 'なべしまじょう',
    tale: tale('nabeshima', 'The Vampire Cat of Nabeshima', 'なべしまの ばけねこ', [
      pg('とのさまが すきな おとよと いう ひとが、 おおきな ねこに おそわれました。',
        '殿様が好きなお豊という人が、大きな猫に襲われました。',
        'Otoyo, the lord\'s beloved, was attacked by a huge cat.'),
      pg('ねこは おとよの すがたに ばけて、 まいばん とのさまを くるしめました。',
        '猫はお豊の姿に化けて、毎晩殿様を苦しめました。',
        'Taking her form, the cat haunted the lord night after night, draining his strength.'),
      pg('みはりの けらいは みんな ねむって しまいます。 いとう そうだは ねむらない ように、 ひざに かたなを さしました。',
        '見張りの家来はみんな眠ってしまいます。伊藤惣太は眠らないように、膝に刀を刺しました。',
        'Every guard fell into a spell of sleep, until a soldier named Itō Sōda stayed awake by pricking his own knee.'),
      pg('そうだは ばけねこの しょうたいを みやぶり、 とのさまを たすけました。',
        '惣太は化け猫の正体を見破り、殿様を助けました。',
        'Sōda saw through the cat\'s disguise and saved the lord.'),
    ]),
    heart: { name: 'Bakeneko', sprite: 'mimi2', lines: [
      ['ばけねこ', 'Bakeneko: a shape-shifting cat. An old cat with a split tail becomes a nekomata. Meow.'],
    ] },
    people: [
      { name: 'Itō Sōda', sprite: 'gatecaptain', lines: [
        ['ねむい', 'Nemui: sleepy. Every guard felt it. I didn\'t let myself. The knee still hurts.'],
      ] },
    ],
  },
  {
    host: 'runeforge_gate', scene: 'night', place: 'The Cat\'s Dance Floor', placeJa: 'ねこの おどりば', weather: 'fireflies',
    tale: tale('bakeneko', 'The Cats\' Dance', 'ねこの おどり', [
      pg('ふるい いえの ねこが、 ある よる てぬぐいを あたまに かぶって でかけました。',
        '古い家の猫が、ある夜手ぬぐいを頭にかぶって出かけました。',
        'One night, an old house cat tied a hand towel on its head and slipped out.'),
      pg('のはらでは、 むらじゅうの ねこが にほんあしで たって おどって いました。',
        '野原では、村中の猫が二本足で立って踊っていました。',
        'In the field, every cat in the village stood on two legs, dancing.'),
      pg('のぞいた かいぬしに みつかると、 ねこは 「だれにも いわないで」と ひとの ことばで いいました。',
        'のぞいた飼い主に見つかると、猫は「誰にも言わないで」と人の言葉で言いました。',
        'Caught by its owner, the cat spoke in a human voice: "Please don\'t tell anyone."'),
      pg('かいぬしは やくそくを まもりました。 ねこは しあわせに ながく くらしました。',
        '飼い主は約束を守りました。猫は幸せに長く暮らしました。',
        'The owner kept the promise, and the cat lived happily for a long, long time.'),
    ]),
    heart: { name: 'Tama, the Dancing Cat', sprite: 'mimi1', lines: [
      ['にゃー', 'Nyaa! Japanese cats say nyaa. Old cats, they say, learn to talk. I am very old.'],
    ] },
    people: [
      { name: 'Tama\'s Owner', sprite: 'folk:oldwoman:tama', lines: [
        ['ないしょ', 'Naisho: a secret. ないしょ だよ: it\'s our secret. I never told. Until now. Oops.'],
      ] },
    ],
  },
  {
    host: 'longship_docks', scene: 'shore', place: 'Monkey Island Beach', placeJa: 'さるが しまの はま',
    tale: tale('kurage', 'The Jellyfish and the Monkey', 'くらげの ほねなし', [
      pg('りゅうおうの おきさきが びょうきに なりました。 「さるの いきぎもが くすりに なる。」',
        '竜王のお后が病気になりました。「猿の生き肝が薬になる。」',
        'The Dragon King\'s queen fell ill. "A live monkey\'s liver will cure her," said the doctor.'),
      pg('くらげは さるを だまして、 せなかに のせて うみの そこへ つれて いきました。',
        'くらげは猿をだまして、背中に乗せて海の底へ連れて行きました。',
        'The jellyfish tricked a monkey into riding on its back down to the palace.'),
      pg('とちゅうで くらげは ほんとうの ことを いって しまいました。 さるは 「いきぎもは きに ほして きた」と うそを つきました。',
        '途中でくらげは本当のことを言ってしまいました。猿は「生き肝は木に干してきた」と嘘をつきました。',
        'On the way the jellyfish blabbed. The quick monkey said, "Oh, I left my liver drying on a tree!"'),
      pg('さるは しまに もどって にげました。 くらげは ばつで ほねを ぬかれ、 いまの ふにゃふにゃの すがたに なりました。',
        '猿は島に戻って逃げました。くらげは罰で骨を抜かれ、今のふにゃふにゃの姿になりました。',
        'Back on land, the monkey ran. The jellyfish was punished by having its bones pulled out, and has been floppy ever since.'),
    ]),
    heart: { name: 'Boneless Kurage', sprite: 'prop:jellyfish', lines: [
      ['ふにゃふにゃ', 'Funya funya: floppy, limp. I used to have bones. And a big mouth.'],
    ] },
    people: [
      { name: 'Quick-Witted Monkey', sprite: 'prop:monkey', lines: [
        ['うそも ほうべん', 'Uso mo houben: even a lie can be a means. A proverb. I used one to keep my liver.'],
      ] },
      { name: 'The Dragon King', sprite: 'folk:noble:ryuo', lines: [
        ['くらげ', 'Kurage: jellyfish. 海月, "sea moon", is one way to write it. Pretty, for a blabbermouth.'],
      ] },
    ],
  },
  {
    host: 'rune_coast', scene: 'field', place: 'The Tanuki\'s Coin Field', placeJa: 'たぬきの こばん',
    tale: tale('tanukikane', 'The Badger\'s Money', 'たぬきの おかね', [
      pg('まずしい おじいさんが、 わなに かかった たぬきを たすけました。',
        '貧しいおじいさんが、罠にかかった狸を助けました。',
        'A poor old man freed a tanuki caught in a trap.'),
      pg('たぬきは おれいに、 きんかに ばけて 「わたしを うって ください」と いいました。',
        '狸はお礼に、金貨に化けて「私を売ってください」と言いました。',
        'To repay him, it turned itself into a gold coin and said, "Sell me!"'),
      pg('おじいさんは きんかで おこめを かいました。 よる、 きんかは たぬきに もどって にげて かえって きました。',
        'おじいさんは金貨でお米を買いました。夜、金貨は狸に戻って逃げて帰ってきました。',
        'He bought rice with it. That night the coin turned back into a tanuki and ran home.'),
      pg('でも おじいさんは 「ひとを だますのは よくない」と、 こめやに ほんとうの おかねを はらいに いきました。',
        'でもおじいさんは「人をだますのはよくない」と、米屋に本当のお金を払いに行きました。',
        'But the old man said, "Cheating people is wrong," and went back to pay the rice shop with real money.'),
    ]),
    heart: { name: 'Coin Tanuki', sprite: 'tanu0', lines: [
      ['こばん', 'Koban: an oval gold coin of old Japan. Lucky cats in shop windows hold one.'],
    ] },
    people: [
      { name: 'Honest Old Kanbei', sprite: 'folk:oldman:kanbei', lines: [
        ['しょうじき', 'Shoujiki: honest. しょうじきに いうと: to be honest. Even when a tanuki offers you a shortcut.'],
      ] },
    ],
  },
  {
    host: 'mountain_pass', scene: 'mountain', place: 'The Stonecutter\'s Quarry', placeJa: 'いしきりば',
    tale: tale('stonecutter', 'The Stonecutter', 'いしきり', [
      pg('いしきりは まいにち いわを きって いました。 おかねもちを みて 「おかねもちに なりたい」と ねがいました。',
        '石切りは毎日岩を切っていました。お金持ちを見て「お金持ちになりたい」と願いました。',
        'A stonecutter cut rock every day. Seeing a rich man, he wished, "I want to be rich."'),
      pg('ねがいは かないました。 でも たいようの ほうが つよいと しり、 たいように なりました。 くもが たいようを かくすと、 くもに なりました。',
        '願いはかないました。でも太陽の方が強いと知り、太陽になりました。雲が太陽を隠すと、雲になりました。',
        'His wish came true. Then he saw the sun was stronger and became the sun; when a cloud hid the sun, he became a cloud.'),
      pg('くもの あめにも うごかない いわを みて、 いわに なりました。',
        '雲の雨にも動かない岩を見て、岩になりました。',
        'A rock did not budge for any rain, so he became a rock.'),
      pg('すると、 だれかが いわを かつん かつんと きって いました。 いしきりでした。 かれは いしきりに もどりました。',
        'すると、誰かが岩をかつんかつんと切っていました。石切りでした。彼は石切りに戻りました。',
        'Then someone began chipping at the rock: a stonecutter. And he wished to be a stonecutter again, and was content.'),
    ]),
    heart: { name: 'The Unmoving Rock', sprite: 'prop:stone', lines: [
      ['かつん かつん', 'Katsun katsun: chisel on stone. Who is strongest? The answer was the one holding the chisel.'],
    ] },
    people: [
      { name: 'Hōmei the Stonecutter', sprite: 'folk:man:homei', lines: [
        ['なりたい', 'Naritai: I want to become. ～になりたい: the most common wish. I made it five times.'],
      ] },
    ],
  },
  {
    host: 'waterfall_forest', scene: 'forest', place: 'The Spring of Youth', placeJa: 'わかがえりの いずみ',
    tale: tale('wakagaeri', 'The Fountain of Youth', 'わかがえりの みず', [
      pg('やまで のどが かわいた おじいさんが、 いずみの みずを のみました。',
        '山でのどが渇いたおじいさんが、泉の水を飲みました。',
        'A thirsty old man drank from a spring in the mountains.'),
      pg('すると、 おじいさんは わかい おとこに もどりました。',
        'すると、おじいさんは若い男に戻りました。',
        'He turned back into a young man.'),
      pg('おどろいた おばあさんも いずみへ いきました。 でも なかなか かえって きません。',
        '驚いたおばあさんも泉へ行きました。でもなかなか帰ってきません。',
        'Amazed, his wife hurried to the spring too, but she did not come back.'),
      pg('さがしに いくと、 いずみの そばで あかちゃんが ないて いました。 おばあさんは のみすぎたのです。',
        '探しに行くと、泉のそばで赤ちゃんが泣いていました。おばあさんは飲みすぎたのです。',
        'He went looking, and found a baby crying by the spring. She had drunk too much.'),
    ]),
    heart: { name: 'The Spring', sprite: 'prop:spring', lines: [
      ['のみすぎ', 'Nomisugi: drinking too much. ～すぎる: too much. たべすぎ, overeating. Just one sip, traveller.'],
    ] },
    people: [
      { name: 'Young-Again Jinzō', sprite: 'folk:man:jinzo', lines: [
        ['わかい', 'Wakai: young. I was seventy this morning. Now I have to raise my wife.'],
      ] },
      { name: 'Baby Kiku', sprite: 'prop:baby', lines: [
        ['おぎゃー', 'Ogyaa! A Japanese baby\'s cry. ...She looks very annoyed for a baby.'],
      ] },
    ],
  },
  {
    host: 'teahouse', scene: 'house', place: 'The Willow Cottage', placeJa: 'やなぎの いえ',
    tale: tale('aoyagi', 'Aoyagi, the Green Willow', 'あおやぎ', [
      pg('わかい さむらいの ともただは、 ゆきの やまみちで ちいさな いえに とまりました。',
        '若い侍の友忠は、雪の山道で小さな家に泊まりました。',
        'Tomotada, a young samurai, sheltered at a cottage on a snowy mountain road.'),
      pg('その いえの むすめ、 あおやぎは しを よむ やさしい ひとでした。 ふたりは けっこんしました。',
        'その家の娘、青柳は詩を詠む優しい人でした。二人は結婚しました。',
        'The family\'s daughter, Aoyagi, was gentle and wrote poems. They married.'),
      pg('ある ひ、 あおやぎは 「いま、 わたしの きが きられて います」と いって たおれました。',
        'ある日、青柳は「今、私の木が切られています」と言って倒れました。',
        'One day Aoyagi cried, "Someone is cutting down my tree," and collapsed.'),
      pg('あおやぎは やなぎの きの せいでした。 ともただは おぼうさんに なり、 やなぎの きりかぶの そばで いのりました。',
        '青柳は柳の木の精でした。友忠はお坊さんになり、柳の切り株のそばで祈りました。',
        'She was the spirit of a willow. Tomotada became a monk and prayed beside its stump.'),
    ]),
    heart: { name: 'The Willow', sprite: 'prop:willow', lines: [
      ['やなぎ', 'Yanagi: willow. Japanese ghosts are often drawn under willows, but this one is only kind.'],
    ] },
    people: [
      { name: 'Tomotada', sprite: 'ronin', lines: [
        ['わすれない', 'Wasurenai: I won\'t forget. ～ない, the plain negative. I pray at her stump every spring.'],
      ] },
    ],
  },
  {
    host: 'glacier_pass', scene: 'night', place: 'The Maiden\'s Mound', placeJa: 'おとめづか', weather: 'fireflies',
    tale: tale('unai', 'The Maiden of Unai', 'うないおとめ', [
      pg('うないの むらに うつくしい おとめが いました。 ふたりの わかものが けっこんを もうしこみました。',
        '菟原の村に美しい乙女がいました。二人の若者が結婚を申し込みました。',
        'In the village of Unai lived a lovely maiden. Two young men asked to marry her.'),
      pg('ふたりは まったく おなじように つよく、 かしこく、 やさしかったのです。',
        '二人は全く同じように強く、賢く、優しかったのです。',
        'They were exactly equal: equally strong, wise and kind.'),
      pg('おとめは どちらも えらべず、 くるしんで なくなりました。 ふたりも あとを おいました。',
        '乙女はどちらも選べず、苦しんでなくなりました。二人も後を追いました。',
        'Unable to choose, she wasted away in sorrow and died, and both young men followed her.'),
      pg('むらびとは おとめの はかを まんなかに、 ふたりの はかを りょうがわに つくりました。',
        '村人は乙女の墓を真ん中に、二人の墓を両側に作りました。',
        'The villagers raised her grave in the middle, with one of theirs on either side.'),
    ]),
    heart: { name: 'The Maiden\'s Mound', sprite: 'prop:jizo', lines: [
      ['えらべない', 'Erabenai: can\'t choose. A thousand-year-old poem in the Man\'yōshū tells this tale.'],
    ] },
    people: [
      { name: 'Villager Kaya', sprite: 'folk:woman:kaya', lines: [
        ['りょうがわ', 'Ryougawa: both sides. One suitor east, one west, and she between them always.'],
      ] },
    ],
  },
  {
    host: 'hall_of_valor', scene: 'river', place: 'The Ogre\'s River', placeJa: 'おにの かわ',
    tale: tale('oniwarai', 'The Laughing Ogres', 'おにの わらい', [
      pg('はなよめが おにに さらわれ、 ははおやは さがしに でかけました。',
        '花嫁が鬼にさらわれ、母親は探しに出かけました。',
        'A bride was carried off by ogres, and her mother set out to find her.'),
      pg('あまさんが みちを おしえ、 ははは おにの やしきで むすめを みつけました。',
        '尼さんが道を教え、母は鬼の屋敷で娘を見つけました。',
        'A nun showed her the way, and she found her daughter in the ogres\' mansion.'),
      pg('ふたりは ふねで にげました。 おには かわの みずを ぜんぶ のんで、 ふねを ひきもどそうと しました。',
        '二人は舟で逃げました。鬼は川の水を全部飲んで、舟を引き戻そうとしました。',
        'They fled by boat. The ogres drank the whole river to drag the boat back.'),
      pg('あまさんと ふたりが へんな おどりを みせると、 おには おおわらいして みずを ぜんぶ はきだしました。',
        '尼さんと二人が変な踊りを見せると、鬼は大笑いして水を全部吐き出しました。',
        'The nun and the women did a silly dance, and the ogres laughed so hard the river came pouring back out.'),
    ]),
    heart: { name: 'Laughing Ogre', sprite: 'oni', lines: [
      ['わっはっは', 'Wahhahha! The Japanese belly laugh. Never make an ogre laugh with a river in its mouth.'],
    ] },
    people: [
      { name: 'The Brave Mother', sprite: 'folk:woman:haha', lines: [
        ['おかしい', 'Okashii: funny, or strange. The nun said: be ridiculous. So I was.'],
      ] },
      { name: 'The Nun', sprite: 'folk:monk:ama', lines: [
        ['わらいは ちから', 'Laughter is strength. Sometimes the bravest weapon is a silly dance.'],
      ] },
    ],
  },
  {
    host: 'hall_of_valor', scene: 'field', place: 'Thunder Field', placeJa: 'かみなりの のはら', weather: 'rain',
    tale: tale('raijin', 'Raijin and the Thunder Drums', 'かみなりさま', [
      pg('くもの うえに、 かみなりの かみ、 らいじんが すんで います。',
        '雲の上に、雷の神、雷神が住んでいます。',
        'Above the clouds lives Raijin, god of thunder.'),
      pg('らいじんは たいこを ごろごろ たたいて、 かみなりを おとします。',
        '雷神は太鼓をゴロゴロたたいて、雷を落とします。',
        'He beats his ring of drums, goro goro, and thunder falls.'),
      pg('らいじんは こどもの おへそが だいすきで、 とって いくと いいます。',
        '雷神は子どものおへそが大好きで、取っていくと言います。',
        'They say he loves children\'s belly buttons, and steals them.'),
      pg('だから かみなりが なると、 おやは 「おへそを かくしなさい」と いいます。',
        'だから雷が鳴ると、親は「おへそを隠しなさい」と言います。',
        'So when thunder rolls, Japanese parents still say, "Cover your belly button!"'),
    ]),
    heart: { name: 'Raijin\'s Drums', sprite: 'prop:drum', lines: [
      ['ごろごろ', 'Goro goro: thunder rumbling. Also a cat purring, and lazing around on the sofa. Busy word.'],
    ] },
    people: [
      { name: 'Raijin', sprite: 'oni', lines: [
        ['おへそ', 'Oheso: belly button. Hide yours. I am only joking. Mostly.'],
      ] },
      { name: 'Child Taichi', sprite: 'folk:boy:taichi', lines: [
        ['かくして！', 'Kakushite: hide it! I wear a belly band in storms. Grandma\'s orders.'],
      ] },
    ],
  },
  {
    host: 'glacier_pass', scene: 'mountain', place: 'The Wind God\'s Ledge', placeJa: 'かぜの かみの いわ',
    tale: tale('fujin', 'Fūjin and the Bag of Winds', 'ふうじん', [
      pg('かぜの かみ、 ふうじんは、 せなかに おおきな ふくろを かついで います。',
        '風の神、風神は、背中に大きな袋を担いでいます。',
        'Fūjin, god of the wind, carries a great bag over his shoulders.'),
      pg('ふくろの くちを すこし あけると、 そよかぜ。 おおきく あけると、 たいふうです。',
        '袋の口を少し開けると、そよ風。大きく開けると、台風です。',
        'Open the bag a little, and a breeze. Open it wide, and a typhoon.'),
      pg('ある とし、 もうこの ふねが せめて きた とき、 おおきな かぜが ふいて ふねを しずめました。',
        'ある年、蒙古の船が攻めてきた時、大きな風が吹いて船を沈めました。',
        'When Mongol fleets came to invade, great winds rose and sank their ships.'),
      pg('ひとびとは それを 「かみかぜ」、 かみさまの かぜと よびました。',
        '人々はそれを「神風」、神様の風と呼びました。',
        'People called it kamikaze: the wind of the gods.'),
    ]),
    heart: { name: 'The Bag of Winds', sprite: 'prop:windbag', lines: [
      ['そよかぜ', 'Soyokaze: a gentle breeze. たいふう: typhoon. The bag holds both. Don\'t untie it.'],
    ] },
    people: [
      { name: 'Fūjin', sprite: 'folk:warrior:fujin', lines: [
        ['ふうじん らいじん', 'Fūjin and Raijin: wind and thunder. We guard temple gates together, painted on gold screens.'],
      ] },
    ],
  },
  {
    host: 'rune_coast', scene: 'field', place: 'Sōgorō\'s Shrine', placeJa: 'そうごろうの じんじゃ',
    tale: tale('sogoro', 'Sakura Sōgorō, the Farmers\' Champion', 'さくら そうごろう', [
      pg('さくらの むらの のうみんは、 たかい ねんぐで くるしんで いました。',
        '佐倉の村の農民は、高い年貢で苦しんでいました。',
        'The farmers of Sakura were suffering under crushing rice taxes.'),
      pg('なぬしの そうごろうは、 むらの ために しょうぐんに ちょくせつ うったえました。',
        '名主の惣五郎は、村のために将軍に直接訴えました。',
        'The village head, Sōgorō, carried their plea straight to the shogun himself.'),
      pg('ねんぐは かるく なりましたが、 きまりを やぶった そうごろうは おもい ばつを うけました。',
        '年貢は軽くなりましたが、決まりを破った惣五郎は重い罰を受けました。',
        'The taxes were lowered, but for breaking the rules Sōgorō paid with his life.'),
      pg('むらびとは そうごろうを わすれず、 じんじゃを たてて いまも まつって います。',
        '村人は惣五郎を忘れず、神社を建てて今も祀っています。',
        'The villagers never forgot him. They built a shrine, and still honour him there today.'),
    ]),
    heart: { name: 'Sōgorō\'s Shrine Stone', sprite: 'prop:jizo', lines: [
      ['ぎせい', 'Gisei: sacrifice. He gave up everything so a village could eat.'],
    ] },
    people: [
      { name: 'Farmer\'s Granddaughter Sae', sprite: 'folk:girl:sae', lines: [
        ['おかげさまで', 'Okagesama de: thanks to you. Japanese say it even for help they can\'t see. We say it to him.'],
      ] },
    ],
  },
  {
    host: 'rune_coast', scene: 'shore', place: 'The Salt Mill Shore', placeJa: 'しおふきうすの はま',
    tale: tale('shiofuki', 'Why the Sea Is Salty', 'しおふきうす', [
      pg('まずしい おとうとは、 ふしぎな うすを もらいました。 まわすと ほしい ものが なんでも でて きます。',
        '貧しい弟は、不思議な臼をもらいました。回すと欲しい物が何でも出てきます。',
        'A poor younger brother was given a magic hand mill. Turn it, and out came whatever he wished.'),
      pg('よくばりな あには うすを ぬすんで、 ふねで うみに にげました。',
        '欲張りな兄は臼を盗んで、舟で海に逃げました。',
        'His greedy elder brother stole it and escaped out to sea in a boat.'),
      pg('ふねで あには 「しお でろ」と うすを まわしました。 でも とめかたを しりませんでした。',
        '舟で兄は「塩出ろ」と臼を回しました。でも止め方を知りませんでした。',
        'On the boat he turned it, crying "Salt, come out!" But he did not know how to stop it.'),
      pg('ふねは しおで しずみました。 うすは いまも うみの そこで まわって います。 だから うみは しょっぱいのです。',
        '舟は塩で沈みました。臼は今も海の底で回っています。だから海はしょっぱいのです。',
        'The boat sank under the salt. The mill still turns at the bottom of the sea, and that is why the sea is salty.'),
    ]),
    heart: { name: 'The Salt Mill', sprite: 'prop:mortar', lines: [
      ['しょっぱい', 'Shoppai: salty. Also slang for stingy, or disappointing. A disappointing brother, indeed.'],
    ] },
    people: [
      { name: 'The Younger Brother', sprite: 'folk:fisher:otouto', lines: [
        ['とめかた', 'Tomekata: how to stop it. ～かた after a verb stem is "the way of doing". He never asked.'],
      ] },
    ],
  },
  {
    host: 'frost_harbor', scene: 'shore', place: 'The Treasure Ship\'s Berth', placeJa: 'たからぶねの ふなつきば',
    tale: tale('shichifukujin', 'The Seven Gods of Fortune', 'しちふくじん', [
      pg('たからぶねに のって、 しちにんの ふくの かみさまが やって きます。',
        '宝船に乗って、七人の福の神様がやって来ます。',
        'On a treasure ship sail the Seven Gods of Fortune.'),
      pg('つりざおと たいを もつ えびす、 こづちを もつ だいこく、 びわを ひく べんてん。',
        '釣りざおと鯛を持つ恵比寿、小づちを持つ大黒、琵琶を弾く弁天。',
        'Ebisu with his rod and sea bream, Daikoku with his lucky mallet, Benten with her lute.'),
      pg('びしゃもんてん、 ほていさま、 ふくろくじゅ、 じゅろうじん。 みんな よい ことを はこびます。',
        '毘沙門天、布袋様、福禄寿、寿老人。みんな良いことを運びます。',
        'Bishamonten, Hotei, Fukurokuju and Jurōjin: each carries a different kind of good fortune.'),
      pg('おしょうがつに たからぶねの えを まくらの したに いれて ねると、 いい ゆめを みる そうです。',
        'お正月に宝船の絵を枕の下に入れて寝ると、いい夢を見るそうです。',
        'At New Year, put a picture of the treasure ship under your pillow, and they say you will have a lucky dream.'),
    ]),
    heart: { name: 'The Treasure Ship', sprite: 'prop:treasureship', lines: [
      ['たからぶね', 'Takarabune: the treasure ship. The best first dream of the year is Fuji, then a hawk, then an eggplant.'],
    ] },
    people: [
      { name: 'Ebisu', sprite: 'folk:fisher:ebisu', lines: [
        ['えびすがお', 'Ebisu-gao: an Ebisu face, a beaming smile. Fishermen and shopkeepers both pray to me.'],
      ] },
      { name: 'Hotei', sprite: 'folk:monk:hotei', lines: [
        ['ふくろ', 'Fukuro: a bag. Mine is full of good luck. Rub my belly for more.'],
      ] },
      { name: 'Benten', sprite: 'folk:princess:benten', lines: [
        ['べんてん', 'The only goddess of the seven. Music, words and water are mine. Study hard, little one.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'forest', place: 'The Long-Nose Glade', placeJa: 'てんぐの うちわの もり',
    tale: tale('uchiwa', 'The Tengu\'s Magic Fan', 'てんぐの うちわ', [
      pg('いたずらな わかものが、 てんぐを だまして ふしぎな うちわを てに いれました。',
        'いたずらな若者が、天狗をだまして不思議なうちわを手に入れました。',
        'A mischievous young man tricked a tengu out of its magic fan.'),
      pg('うちわの おもてで あおぐと はなが のび、 うらで あおぐと はなが ちぢみます。',
        'うちわの表であおぐと鼻が伸び、裏であおぐと鼻が縮みます。',
        'Fan with one side and a nose grows; fan with the other and it shrinks.'),
      pg('わかものは おかねもちの むすめの はなを のばして、 なおす ふりを して おかねを もらいました。',
        '若者はお金持ちの娘の鼻を伸ばして、治すふりをしてお金をもらいました。',
        'He lengthened a rich girl\'s nose, then "cured" it for a fee.'),
      pg('ある ひ、 じぶんの はなを のばしすぎて、 くもの うえまで とどき、 かみなりさまに ひっぱられて しまいました。',
        'ある日、自分の鼻を伸ばしすぎて、雲の上まで届き、雷様に引っ張られてしまいました。',
        'One day he stretched his own nose so far it reached the clouds, and the thunder god grabbed it and hauled him up.'),
    ]),
    heart: { name: 'The Nose Fan', sprite: 'prop:fan', lines: [
      ['おもて と うら', 'Omote and ura: front and back. Also the face you show and what\'s behind it. Useful word pair.'],
    ] },
    people: [
      { name: 'Prankster Gonta', sprite: 'folk:boy:gonta', lines: [
        ['のびすぎた', 'Nobisugita: it stretched too much. ～すぎる again. Never overdo a good trick.'],
      ] },
    ],
  },
];
