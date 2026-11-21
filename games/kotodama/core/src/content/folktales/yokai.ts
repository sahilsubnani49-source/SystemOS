import { pg, tale, type TaleSite } from './types';

// Yōkai: the strange folk of Japanese night. Retold to spook, never to shock.

export const YOKAI_SITES: TaleSite[] = [
  {
    host: 'mountain_village', scene: 'snow', place: 'The Ferryman\'s Hut', placeJa: 'わたしもりの こや', weather: 'snow',
    tale: tale('yukionna', 'Yuki-onna, the Snow Woman', 'ゆきおんな', [
      pg('ふぶきの よる、 きこりの みのきちは こやで ねて いました。 しろい きものの おんなが はいって きました。',
        '吹雪の夜、木こりの巳之吉は小屋で寝ていました。白い着物の女が入ってきました。',
        'On a blizzard night the woodcutter Minokichi slept in a hut. A woman in a white kimono came in.'),
      pg('おんなは 「きょうの ことを だれにも いっては いけない」と いって、 きえました。',
        '女は「今日のことを誰にも言ってはいけない」と言って、消えました。',
        '"Never tell anyone what you saw tonight," she said, and vanished.'),
      pg('なんねんも あと、 みのきちは おゆきと いう やさしい ひとと けっこんし、 こどもも うまれました。',
        '何年も後、巳之吉はお雪という優しい人と結婚し、子どもも生まれました。',
        'Years later Minokichi married a gentle woman named Oyuki, and they had children.'),
      pg('ある よる、 みのきちは ふぶきの よるの ことを はなして しまいました。 「それは わたしです。」 おゆきは ゆきに なって きえました。',
        'ある夜、巳之吉は吹雪の夜のことを話してしまいました。「それは私です。」お雪は雪になって消えました。',
        'One night he told her about the blizzard. "That was me," she said, and melted away into the snow.'),
    ]),
    heart: { name: 'Yuki-onna', sprite: 'yukionna0', lines: [
      ['いっては いけない', 'Itte wa ikenai: you must not tell. A promise to a yōkai is the only kind that cannot be broken.'],
      [undefined, 'The writer Lafcadio Hearn wrote my story down, in a book called Kwaidan: strange tales.'],
    ] },
    people: [
      { name: 'Minokichi', sprite: 'folk:man:minokichi', lines: [
        ['ゆき', 'Yuki: snow. Her name was お雪, Little Snow. I should have heard it.'],
        [undefined, 'I kept the promise for ten years, and broke it in one sentence.'],
      ] },
    ],
  },
  {
    host: 'waterfall_forest', scene: 'forest', place: 'The Wet Glade', placeJa: 'あめの もり', weather: 'rain',
    tale: tale('ameonna', 'Ame-onna, the Rain Woman', 'あめおんな', [
      pg('ある むらでは、 ひでりで こめが そだちませんでした。',
        'ある村では、日照りで米が育ちませんでした。',
        'In one village a drought had stopped the rice from growing.'),
      pg('ぬれた かみの おんなが むらに くると、 いつも あめが ふりはじめました。',
        '濡れた髪の女が村に来ると、いつも雨が降り始めました。',
        'Whenever a woman with dripping hair walked into the village, rain began to fall.'),
      pg('ひとびとは はじめ おんなを こわがりましたが、 たんぼは みどりに なりました。',
        '人々は初め女を怖がりましたが、田んぼは緑になりました。',
        'At first people were afraid of her, but the paddies turned green.'),
      pg('いまでも、 でかけると いつも あめが ふる ひとを 「あめおんな」 「あめおとこ」と よびます。',
        '今でも、出かけるといつも雨が降る人を「雨女」「雨男」と呼びます。',
        'Even now, someone who brings rain wherever they go is jokingly called an ame-onna or ame-otoko.'),
    ]),
    heart: { name: 'Ame-onna', sprite: 'folk:ghost:ameonna', lines: [
      ['あめが ふって います', 'Ame ga futte imasu: it is raining. It always is, near me. Farmers like me. Picnickers do not.'],
      [undefined, 'Ask a friend if they are 雨女. Every Japanese office has one.'],
    ] },
    people: [
      { name: 'Rice Farmer Ta', sprite: 'folk:farmer:ta', lines: [
        ['めぐみの あめ', 'Megumi no ame: a blessing of rain. Scary hair, kind weather.'],
      ] },
    ],
  },
  {
    host: 'castle_town', scene: 'street', place: 'Lantern Alley at Dusk', placeJa: 'ゆうぐれの ろじ',
    tale: tale('kuchisake', 'Kuchisake-onna, the Masked Woman', 'くちさけおんな', [
      pg('ゆうがた、 マスクを した せの たかい おんなが こどもに こえを かけます。 「わたし、 きれい？」',
        '夕方、マスクをした背の高い女が子どもに声をかけます。「わたし、きれい？」',
        'At dusk, a tall woman in a mask stops children in the street and asks: "Am I pretty?"'),
      pg('マスクを とると、 くちが みみまで さけて いる と いいます。',
        'マスクを取ると、口が耳まで裂けているといいます。',
        'When she lowers the mask, they say, her mouth is split from ear to ear.'),
      pg('こどもたちは にげる ほうほうを はなしあいました。 「ポマード」と みっかい いう。 あめを あげる。',
        '子どもたちは逃げる方法を話し合いました。「ポマード」と三回言う。飴をあげる。',
        'Children traded ways to escape: say "pomade" three times, or give her a sweet.'),
      pg('いちばん いいのは 「ふつう です」と こたえて、 そのあいだに にげる ことだ そうです。',
        '一番いいのは「普通です」と答えて、その間に逃げることだそうです。',
        'The best answer, it is said, is "You look average," and to run while she puzzles over it.'),
    ]),
    heart: { name: 'The Masked Woman', sprite: 'folk:ghost:kuchisake', lines: [
      ['わたし、 きれい？', 'Watashi, kirei? Am I pretty? ...Choose your words carefully, traveller.'],
      [undefined, 'This is a modern legend: it swept Japanese schools in 1979, and some towns sent teachers to walk children home.'],
    ] },
    people: [
      { name: 'Schoolboy Ken', sprite: 'folk:boy:ken', lines: [
        ['ふつう です', 'Futsuu desu: you look ordinary. That\'s the answer! Then you RUN.'],
      ] },
      { name: 'Candy Seller Ame', sprite: 'folk:merchant:ame', lines: [
        ['べっこうあめ', 'Bekkou-ame: amber sugar candy. They say she loves it. I sell a lot of it at dusk.'],
      ] },
    ],
  },
  {
    host: 'dvergr_forge', scene: 'night', place: 'The Peony Gate', placeJa: 'ぼたんの もん', weather: 'fireflies',
    tale: tale('honeonna', 'Hone-onna, the Bone Woman', 'ほねおんな', [
      pg('まいばん、 うつくしい おんなが ぼたんの ちょうちんを もって、 わかい おとこの いえに かよいました。',
        '毎晩、美しい女が牡丹の提灯を持って、若い男の家に通いました。',
        'Every night a beautiful woman carrying a peony lantern came to visit a young man.'),
      pg('となりの ひとが しょうじの すきまから のぞくと、 おとこと はなして いるのは ほねでした。',
        '隣の人が障子の隙間からのぞくと、男と話しているのは骨でした。',
        'A neighbour peeked through a gap in the paper door. The man was talking with a skeleton.'),
      pg('ほねおんなは あいする ひとに あいたくて、 しんでも かえって きたのです。',
        '骨女は愛する人に会いたくて、死んでも帰ってきたのです。',
        'The Bone Woman loved him so much that she came back even after death.'),
      pg('おぼうさんが おふだを はると、 おんなは もう はいれなく なりました。',
        'お坊さんがお札を貼ると、女はもう入れなくなりました。',
        'A priest pasted paper charms on the doors, and she could no longer come in.'),
    ]),
    heart: { name: 'Hone-onna', sprite: 'prop:skull', lines: [
      ['あいたい', 'Aitai: I want to see you. ～たい is wanting. I wanted it enough to walk back from the grave.'],
    ] },
    people: [
      { name: 'The Nosy Neighbour', sprite: 'folk:man:tomozo', lines: [
        ['のぞいて しまった', 'Nozoite shimatta: I went and peeked. ～てしまう: did it, and wish I hadn\'t.'],
      ] },
    ],
  },
  {
    host: 'waterfall_forest', scene: 'forest', place: 'Jōren Falls', placeJa: 'じょうれんの たき',
    tale: tale('jorogumo', 'Jorōgumo, the Spider of Jōren Falls', 'じょれんの たきの じょろうぐも', [
      pg('きこりが たきの そばで やすんで いると、 あしに ほそい いとが まきつきました。',
        '木こりが滝のそばで休んでいると、足に細い糸が巻き付きました。',
        'A woodcutter was resting by a waterfall when fine threads began winding around his ankle.'),
      pg('きこりは いとを そっと はずして、 そばの きの ねっこに まきつけました。',
        '木こりは糸をそっと外して、そばの木の根っこに巻き付けました。',
        'Quietly he slipped them off and wound them round the root of a nearby tree.'),
      pg('すると、 きの ねっこが ばりばりと ぬけて、 たきの なかへ ひきこまれました。',
        'すると、木の根っこがばりばりと抜けて、滝の中へ引き込まれました。',
        'With a crack the whole root tore loose and was dragged down into the falls.'),
      pg('たきには おおきな くもの ぬしが すんで いました。 いまも むらびとは たきに ちかづきません。',
        '滝には大きな蜘蛛の主が住んでいました。今も村人は滝に近づきません。',
        'A great spider was the master of those falls. The villagers still keep away from it.'),
    ]),
    heart: { name: 'The Falls\' Spider', sprite: 'prop:spider', lines: [
      ['くも', 'Kumo: spider. Also cloud, 雲, with a different pitch. Listen for which one the villagers mean.'],
      [undefined, 'A silver thread drifts toward your ankle. Perhaps you should not rest here.'],
    ] },
    people: [
      { name: 'Woodcutter Mosuke', sprite: 'folk:man:mosuke', lines: [
        ['あぶなかった！', 'Abunakatta: that was close! The past of あぶない, dangerous. That root could have been me.'],
      ] },
    ],
  },
  {
    host: 'teahouse', scene: 'inn', place: 'The Long-Night Inn', placeJa: 'ながよの やど',
    tale: tale('rokurokubi', 'Rokurokubi, the Long-Necked Woman', 'ろくろくび', [
      pg('たびの おぼうさんが やまの いえに とまりました。 いえの ひとたちは とても しんせつでした。',
        '旅のお坊さんが山の家に泊まりました。家の人たちはとても親切でした。',
        'A travelling monk stayed the night at a house in the hills. The family was very kind.'),
      pg('よなか、 おぼうさんが めを さますと、 くびが ながく のびて、 てんじょうを ゆらゆら して いました。',
        '夜中、お坊さんが目を覚ますと、首が長く伸びて、天井をゆらゆらしていました。',
        'At midnight he woke to see necks stretched long, heads swaying up by the ceiling.'),
      pg('くびは よる、 むしを たべに いき、 あさには もどります。 ひるまは ふつうの ひとです。',
        '首は夜、虫を食べに行き、朝には戻ります。昼間は普通の人です。',
        'At night the heads went out to eat insects and came back by morning. By day they were ordinary people.'),
      pg('おぼうさんは なにも いわずに あさごはんを たべて、 たびを つづけました。',
        'お坊さんは何も言わずに朝ご飯を食べて、旅を続けました。',
        'The monk said nothing, ate his breakfast politely, and went on his way.'),
    ]),
    heart: { name: 'Innkeeper Okubi', sprite: 'prop:longneck', lines: [
      ['ごゆっくり どうぞ', 'Goyukkuri douzo: please take your time and relax. I stretch my neck at night. Who doesn\'t?'],
    ] },
    people: [
      { name: 'Monk Kairyō', sprite: 'folk:monk:kairyo', lines: [
        ['みなかった ことに します', 'Minakatta koto ni shimasu: I\'ll pretend I didn\'t see. ～ことにする: to decide to.'],
        [undefined, 'Good manners got me through a house of rokurokubi. Breakfast was excellent.'],
      ] },
    ],
  },
  {
    host: 'runeforge_gate', scene: 'house', place: 'The Stingy Man\'s House', placeJa: 'けちな おとこの いえ',
    tale: tale('futakuchi', 'Futakuchi-onna, the Two-Mouthed Wife', 'ふたくちおんな', [
      pg('けちな おとこが、 ごはんを ほとんど たべない おくさんを もらいました。',
        'けちな男が、ご飯をほとんど食べない奥さんをもらいました。',
        'A stingy man married a woman who hardly ate a thing.'),
      pg('でも こめが どんどん へって いきます。 おとこは かくれて、 おくさんを みました。',
        'でも米がどんどん減っていきます。男は隠れて、奥さんを見ました。',
        'Yet the rice kept vanishing. So he hid and watched her.'),
      pg('おくさんの あたまの うしろに もう ひとつ くちが あり、 かみの けで おにぎりを たべて いました。',
        '奥さんの頭の後ろにもう一つ口があり、髪の毛でおにぎりを食べていました。',
        'At the back of her head was a second mouth, using her hair to feed itself rice balls.'),
      pg('たべものを けちる いえには、 ふたくちおんなが くる と いわれます。',
        '食べ物をけちる家には、二口女が来ると言われます。',
        'They say a two-mouthed woman comes to houses that are mean with food.'),
    ]),
    heart: { name: 'The Quiet Wife', sprite: 'folk:ghost:futakuchi', lines: [
      ['おなかが すいた', 'Onaka ga suita: I\'m hungry. Both of my mouths are. Feed a household properly.'],
    ] },
    people: [
      { name: 'Stingy Kichibei', sprite: 'folk:merchant:kichibei', lines: [
        ['けち', 'Kechi: stingy. I wanted a wife who ate nothing. Careful what you wish for.'],
      ] },
    ],
  },
  {
    host: 'frost_harbor', scene: 'shore', place: 'The Wet Rocks', placeJa: 'ぬれた いわば',
    tale: tale('nureonna', 'Nure-onna, the Woman of the Wet Rocks', 'ぬれおんな', [
      pg('うみべで、 ぬれた かみの おんなが あかちゃんを だいて たって いました。',
        '海辺で、濡れた髪の女が赤ちゃんを抱いて立っていました。',
        'On the shore stood a woman with dripping hair, holding a baby.'),
      pg('「すこし この こを だいて いて ください。」 りょうしが だくと、 あかちゃんは いしのように おもく なりました。',
        '「少しこの子を抱いていてください。」漁師が抱くと、赤ちゃんは石のように重くなりました。',
        '"Please hold my child a moment." When a fisherman did, the baby grew heavy as stone.'),
      pg('おんなの したは へびの からだでした。 りょうしは うごけません。',
        '女の下は蛇の体でした。漁師は動けません。',
        'Below the waist she had a serpent\'s body, and the fisherman could not move.'),
      pg('りょうしは かたなを ぬいて あかちゃんを はなし、 はしって にげました。',
        '漁師は刀を抜いて赤ちゃんを放し、走って逃げました。',
        'He managed to put the "baby" down and ran for his life.'),
    ]),
    heart: { name: 'Nure-onna', sprite: 'folk:ghost:nureonna', lines: [
      ['だいて いて ください', 'Daite ite kudasai: please keep holding it. ～ていてください asks someone to stay doing something.'],
    ] },
    people: [
      { name: 'Fisherman Isa', sprite: 'folk:fisher:isa', lines: [
        ['おもい！', 'Omoi: heavy! Never hold a stranger\'s baby on wet rocks at night. Fishermen learn that young.'],
      ] },
    ],
  },
  {
    host: 'river_crossing', scene: 'night', place: 'The Night Ford', placeJa: 'よるの わたし',
    tale: tale('ubume', 'Ubume, the Mother\'s Ghost', 'うぶめ', [
      pg('よる、 かわの そばで、 あかちゃんを だいた おんなが たって いました。',
        '夜、川のそばで、赤ちゃんを抱いた女が立っていました。',
        'At night a woman holding a baby stood beside the river.'),
      pg('「この こを だいて いて ください」と たのまれ、 さむらいは あかちゃんを だきました。 だんだん おもく なります。',
        '「この子を抱いていてください」と頼まれ、侍は赤ちゃんを抱きました。だんだん重くなります。',
        'Asked to hold the child, a samurai did, and it grew heavier and heavier.'),
      pg('さむらいは ねんぶつを となえながら、 あさまで ずっと だいて いました。',
        '侍は念仏を唱えながら、朝までずっと抱いていました。',
        'Chanting prayers, he held it all night long without letting go.'),
      pg('あさ、 おんなが もどって きて おれいを いい、 さむらいに つよい ちからを さずけました。',
        '朝、女が戻ってきてお礼を言い、侍に強い力を授けました。',
        'At dawn the mother returned, thanked him, and gave him great strength as her gift.'),
    ]),
    heart: { name: 'Ubume', sprite: 'folk:ghost:ubume', lines: [
      ['この こを おねがいします', 'Please take care of my child. おねがいします: the most useful request in Japanese.'],
      [undefined, 'Ubume were mothers who could not rest. Some candy shops tell of one who bought sweets for her baby every night.'],
    ] },
    people: [
      { name: 'Samurai Suetake', sprite: 'samurai', lines: [
        ['がまん', 'Gaman: enduring without complaint. I held on till sunrise. My arms remember.'],
      ] },
    ],
  },
  {
    host: 'castle_gardens', scene: 'bridge', place: 'Uji Bridge', placeJa: 'うじばし',
    tale: tale('hashihime', 'Hashihime, the Bridge Princess', 'はしひめ', [
      pg('うじがわの おおきな はしには、 はしひめと いう かみさまが いると いわれます。',
        '宇治川の大きな橋には、橋姫という神様がいると言われます。',
        'The great bridge over the Uji River is said to have a goddess of its own: Hashihime.'),
      pg('ある ひめは、 すきな ひとが ほかの ひとを あいした ことで、 かなしみと しっとで いっぱいに なりました。',
        'ある姫は、好きな人が他の人を愛したことで、悲しみと嫉妬でいっぱいになりました。',
        'One princess, when the man she loved loved another, was filled with grief and jealousy.'),
      pg('ひめは かわに いのり、 おにの すがたに なりました。',
        '姫は川に祈り、鬼の姿になりました。',
        'She prayed at the river, and became a demon.'),
      pg('いまは はしを まもる かみとして まつられて います。 はしの うえで ほかの はしを ほめては いけません。',
        '今は橋を守る神として祀られています。橋の上で他の橋をほめてはいけません。',
        'Now she is honoured as the bridge\'s guardian. Never praise another bridge while standing on hers.'),
    ]),
    heart: { name: 'Hashihime', sprite: 'folk:ghost:hashihime', lines: [
      ['はし', 'Hashi: bridge. Also chopsticks, 箸, and edge, 端. Same sounds, three words. Choose with care on my bridge.'],
    ] },
    people: [
      { name: 'Bridge Keeper Uji', sprite: 'folk:oldman:uji', lines: [
        ['しっと', 'Shitto: jealousy. The old poems call her lonely, waiting on a cold mat for someone who does not come.'],
      ] },
    ],
  },
  {
    host: 'monastery', scene: 'temple', place: 'Dōjō-ji Temple', placeJa: 'どうじょうじ',
    tale: tale('kiyohime', 'Kiyohime and the Bell of Dōjō-ji', 'きよひめ', [
      pg('きよひめは たびの おぼうさん、 あんちんを すきに なりました。 あんちんは 「また きます」と うそを ついて にげました。',
        '清姫は旅のお坊さん、安珍を好きになりました。安珍は「また来ます」と嘘をついて逃げました。',
        'Kiyohime fell in love with a travelling monk, Anchin. He promised to come back, and fled.'),
      pg('きよひめは おいかけて、 かわを わたる うちに おおきな へびに なりました。',
        '清姫は追いかけて、川を渡るうちに大きな蛇になりました。',
        'She chased him, and while swimming the river she turned into a great serpent.'),
      pg('あんちんは どうじょうじの かねの なかに かくれました。 へびは かねに まきつきました。',
        '安珍は道成寺の鐘の中に隠れました。蛇は鐘に巻き付きました。',
        'Anchin hid inside the great bell of Dōjō-ji. The serpent coiled around the bell.'),
      pg('かねは まっかに なりました。 うそと はげしい こころが、 ふたりを かなしい おわりに みちびきました。',
        '鐘は真っ赤になりました。嘘と激しい心が、二人を悲しい終わりに導きました。',
        'The bell glowed red. A lie and a burning heart led them both to a sad end.'),
    ]),
    heart: { name: 'The Bell of Dōjō-ji', sprite: 'prop:bell', lines: [
      ['かね', 'Kane: a temple bell. The bell in this story was never rehung, they say. Noh and kabuki still perform the tale.'],
    ] },
    people: [
      { name: 'Kiyohime', sprite: 'folk:princess:kiyohime', lines: [
        ['うそつき！', 'Usotsuki: liar! He said またきます, I\'ll come again. A promise is not a way to say goodbye.'],
      ] },
      { name: 'Monk Anchin', sprite: 'folk:monk:anchin', lines: [
        ['ほんとうの ことを いえば よかった', 'Hontou no koto wo ieba yokatta: I should have told the truth. ～ばよかった is regret.'],
      ] },
    ],
  },
  {
    host: 'castle_keep', scene: 'palace', place: 'The Emperor\'s Court', placeJa: 'みかどの ごてん',
    tale: tale('tamamo', 'Tamamo-no-Mae, the Nine-Tailed Fox', 'たまものまえ', [
      pg('みかどの そばに、 たまものまえと いう かしこくて うつくしい ひとが いました。',
        '帝のそばに、玉藻前という賢くて美しい人がいました。',
        'At the emperor\'s side was Tamamo-no-Mae, a lady both brilliant and beautiful.'),
      pg('でも みかどは だんだん びょうきに なって いきました。',
        'でも帝はだんだん病気になっていきました。',
        'But the emperor grew sicker and sicker.'),
      pg('おんみょうじが うらなうと、 たまもの かげに ここのつの しっぽが うつりました。 きゅうびの きつねでした。',
        '陰陽師が占うと、玉藻の影に九つのしっぽが映りました。九尾の狐でした。',
        'When a court diviner cast his spell, her shadow showed nine tails. She was a nine-tailed fox.'),
      pg('きつねは にげて、 さいごに いしに なりました。 その いしは 「せっしょうせき」と よばれて います。',
        '狐は逃げて、最後に石になりました。その石は「殺生石」と呼ばれています。',
        'The fox fled and at last became a stone, known as the Killing Stone. It cracked open in 2022, and people still talk about it.'),
    ]),
    heart: { name: 'Tamamo-no-Mae', sprite: 'kobi2', lines: [
      ['ここのつの しっぽ', 'Kokonotsu no shippo: nine tails. ここのつ is nine in the old counting: ひとつ、ふたつ、みっつ...'],
      [undefined, 'A fox gains a tail every hundred years. Do the arithmetic, little human.'],
    ] },
    people: [
      { name: 'Abe no Yasunari, diviner', sprite: 'folk:noble:yasunari', lines: [
        ['うらない', 'Uranai: fortune-telling. In my day the court had an office for it, the Onmyōryō.'],
      ] },
      { name: 'The Emperor', sprite: 'folk:noble:toba', lines: [
        ['ぐあいが わるい', 'Guai ga warui: I feel unwell. That is how you tell a doctor you are sick.'],
      ] },
    ],
  },
  {
    host: 'tengu_peaks', scene: 'cave', place: 'The Den on Mount Ōe', placeJa: 'おおえやまの すみか',
    tale: tale('shuten', 'Shuten-dōji, the Ogre King of Mount Ōe', 'しゅてんどうじ', [
      pg('おおえやまに、 おさけが だいすきな おにの おう、 しゅてんどうじが すんで いました。',
        '大江山に、お酒が大好きな鬼の王、酒呑童子が住んでいました。',
        'On Mount Ōe lived Shuten-dōji, an ogre king who loved sake above all things.'),
      pg('みやこの ひとを さらう おにを たいじする ため、 みなもとの らいこうと してんのうが やまぶしに ばけて やまへ のぼりました。',
        '都の人をさらう鬼を退治するため、源頼光と四天王が山伏に化けて山へ登りました。',
        'To stop the ogres stealing people from the capital, Minamoto no Raikō and his four great retainers climbed the mountain disguised as mountain monks.'),
      pg('らいこうは かみさまから もらった おさけを おにに のませました。 おにたちは ぐっすり ねむりました。',
        '頼光は神様からもらったお酒を鬼に飲ませました。鬼たちはぐっすり眠りました。',
        'Raikō offered the ogres sake given to him by the gods, and they fell fast asleep.'),
      pg('らいこうたちは おにを たいじし、 さらわれた ひとびとを つれて かえりました。',
        '頼光たちは鬼を退治し、さらわれた人々を連れて帰りました。',
        'Raikō\'s band defeated them and led the captives home.'),
    ]),
    heart: { name: 'Shuten-dōji', sprite: 'oni', lines: [
      ['かんぱい！', 'Kanpai: cheers! 酒呑, shuten, means sake-drinker. I should have refused the guests\' bottle.'],
    ] },
    people: [
      { name: 'Minamoto no Raikō', sprite: 'samurai', lines: [
        ['してんのう', 'Shitennou: the Four Heavenly Kings. Today Japanese call any famous foursome that.'],
      ] },
      { name: 'Sake Barrel', sprite: 'prop:barrel', lines: [
        ['おさけ', 'Osake: rice wine. Also the polite word for any alcohol. This barrel is for ogres only.'],
      ] },
    ],
  },
  {
    host: 'broken_gate', scene: 'night', place: 'Rashōmon Gate', placeJa: 'らしょうもん',
    tale: tale('ibaraki', 'Ibaraki-dōji, the Demon of Rashōmon', 'いばらきどうじ', [
      pg('みやこの みなみの らしょうもんに、 よる おにが でる と いう うわさが ありました。',
        '都の南の羅生門に、夜鬼が出るといううわさがありました。',
        'Rumour said a demon haunted Rashōmon, the great southern gate of the capital, at night.'),
      pg('ゆうかんな わたなべのつなが ひとりで もんへ いきました。 くらやみから おおきな てが のびて きました。',
        '勇敢な渡辺綱が一人で門へ行きました。暗闇から大きな手が伸びてきました。',
        'Brave Watanabe no Tsuna went alone. A huge hand reached out of the dark.'),
      pg('つなは かたなで その うでを きりおとしました。 おには にげて いきました。',
        '綱は刀でその腕を切り落としました。鬼は逃げていきました。',
        'Tsuna cut off the arm with his sword, and the demon fled.'),
      pg('なのかめ、 つなの おばが たずねて きて うでを みせてと いいました。 おばは おにに かわり、 うでを とって とんで いきました。',
        '七日目、綱のおばが訪ねてきて腕を見せてと言いました。おばは鬼に変わり、腕を取って飛んでいきました。',
        'On the seventh day his "aunt" visited and asked to see the arm. She turned into the demon, grabbed it, and flew away.'),
    ]),
    heart: { name: 'Ibaraki-dōji', sprite: 'oni', lines: [
      ['うでを かえせ', 'Ude wo kaese: give back my arm! The rough command form again. Ogres are bad at please.'],
    ] },
    people: [
      { name: 'Watanabe no Tsuna', sprite: 'samurai', lines: [
        ['ゆだん たいてき', 'Yudan taiteki: carelessness is the great enemy. I let my guard down for a visiting aunt.'],
      ] },
    ],
  },
  {
    host: 'waterfall_forest', scene: 'river', place: 'The River Hi', placeJa: 'ひのかわ',
    tale: tale('orochi', 'Yamata no Orochi, the Eight-Headed Serpent', 'やまたのおろち', [
      pg('いずもの くにに、 やっつの あたまと やっつの しっぽの おおへび、 やまたのおろちが いました。',
        '出雲の国に、八つの頭と八つのしっぽの大蛇、八岐大蛇がいました。',
        'In the land of Izumo lived Yamata no Orochi, a serpent with eight heads and eight tails.'),
      pg('かみさまの すさのおが、 なく ふうふと むすめの くしなだひめに あいました。',
        '神様のスサノオが、泣く夫婦と娘のクシナダヒメに会いました。',
        'The storm god Susanoo met a weeping old couple and their daughter, Princess Kushinada, the serpent\'s next victim.'),
      pg('すさのおは やっつの たるに つよい おさけを いれました。 おろちは ぜんぶ のんで ねむりました。',
        'スサノオは八つの樽に強いお酒を入れました。大蛇は全部飲んで眠りました。',
        'Susanoo filled eight barrels with strong sake. The serpent drank them all and fell asleep.'),
      pg('すさのおは おろちを たおし、 しっぽから けんを みつけました。 くさなぎの つるぎです。',
        'スサノオは大蛇を倒し、しっぽから剣を見つけました。草薙の剣です。',
        'Susanoo slew it and found a sword in its tail: Kusanagi, one of Japan\'s three sacred treasures.'),
    ]),
    heart: { name: 'Yamata no Orochi', sprite: 'prop:serpent', lines: [
      ['やっつ', 'Yattsu: eight. Eight heads, eight tails, and eight barrels of sake. 8 was the number for "very many".'],
    ] },
    people: [
      { name: 'Susanoo', sprite: 'folk:warrior:susanoo', lines: [
        ['やまたの おろち', 'I am the god of storms, thrown out of heaven for being rude. Fighting a serpent was my apology.'],
      ] },
      { name: 'Princess Kushinada', sprite: 'folk:princess:kushinada', lines: [
        ['たすけて', 'Tasukete: help me! Susanoo turned me into a comb and wore me in his hair during the fight. True story.'],
      ] },
      { name: 'Eight Barrels', sprite: 'prop:barrel', lines: [
        ['はちの たる', 'Eight barrels, all empty. Something with many mouths was very thirsty.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'cave', place: 'The Earth Spider\'s Cave', placeJa: 'つちぐもの ほらあな',
    tale: tale('tsuchigumo', 'Raikō and the Earth Spider', 'つちぐも', [
      pg('らいこうは ねつで ねこんで いました。 よる、 なぞの おぼうさんが きて、 いとを なげかけました。',
        '頼光は熱で寝込んでいました。夜、謎のお坊さんが来て、糸を投げかけました。',
        'Raikō lay ill with fever. One night a strange monk appeared and cast threads over him.'),
      pg('らいこうは めいとうで きりつけ、 おぼうさんは ちを たらして にげました。',
        '頼光は名刀で切りつけ、お坊さんは血をたらして逃げました。',
        'Raikō slashed at him with his famous sword, and the monk fled, leaving a trail.'),
      pg('あとを たどると、 やまの ほらあなに おおきな つちぐもが いました。',
        '跡をたどると、山の洞穴に大きな土蜘蛛がいました。',
        'They followed it to a mountain cave, where a giant earth spider lurked.'),
      pg('つちぐもを たおすと、 らいこうの ねつは さがりました。 かたなは 「くもきり」と よばれました。',
        '土蜘蛛を倒すと、頼光の熱は下がりました。刀は「蜘蛛切」と呼ばれました。',
        'When the spider fell, Raikō\'s fever broke. His sword was renamed Kumokiri: Spider-Cutter.'),
    ]),
    heart: { name: 'Tsuchigumo', sprite: 'prop:bigspider', lines: [
      ['つち', 'Tsuchi: earth. つちぐも, earth spider: a giant that weaves its nets in caves.'],
    ] },
    people: [
      { name: 'Raikō\'s Retainer Tsuna', sprite: 'gatecaptain', lines: [
        ['ねつが さがった', 'Netsu ga sagatta: the fever went down. ねつ, fever, is a word you need when travelling.'],
      ] },
    ],
  },
  {
    host: 'shogun_hall', scene: 'palace', place: 'The Seiryōden Roof', placeJa: 'せいりょうでんの やね',
    tale: tale('nue', 'The Nue of the Imperial Palace', 'ぬえ', [
      pg('まいばん、 ごしょの うえに くろい くもが きて、 きみの わるい なきごえが しました。',
        '毎晩、御所の上に黒い雲が来て、気味の悪い鳴き声がしました。',
        'Every night a black cloud settled over the palace, and an eerie cry rang out.'),
      pg('みかどは びょうきに なりました。 ゆみの めいじん、 みなもとの よりまさが よばれました。',
        '帝は病気になりました。弓の名人、源頼政が呼ばれました。',
        'The emperor fell ill. Minamoto no Yorimasa, a master archer, was summoned.'),
      pg('よりまさが くもに やを いると、 なにかが おちて きました。',
        '頼政が雲に矢を射ると、何かが落ちてきました。',
        'Yorimasa shot an arrow into the cloud, and something fell.'),
      pg('かおは さる、 からだは たぬき、 あしは とら、 しっぽは へび。 それが ぬえでした。',
        '顔は猿、体は狸、足は虎、しっぽは蛇。それが鵺でした。',
        'A monkey\'s face, a tanuki\'s body, a tiger\'s legs and a snake for a tail. That was the nue.'),
    ]),
    heart: { name: 'The Nue', sprite: 'nue0', lines: [
      ['ひょう ひょう', 'Hyou, hyou: my cry. Today ぬえ-like means something nobody can pin down.'],
    ] },
    people: [
      { name: 'Minamoto no Yorimasa', sprite: 'folk:warrior:yorimasa', lines: [
        ['いっぱつで', 'Ippatsu de: in one shot. I had two arrows ready, and needed one.'],
      ] },
    ],
  },
  {
    host: 'broken_gate', scene: 'night', place: 'The Old Battlefield', placeJa: 'ふるい いくさば',
    tale: tale('gashadokuro', 'Gashadokuro, the Giant Skeleton', 'がしゃどくろ', [
      pg('いくさで なくなった おおくの ひとが、 だれにも とむらわれずに のはらに ねむって いました。',
        '戦で亡くなった多くの人が、誰にも弔われずに野原に眠っていました。',
        'Many who died in old wars lay in the fields, with no one to mourn them.'),
      pg('その さびしさが あつまって、 やまより おおきな がいこつに なりました。',
        'その寂しさが集まって、山より大きながい骨になりました。',
        'Their loneliness gathered into a skeleton taller than the hills.'),
      pg('よなか、 がちゃ がちゃと ほねの おとを たてて あるきます。',
        '夜中、がちゃがちゃと骨の音を立てて歩きます。',
        'At midnight it walks, its bones clattering: gasha, gasha.'),
      pg('おまいりを して、 なくなった ひとを わすれない ことが、 いちばんの まもりです。',
        'お参りをして、亡くなった人を忘れないことが、一番の守りです。',
        'The best protection is to pray for the dead, and never forget them.'),
    ]),
    heart: { name: 'Gashadokuro', sprite: 'prop:skull', lines: [
      ['がしゃ がしゃ', 'Gasha, gasha. The sound of many bones. I am made of everyone nobody remembered.'],
      [undefined, 'Obon in August is when families welcome back their dead. Lanterns light the way home.'],
    ] },
    people: [
      { name: 'Grave Keeper Haka', sprite: 'folk:monk:haka', lines: [
        ['わすれないで', 'Wasurenaide: don\'t forget. ～ないで, without doing, or as a request: please don\'t.'],
      ] },
    ],
  },
  {
    host: 'longship_docks', scene: 'shore', place: 'The Calm Before the Storm', placeJa: 'あらしの まえ', weather: 'rain',
    tale: tale('umibozu', 'Umibōzu, the Sea Monk', 'うみぼうず', [
      pg('しずかな うみが きゅうに あれて、 くろい おおきな あたまが みずから でて きました。',
        '静かな海が急に荒れて、黒い大きな頭が水から出てきました。',
        'The calm sea suddenly heaved, and a vast black head rose from the water.'),
      pg('うみぼうずは 「ひしゃくを くれ」と いいました。',
        '海坊主は「ひしゃくをくれ」と言いました。',
        '"Give me a ladle," said the Sea Monk.'),
      pg('ひしゃくを わたすと、 うみぼうずは みずを くんで ふねに いれ、 しずめて しまいます。',
        'ひしゃくを渡すと、海坊主は水をくんで船に入れ、沈めてしまいます。',
        'Hand one over, and it bails sea water into your boat until it sinks.'),
      pg('かしこい せんちょうは、 そこの ない ひしゃくを わたしました。 うみぼうずは みずを くめず、 きえて いきました。',
        '賢い船長は、底のないひしゃくを渡しました。海坊主は水をくめず、消えていきました。',
        'A clever captain handed over a ladle with no bottom. The Sea Monk scooped and scooped, and gave up.'),
    ]),
    heart: { name: 'Umibōzu', sprite: 'wadachi2', lines: [
      ['ひしゃくを くれ', 'Hishaku wo kure: give me a ladle. くれ is the blunt form of ください, used to ask for a thing.'],
    ] },
    people: [
      { name: 'Captain Kaji', sprite: 'folk:fisher:kaji', lines: [
        ['そこの ない ひしゃく', 'A ladle with no bottom. Every sensible boat once carried one. Mine still does.'],
      ] },
      { name: 'The Bottomless Ladle', sprite: 'prop:ladle', lines: [
        ['ひしゃく', 'Hishaku: a ladle. You also use one at shrine fountains to wash your hands before praying.'],
      ] },
    ],
  },
  {
    host: 'tengu_peaks', scene: 'mountain', place: 'Kurama\'s Tengu Hollow', placeJa: 'くらまの てんぐだに',
    tale: tale('tengu', 'The Tengu of Mount Kurama', 'くらまの てんぐ', [
      pg('くらまやまの おくに、 はなの たかい てんぐが すんで いました。',
        '鞍馬山の奥に、鼻の高い天狗が住んでいました。',
        'Deep on Mount Kurama lived a long-nosed tengu.'),
      pg('てらに あずけられた うしわかまると いう おとこのこが、 よる こっそり やまに きました。',
        '寺に預けられた牛若丸という男の子が、夜こっそり山に来ました。',
        'A boy named Ushiwakamaru, left at the temple, crept up the mountain at night.'),
      pg('てんぐは うしわかまるに けんと かるい みのこなしを おしえました。',
        '天狗は牛若丸に剣と軽い身のこなしを教えました。',
        'The tengu taught him the sword, and how to move lightly as a bird.'),
      pg('うしわかまるは のちに みなもとの よしつねと いう ゆうめいな ぶしに なりました。',
        '牛若丸は後に源義経という有名な武士になりました。',
        'Ushiwakamaru grew up to be Minamoto no Yoshitsune, one of Japan\'s most famous warriors.'),
    ]),
    heart: { name: 'Sōjōbō, Tengu King of Kurama', sprite: 'nekaze2', lines: [
      ['はなが たかい', 'Hana ga takai: a high nose. In Japanese it means proud. We tengu earned ours.'],
    ] },
    people: [
      { name: 'Young Ushiwaka', sprite: 'folk:boy:ushiwaka', lines: [
        ['しゅぎょう', 'Shugyou: training. Every night, sword practice with the tengu. Every morning, sutras with the monks.'],
      ] },
      { name: 'Feather Fan', sprite: 'prop:fan', lines: [
        ['うちわ', 'Uchiwa: a fan. A tengu\'s feather fan can raise a storm with one wave.'],
      ] },
    ],
  },
  {
    host: 'moon_shrine', scene: 'shrine', place: 'Shinoda Forest Shrine', placeJa: 'しのだの もり',
    tale: tale('kuzunoha', 'Kuzunoha, the Fox Wife', 'くずのは', [
      pg('やすなと いう わかものが、 かりの ひとに おわれた しろい きつねを たすけました。',
        '保名という若者が、狩りの人に追われた白い狐を助けました。',
        'A young man named Yasuna saved a white fox from hunters.'),
      pg('のちに くずのはと いう やさしい おんなの ひとと けっこんし、 おとこのこが うまれました。',
        '後に葛の葉という優しい女の人と結婚し、男の子が生まれました。',
        'Later he married a gentle woman called Kuzunoha, and they had a son.'),
      pg('ある ひ、 こどもは ははの かげに きつねの しっぽを みました。 くずのはは あの きつねでした。',
        'ある日、子どもは母の影に狐のしっぽを見ました。葛の葉はあの狐でした。',
        'One day the boy saw a fox\'s tail in his mother\'s shadow. Kuzunoha was the fox he had saved.'),
      pg('くずのはは うたを のこして もりへ かえりました。 その こどもが、 のちの あべのせいめいです。',
        '葛の葉は歌を残して森へ帰りました。その子どもが、後の安倍晴明です。',
        'She left a poem and returned to the forest. Her son grew up to be Abe no Seimei, the great court magician.'),
    ]),
    heart: { name: 'Kuzunoha', sprite: 'kobi1', lines: [
      ['こいしくば たずね きて みよ', '"If you miss me, come and seek me in Shinoda forest." My farewell poem, written on a paper screen.'],
      [undefined, 'Inari shrines keep fox statues at the gate. We are messengers of the rice god.'],
    ] },
    people: [
      { name: 'Abe no Yasuna', sprite: 'folk:noble:yasuna', lines: [
        ['きつね', 'Kitsune: fox. In Japan foxes can be tricksters, messengers of the gods, or wives.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'shrine', place: 'Mitsuke Shrine', placeJa: 'みつけの じんじゃ',
    tale: tale('shippeitaro', 'Shippei-tarō, the Brave Dog Spirit', 'しっぺいたろう', [
      pg('ある むらでは、 まいとし むすめを ひとり やまの かみに ささげなければ なりませんでした。',
        'ある村では、毎年娘を一人山の神に捧げなければなりませんでした。',
        'In one village, each year a girl had to be given to the "mountain god".'),
      pg('たびの おぼうさんが よる しらべると、 かいぶつたちが 「しっぺいたろうには しらせるな」と うたって いました。',
        '旅のお坊さんが夜調べると、怪物たちが「しっぺい太郎には知らせるな」と歌っていました。',
        'A wandering monk watched at night and heard monsters singing: "Don\'t let Shippei-tarō find out!"'),
      pg('しっぺいたろうは となりまちの つよい いぬでした。 おぼうさんは いぬを かりて きました。',
        'しっぺい太郎は隣町の強い犬でした。お坊さんは犬を借りてきました。',
        'Shippei-tarō turned out to be a mighty dog in the next town. The monk borrowed him.'),
      pg('いぬは かごに かくれて やまへ いき、 さるの かいぶつたちを たおしました。',
        '犬はかごに隠れて山へ行き、猿の怪物たちを倒しました。',
        'Hidden in the palanquin, the dog went up the mountain and defeated the monstrous apes.'),
    ]),
    heart: { name: 'Shippei-tarō', sprite: 'inugami1', lines: [
      ['わん！', 'Wan! Some shrines honour dogs as guardian spirits, inugami. I am the friendly kind.'],
    ] },
    people: [
      { name: 'Wandering Monk Ichi', sprite: 'yamabushi', lines: [
        ['しらせるな', 'Shiraseru na: don\'t let him know. The monsters gave away their own weakness in a song.'],
      ] },
      { name: 'Village Girl Hana', sprite: 'folk:girl:hana_mitsuke', lines: [
        ['ありがとう、 しっぺいたろう', 'He rode up the mountain in my place. Our village gives him rice cakes every festival.'],
      ] },
    ],
  },
  {
    host: 'castle_town', scene: 'night', place: 'Kii-no-kuni Slope', placeJa: 'きのくにざか',
    tale: tale('mujina', 'Mujina, the Faceless One', 'むじな', [
      pg('よる、 しょうにんが さかで、 ないて いる わかい おんなを みつけました。',
        '夜、商人が坂で、泣いている若い女を見つけました。',
        'Late one night a merchant found a young woman crying on a lonely slope.'),
      pg('「どう しましたか。」 おんなが ふりむくと、 かおに め も はな も くち も ありませんでした。',
        '「どうしましたか。」女が振り向くと、顔に目も鼻も口もありませんでした。',
        '"What\'s wrong?" She turned round. Her face had no eyes, no nose, no mouth.'),
      pg('しょうにんは にげて、 そばやの やたいに かけこみました。 「かおが、 かおが ない おんなが！」',
        '商人は逃げて、そば屋の屋台に駆け込みました。「顔が、顔がない女が！」',
        'He ran to a noodle stall. "A woman! With no face!"'),
      pg('そばやは ふりむいて いいました。 「それは、 こんな かおでしたか。」 そばやの かおも つるつるでした。',
        'そば屋は振り向いて言いました。「それは、こんな顔でしたか。」そば屋の顔もつるつるでした。',
        'The noodle seller turned and said, "Was it like this?" His face was smooth as an egg.'),
    ]),
    heart: { name: 'The Noodle Seller', sprite: 'noppera0', lines: [
      ['こんな かお でしたか', 'Konna kao deshita ka: was it a face like THIS? こんな: like this. It is always like this.'],
    ] },
    people: [
      { name: 'Merchant Heisuke', sprite: 'folk:merchant:heisuke', lines: [
        ['め も はな も くち も', 'No eyes, no nose, no mouth! も...も... lists "neither this nor that". I will never forget that grammar.'],
      ] },
    ],
  },
  {
    host: 'mountain_foothills', scene: 'house', place: 'The Old Bathhouse', placeJa: 'ふるい ふろば',
    tale: tale('akaname', 'Akaname, the Filth Licker', 'あかなめ', [
      pg('ふるい いえの ふろばに、 よる こっそり くる ようかいが います。',
        '古い家の風呂場に、夜こっそり来る妖怪がいます。',
        'A yōkai creeps into the bathhouses of old homes at night.'),
      pg('ながい したで、 ふろの あかを ぺろぺろ なめます。',
        '長い舌で、風呂のあかをぺろぺろなめます。',
        'With its long tongue it licks up the grime around the tub: pero, pero.'),
      pg('ひとを きずつけは しませんが、 みた ひとは とても きもちが わるく なります。',
        '人を傷つけはしませんが、見た人はとても気持ちが悪くなります。',
        'It harms no one, but anyone who sees it feels terribly queasy.'),
      pg('だから むかしの ひとは、 ふろを いつも きれいに そうじしました。',
        'だから昔の人は、風呂をいつもきれいに掃除しました。',
        'So people kept their bathrooms spotless. A tale for children who will not scrub the tub.'),
    ]),
    heart: { name: 'Akaname', sprite: 'prop:akaname', lines: [
      ['ぺろぺろ', 'Pero pero: the sound of licking. Your tub is very clean. ...I\'m starving.'],
    ] },
    people: [
      { name: 'Bath Keeper Yuu', sprite: 'folk:oldwoman:yuu', lines: [
        ['そうじ しなさい', 'Souji shinasai: clean it! ～なさい is how parents give orders. Every Japanese child hears it daily.'],
      ] },
    ],
  },
  {
    host: 'mountain_village', scene: 'river', place: 'The Bean-Washing Stream', placeJa: 'あずきあらいの おがわ',
    tale: tale('azukiarai', 'Azukiarai, the Bean Washer', 'あずきあらい', [
      pg('やまの おがわで、 よる 「しょき しょき」と いう おとが きこえます。',
        '山の小川で、夜「しょきしょき」という音が聞こえます。',
        'By a mountain stream at night comes a sound: shoki, shoki.'),
      pg('だれかが ざるで あずきを あらって いる おとです。',
        '誰かがざるで小豆を洗っている音です。',
        'It is the sound of someone washing red beans in a basket.'),
      pg('「あずき あらおか、 ひと とって くおか。」 そんな うたも きこえる と いいます。',
        '「小豆洗おか、人取って食おか。」そんな歌も聞こえるといいます。',
        '"Shall I wash beans, or catch someone and eat them?" they say it sings.'),
      pg('でも すがたを みた ひとは いません。 おとに びっくりして、 かわに おちる だけです。',
        'でも姿を見た人はいません。音にびっくりして、川に落ちるだけです。',
        'No one has ever seen it. People just get startled and fall in the stream.'),
    ]),
    heart: { name: 'Azukiarai', sprite: 'azukiarai1', lines: [
      ['しょき しょき', 'Shoki shoki. Red beans become anko, the sweet paste inside taiyaki and daifuku. I am only helping.'],
    ] },
    people: [
      { name: 'Startled Traveller Sō', sprite: 'folk:man:so', lines: [
        ['びっくりした！', 'Bikkuri shita: what a fright! I fell in the stream. The beans kept washing.'],
      ] },
    ],
  },
  {
    host: 'mountain_pass', scene: 'night', place: 'The Wall That Isn\'t There', placeJa: 'みえない かべ',
    tale: tale('nurikabe', 'Nurikabe, the Invisible Wall', 'ぬりかべ', [
      pg('よみちを あるいて いると、 きゅうに まえに すすめなく なりました。',
        '夜道を歩いていると、急に前に進めなくなりました。',
        'Walking a road at night, a traveller suddenly could not go forward.'),
      pg('みぎにも ひだりにも、 みえない かべが どこまでも つづいて います。',
        '右にも左にも、見えない壁がどこまでも続いています。',
        'An invisible wall stretched endlessly to the left and the right.'),
      pg('それは ぬりかべと いう ようかいでした。',
        'それはぬりかべという妖怪でした。',
        'It was a yōkai called Nurikabe, the plastered wall.'),
      pg('おちついて、 ぼうで かべの したを たたくと、 かべは きえる そうです。',
        '落ち着いて、棒で壁の下をたたくと、壁は消えるそうです。',
        'Stay calm and tap the bottom of the wall with a stick, it is said, and it vanishes. Tap the top and nothing happens.'),
    ]),
    heart: { name: 'Nurikabe', sprite: 'prop:wall', lines: [
      ['すすめない', 'Susumenai: can\'t go forward. The potential form, negative. Tap lower, traveller.'],
    ] },
    people: [
      { name: 'Night Courier Hiko', sprite: 'ninja', lines: [
        ['おちついて', 'Ochitsuite: calm down. Every ninja\'s first lesson. Then hit the bottom of the wall.'],
      ] },
    ],
  },
  {
    host: 'mountain_pass', scene: 'field', place: 'The Windy Field', placeJa: 'かぜの のはら',
    tale: tale('ittanmomen', 'Ittan-momen, the Flying Cloth', 'いったんもめん', [
      pg('ゆうがた、 そらに しろい ぬのが ひらひらと とんで いました。',
        '夕方、空に白い布がひらひらと飛んでいました。',
        'At dusk a long strip of white cloth fluttered across the sky.'),
      pg('ぬのの ながさは いったん、 だいたい じゅう メートルでした。',
        '布の長さは一反、だいたい十メートルでした。',
        'It was one tan long: a bolt of cloth, about ten metres.'),
      pg('ぬのは ひとの かおに まきついて、 びっくりさせます。',
        '布は人の顔に巻き付いて、びっくりさせます。',
        'It wraps itself round people\'s faces to frighten them.'),
      pg('ある さむらいが かたなで きると、 ぬのは きえ、 てに ちが のこった と いいます。',
        'ある侍が刀で切ると、布は消え、手に血が残ったといいます。',
        'A samurai once cut it with his sword. It vanished, they say, and left blood on his hand.'),
    ]),
    heart: { name: 'Ittan-momen', sprite: 'prop:cloth', lines: [
      ['ひらひら', 'Hira hira: fluttering. Petals, butterflies and flying cloths all go ひらひら.'],
    ] },
    people: [
      { name: 'Cloth Dyer Some', sprite: 'folk:woman:some', lines: [
        ['もめん', 'Momen: cotton. いったん, one tan, was the length of cloth for one kimono.'],
      ] },
    ],
  },
  {
    host: 'market_street', scene: 'street', place: 'Rainy Lane', placeJa: 'あめの こみち', weather: 'rain',
    tale: tale('karakasa', 'Karakasa-obake, the Umbrella Ghost', 'からかさおばけ', [
      pg('ひゃくねん つかわれた どうぐには、 こころが やどる と いわれます。',
        '百年使われた道具には、心が宿ると言われます。',
        'They say a tool used for a hundred years gains a spirit.'),
      pg('すてられた ふるい かさが、 ひとつめと いっぽんあしで とびはねるように なりました。',
        '捨てられた古い傘が、一つ目と一本足で飛び跳ねるようになりました。',
        'An old umbrella, thrown away, began to hop about on one leg, with one eye and a long tongue.'),
      pg('かさは ひとを おどろかせて、 あそんで ほしかった だけでした。',
        '傘は人を驚かせて、遊んでほしかっただけでした。',
        'It only wanted to surprise people, and to be played with again.'),
      pg('ものを たいせつに しよう。 それが この はなしの おしえです。',
        '物を大切にしよう。それがこの話の教えです。',
        'Take good care of your things: that is the moral of the tale.'),
    ]),
    heart: { name: 'Karakasa', sprite: 'karakasa1', lines: [
      ['べろーん', 'Beroon! That is me sticking my tongue out. I am a tsukumogami: a tool that came alive.'],
      ['もったいない', 'Mottainai: what a waste! Japanese say it when something useful is thrown away. I agree.'],
    ] },
    people: [
      { name: 'Umbrella Mender Kasa', sprite: 'folk:merchant:kasa', lines: [
        ['なおします', 'Naoshimasu: I\'ll fix it. Oiled paper and bamboo ribs can be mended for a lifetime.'],
      ] },
    ],
  },
  {
    host: 'moon_shrine', scene: 'night', place: 'The Lantern Graveyard', placeJa: 'ちょうちんの はかば', weather: 'fireflies',
    tale: tale('chochin', 'Chōchin-obake, the Lantern Ghost', 'ちょうちんおばけ', [
      pg('おぼんの よる、 ふるい ちょうちんが ぱっくりと くちを あけました。',
        'お盆の夜、古い提灯がぱっくりと口を開けました。',
        'On a night of Obon, an old paper lantern split open into a grin.'),
      pg('ちょうちんは ながい したを だして、 けらけら わらいました。',
        '提灯は長い舌を出して、けらけら笑いました。',
        'It stuck out a long tongue and cackled: kera kera.'),
      pg('ちょうちんは、 そせんが かえる みちを てらす ために もやされて きました。',
        '提灯は、祖先が帰る道を照らすために燃やされてきました。',
        'Lanterns had always been lit to show the ancestors their way home.'),
      pg('すてられた ちょうちんは さびしくて、 おばけに なったのです。',
        '捨てられた提灯は寂しくて、お化けになったのです。',
        'The lantern had been thrown away, and loneliness turned it into a ghost.'),
    ]),
    heart: { name: 'Chōchin-obake', sprite: 'akari1', lines: [
      ['けらけら', 'Kera kera! The sound of a cackle. I light the way for the dead at Obon. Respect, please.'],
    ] },
    people: [
      { name: 'Obon Dancer Natsu', sprite: 'folk:girl:natsu', lines: [
        ['ぼんおどり', 'Bon-odori: the circle dance of Obon. Everyone joins, even people who can\'t dance.'],
      ] },
    ],
  },
  {
    host: 'teahouse', scene: 'temple', place: 'The Biwa Hall', placeJa: 'びわの ま',
    tale: tale('biwa', 'Biwa-bokuboku, the Lute Ghost', 'びわぼくぼく', [
      pg('ある てらに、 ひかれなく なった ふるい びわが ありました。',
        'ある寺に、弾かれなくなった古い琵琶がありました。',
        'In a temple lay an old biwa lute that no one played any more.'),
      pg('ある よる、 びわは めと てを はやし、 じぶんで うたいだしました。',
        'ある夜、琵琶は目と手を生やし、自分で歌い出しました。',
        'One night it grew eyes and hands, and began to sing to itself.'),
      pg('うたは むかしの いくさの かなしい はなしでした。',
        '歌は昔の戦の悲しい話でした。',
        'It sang the sad story of an ancient war, as it had once been played to sing.'),
      pg('おしょうさんが びわを きれいに して、 また ひいて あげると、 びわは しずかに なりました。',
        'おしょうさんが琵琶をきれいにして、また弾いてあげると、琵琶は静かになりました。',
        'When the priest cleaned it and played it again, it settled down, content.'),
    ]),
    heart: { name: 'Biwa-bokuboku', sprite: 'prop:biwa', lines: [
      ['べん べん', 'Ben ben: the twang of a biwa. Blind singers wandered Japan with lutes like me, singing the Tale of the Heike.'],
    ] },
    people: [
      { name: 'Priest Gen', sprite: 'abbot', lines: [
        ['ひいて あげましょう', 'Hiite agemashou: let me play it for you. ～てあげる: doing something for someone.'],
      ] },
    ],
  },
  {
    host: 'market_street', scene: 'house', place: 'The Junk Shed', placeJa: 'がらくたごや',
    tale: tale('tsukumogami', 'Tsukumogami, the Tools That Came Alive', 'つくもがみ', [
      pg('としの くれに、 ひとびとは ふるい どうぐを たくさん すてました。',
        '年の暮れに、人々は古い道具をたくさん捨てました。',
        'At year\'s end, people threw out piles of old tools.'),
      pg('すてられた ぞうりや なべや かさが、 おこって いきかえりました。',
        '捨てられた草履や鍋や傘が、怒って生き返りました。',
        'The discarded sandals, pots and umbrellas came back to life, furious.'),
      pg('どうぐたちは よる、 まちを ぎょうれつして あるきました。',
        '道具たちは夜、町を行列して歩きました。',
        'At night they paraded through the streets.'),
      pg('おぼうさんに さとされて、 どうぐたちは ほとけの みちを まなぶように なりました。',
        'お坊さんに諭されて、道具たちは仏の道を学ぶようになりました。',
        'A monk talked them round, and the tools took up the Buddha\'s path instead of revenge.'),
    ]),
    heart: { name: 'Bake-zōri', sprite: 'zori1', lines: [
      ['ぞうり', 'Zouri: straw sandals. I walked a thousand miles for my owner. Then the bin.'],
      [undefined, 'Old Japan held a memorial for broken needles, harikuyou, thanking them for their work.'],
    ] },
    people: [
      { name: 'Old Pot Nabe', sprite: 'prop:kettle', lines: [
        ['なべ', 'Nabe: a pot. Also the stew cooked in it in winter. I fed a family for ninety-nine years.'],
      ] },
      { name: 'Monk Dōmyō', sprite: 'folk:monk:domyo', lines: [
        ['ありがとう を いおう', 'Say thank you to your things. Then let them go. That\'s all they wanted.'],
      ] },
    ],
  },
  {
    host: 'castle_town', scene: 'street', place: 'The Midnight Avenue', placeJa: 'よなかの おおどおり',
    tale: tale('hyakki', 'The Night Parade of One Hundred Demons', 'ひゃっきやこう', [
      pg('ある よるに なると、 ようかいたちが ぎょうれつを つくって まちを あるきます。',
        'ある夜になると、妖怪たちが行列を作って町を歩きます。',
        'On certain nights, the yōkai form a parade and march through town.'),
      pg('おにも かっぱも かさも ちょうちんも、 ひゃくの ようかいが いっしょに あるきます。',
        '鬼も河童も傘も提灯も、百の妖怪が一緒に歩きます。',
        'Ogres, kappa, umbrellas, lanterns: a hundred yōkai walk together.'),
      pg('ぎょうれつを みた ひとは しんで しまう と いわれました。 だから その よるは だれも そとに でません。',
        '行列を見た人は死んでしまうと言われました。だからその夜は誰も外に出ません。',
        'It was said that anyone who saw it would die, so on those nights no one goes out.'),
      pg('でも おまもりの おきょうを もって いた わかものは、 たすかった そうです。',
        'でもお守りのお経を持っていた若者は、助かったそうです。',
        'But one young noble who carried a sutra charm, they say, came through unharmed.'),
    ]),
    heart: { name: 'Parade Leader', sprite: 'oni', lines: [
      ['ひゃっき', 'Hyakki: a hundred demons. Get off the street, human. ...You are in a game. Fine. Watch, then.'],
    ] },
    people: [
      { name: 'Lantern in the Parade', sprite: 'akari2', lines: [
        ['ぎょうれつ', 'Gyouretsu: a parade, or a queue. Japanese line up beautifully, even yōkai.'],
      ] },
      { name: 'Umbrella in the Parade', sprite: 'karakasa2', lines: [
        ['おまもり', 'Omamori: a charm from a shrine. That boy had one. We had to let him pass.'],
      ] },
    ],
  },
  {
    host: 'castle_town', scene: 'street', place: 'The High Wall Lane', placeJa: 'へいの むこう',
    tale: tale('takaonna', 'Taka-onna, the Tall Woman', 'たかおんな', [
      pg('よる、 たかい へいの むこうから、 おんなの かおが のぞきました。',
        '夜、高い塀の向こうから、女の顔がのぞきました。',
        'At night, a woman\'s face peered over a high wall.'),
      pg('おんなの からだは のびて、 にかいの まどまで とどきました。',
        '女の体は伸びて、二階の窓まで届きました。',
        'Her body stretched until she could look into second-floor windows.'),
      pg('たかおんなは だれにも えらばれず、 さびしかったと いわれます。',
        '高女は誰にも選ばれず、寂しかったと言われます。',
        'They say Taka-onna had never been chosen by anyone, and was lonely.'),
      pg('のぞく だけで、 わるい ことは しません。 でも みられた ほうは びっくりします。',
        'のぞくだけで、悪いことはしません。でも見られた方はびっくりします。',
        'She only peeks and does no harm. But being peeked at is a shock.'),
    ]),
    heart: { name: 'Taka-onna', sprite: 'prop:longneck', lines: [
      ['たかい', 'Takai: tall, high. Also expensive! Context decides. I am tall, not expensive.'],
    ] },
    people: [
      { name: 'Startled Clerk Kō', sprite: 'folk:man:ko', lines: [
        ['にかい', 'Nikai: the second floor. I live on the second floor. That should have been safe.'],
      ] },
    ],
  },
  {
    host: 'mountain_village', scene: 'temple', place: 'Shōjō-ji Garden', placeJa: 'しょうじょうじの にわ',
    tale: tale('shojoji', 'The Tanuki Band of Shōjō-ji', 'しょうじょうじの たぬきばやし', [
      pg('しょうじょうじの にわに、 つきの よる たぬきたちが あつまりました。',
        '證誠寺の庭に、月の夜狸たちが集まりました。',
        'On moonlit nights, tanuki gathered in the garden of Shōjō-ji temple.'),
      pg('たぬきは おなかを たいこの ように ぽんぽこ たたいて、 おどりました。',
        '狸はお腹を太鼓のようにぽんぽこたたいて、踊りました。',
        'They drummed on their round bellies, ponpoko pon, and danced.'),
      pg('おしょうさんも まけずに しゃみせんを ひいて、 いっしょに うたいました。',
        'おしょうさんも負けずに三味線を弾いて、一緒に歌いました。',
        'Not to be outdone, the priest played his shamisen and sang along.'),
      pg('たぬきの おやぶんは たたきすぎて、 おなかが やぶれて しまいました。 おしょうさんは おはかを つくって あげました。',
        '狸の親分はたたきすぎて、お腹が破れてしまいました。おしょうさんはお墓を作ってあげました。',
        'The tanuki boss drummed so hard his belly burst. The priest gave him a little grave, still there today.'),
    ]),
    heart: { name: 'Boss Tanuki', sprite: 'tanu2', lines: [
      ['ぽんぽこ ぽん', 'Ponpoko pon! The sound of a tanuki belly. Japanese children sing this song every autumn.'],
    ] },
    people: [
      { name: 'Priest Ryōun', sprite: 'abbot', lines: [
        ['まけないぞ', 'Makenai zo: I won\'t lose! ぞ adds a rough, determined kick. A shamisen against a hundred bellies.'],
      ] },
    ],
  },
  {
    host: 'waterfall_forest', scene: 'forest', place: 'The Sunshower Path', placeJa: 'きつねの よめいりの みち', weather: 'rain',
    tale: tale('kitsuneyomeiri', 'The Fox\'s Wedding', 'きつねの よめいり', [
      pg('はれて いるのに あめが ふる ひが あります。 むかしの ひとは 「きつねの よめいりだ」と いいました。',
        '晴れているのに雨が降る日があります。昔の人は「狐の嫁入りだ」と言いました。',
        'Some days it rains while the sun is shining. People used to say: a fox is getting married.'),
      pg('もりの おくでは、 きつねたちが ちょうちんを もって ぎょうれつを して いました。',
        '森の奥では、狐たちが提灯を持って行列をしていました。',
        'Deep in the woods, foxes walked in a wedding procession with lanterns.'),
      pg('はなよめを みた ひとは、 よい ことが あると いう ひとも、 わるい ことが あると いう ひとも いました。',
        '花嫁を見た人は、良いことがあるという人も、悪いことがあるという人もいました。',
        'Some said seeing the fox bride brought luck, others that it brought trouble.'),
      pg('だから ひとびとは そっと めを そらして、 しずかに いのりました。',
        'だから人々はそっと目をそらして、静かに祈りました。',
        'So people quietly looked away, and wished the foxes well.'),
    ]),
    heart: { name: 'The Fox Bride', sprite: 'kobi0', lines: [
      ['おめでとう', 'Omedetou: congratulations. Say it to a fox bride and look away politely. That\'s the custom.'],
    ] },
    people: [
      { name: 'Fox Lantern Bearer', sprite: 'kobi1', lines: [
        ['てんきあめ', 'Tenki-ame: sun-rain. Weather-rain, literally. If you see it, you know whose wedding it is.'],
      ] },
    ],
  },
];
