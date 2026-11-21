import { pg, tale, type TaleSite } from './types';

// The picture-book tales (mukashi-banashi) every Japanese child knows.

export const CLASSIC_SITES: TaleSite[] = [
  {
    host: 'sakura_village', scene: 'river', place: 'The Peach River', placeJa: 'もものかわ', weather: 'sakura',
    tale: tale('momotaro', 'Momotarō, the Peach Boy', 'ももたろう', [
      pg('おばあさんが かわで せんたくを して いると、 おおきな ももが どんぶらこと ながれて きました。',
        'おばあさんが川で洗濯をしていると、大きな桃がどんぶらこと流れてきました。',
        'An old woman was washing clothes in the river when a huge peach came bobbing down, donburako, donburako.'),
      pg('ももを わると、 なかから げんきな おとこのこが うまれました。 なまえは ももたろう。',
        '桃を割ると、中から元気な男の子が生まれました。名前は桃太郎。',
        'When they cut the peach open, a lively baby boy came out. They named him Momotarō, Peach Boy.'),
      pg('おおきく なった ももたろうは、 きびだんごを もって おにがしまへ でかけました。 いぬと さると きじが なかまに なりました。',
        '大きくなった桃太郎は、きびだんごを持って鬼ヶ島へ出かけました。犬と猿と雉が仲間になりました。',
        'Grown up, Momotarō set off for Ogre Island with millet dumplings. A dog, a monkey and a pheasant joined him for a dumpling each.'),
      pg('みんなで ちからを あわせて おにを やっつけ、 たからものを もって かえりました。 めでたし めでたし。',
        'みんなで力を合わせて鬼をやっつけ、宝物を持って帰りました。めでたしめでたし。',
        'Working together they beat the ogres and brought the treasure home. And they all lived happily.'),
    ]),
    heart: { name: 'The Great Peach', sprite: 'prop:peach', lines: [
      ['どんぶらこ、 どんぶらこ', 'A peach as big as a washtub, bobbing at the edge of the water. Something inside it is kicking.'],
      [undefined, 'Peaches were said to drive away evil. That is why the boy who beats the ogres comes out of one.'],
    ] },
    people: [
      { name: 'Grandmother Momo', sprite: 'folk:oldwoman:momo_grandma', lines: [
        ['まあ、 おおきな もも！', 'My, what a big peach! I will take it home for grandfather. Wait till he sees it.'],
        ['いってらっしゃい', 'When our boy left for Ogre Island I said itterasshai: go, and come back. And he did.'],
      ] },
      { name: 'Momotarō', sprite: 'folk:boy:momotaro', lines: [
        ['ももたろう です！', 'I am Momotarō! Mother made kibi-dango, millet dumplings, for the road. One for every friend.'],
        ['ちからを あわせて', 'Chikara wo awasete: put your strengths together. A dog, a monkey and a bird beat an island of ogres that way.'],
      ] },
      { name: 'Shiro the Dog', sprite: 'prop:dog', lines: [
        ['わん わん！', 'Wan wan! Japanese dogs say wan. One dumpling and I followed him all the way to Ogre Island.'],
        [undefined, 'The monkey and I argued the whole trip. 犬猿の仲, "like dog and monkey", means two who never get along.'],
      ] },
    ],
  },
  {
    host: 'bamboo_grove', scene: 'mountain', place: 'Mount Ashigara', placeJa: 'あしがらやま',
    tale: tale('kintaro', 'Kintarō, the Golden Boy', 'きんたろう', [
      pg('むかし、 あしがらやまに きんたろうと いう ちからもちの おとこのこが いました。',
        '昔、足柄山に金太郎という力持ちの男の子がいました。',
        'Long ago on Mount Ashigara lived a very strong boy named Kintarō.'),
      pg('きんたろうの ともだちは くまや うさぎや さるでした。 くまと すもうを とって、 いつも かちました。',
        '金太郎の友達は熊や兎や猿でした。熊と相撲を取って、いつも勝ちました。',
        'His friends were a bear, a rabbit and a monkey. He wrestled the bear at sumo, and always won.'),
      pg('ある ひ、 たにに はしが ありませんでした。 きんたろうは おおきな きを おして たおし、 はしに しました。',
        'ある日、谷に橋がありませんでした。金太郎は大きな木を押して倒し、橋にしました。',
        'One day there was no bridge over a gorge. Kintarō pushed over a great tree and made it a bridge.'),
      pg('それを みた りっぱな さむらいが、 きんたろうを けらいに しました。 きんたろうは つよい さむらいに なりました。',
        'それを見た立派な侍が、金太郎を家来にしました。金太郎は強い侍になりました。',
        'A great samurai who saw it took Kintarō into his service, and he grew up to be a mighty warrior.'),
    ]),
    heart: { name: 'Kintarō', sprite: 'folk:boy:kintaro', lines: [
      ['はっけよい！', 'Hakkeyoi! That is what the referee shouts in sumo. Wrestle me? ...Maybe after you are a higher level.'],
      ['きん', 'My apron has 金 on it: gold. On Children\'s Day, families display Kintarō dolls so their kids grow up strong.'],
    ] },
    people: [
      { name: 'Kuma the Bear', sprite: 'prop:bear', lines: [
        ['くま', 'Kuma: bear. I have lost to that boy at sumo nine hundred times. I am working on my footwork.'],
        [undefined, 'He rides me like a horse. I let him. Friends do that.'],
      ] },
      { name: 'Yamanba of Ashigara', sprite: 'yamanba0', lines: [
        ['やまんば', 'They call me yamanba, the mountain woman, and say I eat travellers. I raised that boy. Draw your own conclusions.'],
        [undefined, 'Say やま twice: yama, mountain. Kintarō has never seen a town, only these peaks.'],
      ] },
    ],
  },
  {
    host: 'pine_shore', scene: 'shore', place: 'Urashima\'s Beach', placeJa: 'うらしまの はま',
    tale: tale('urashima', 'Urashima Tarō', 'うらしまたろう', [
      pg('りょうしの うらしまたろうは、 こどもに いじめられて いる かめを たすけました。',
        '漁師の浦島太郎は、子どもにいじめられている亀を助けました。',
        'The fisherman Urashima Tarō saved a turtle that some children were tormenting.'),
      pg('かめは おれいに、 うらしまを うみの そこの りゅうぐうじょうへ つれて いきました。 おとひめさまが まって いました。',
        '亀はお礼に、浦島を海の底の竜宮城へ連れて行きました。乙姫様が待っていました。',
        'In thanks, the turtle carried him to the Dragon Palace at the bottom of the sea, where Princess Otohime was waiting.'),
      pg('たのしい ひびの あと、 うらしまは いえに かえりたく なりました。 おとひめは たまてばこを わたし、 「あけては いけません」と いいました。',
        '楽しい日々の後、浦島は家に帰りたくなりました。乙姫は玉手箱を渡し、「開けてはいけません」と言いました。',
        'After happy days he longed for home. Otohime gave him a jewelled box and said: "You must never open it."'),
      pg('むらに かえると、 しって いる ひとは だれも いません。 はこを あけると、 しろい けむりが でて、 うらしまは おじいさんに なりました。',
        '村に帰ると、知っている人は誰もいません。箱を開けると、白い煙が出て、浦島はおじいさんになりました。',
        'Back home, he knew no one: three hundred years had passed. He opened the box, white smoke poured out, and Urashima became an old man.'),
    ]),
    heart: { name: 'The Old Turtle', sprite: 'prop:turtle', lines: [
      ['ありがとう、 うらしまさん', 'You saved me from those children. Climb on my shell: I know a palace under the waves.'],
      ['つるは せんねん、 かめは まんねん', 'Cranes live a thousand years, turtles ten thousand. So they say at every birthday for the old.'],
    ] },
    people: [
      { name: 'Urashima Tarō', sprite: 'folk:fisher:urashima', lines: [
        ['いじめては いけないよ', 'Don\'t bully it! ～てはいけない: you must not. I said that to the children, and my whole life changed.'],
        [undefined, 'Three days under the sea. Three hundred years up here. Time does not keep the same pace everywhere.'],
      ] },
      { name: 'Princess Otohime', sprite: 'folk:princess:otohime', lines: [
        ['あけては いけません', 'Akete wa ikemasen: you must not open it. I said it plainly. People always open the box.'],
        ['りゅうぐうじょう', 'Ryuuguujou, the Dragon Palace: summer, spring, autumn and winter each have a wall of it.'],
      ] },
      { name: 'The Jewelled Box', sprite: 'prop:box', lines: [
        ['たまてばこ', 'Tamatebako: a jewelled box. Today it means a box of surprises, a thing full of wonders.'],
        [undefined, 'It is tied with a red cord. Better leave it.'],
      ] },
    ],
  },
  {
    host: 'bamboo_grove', scene: 'bamboo', place: 'The Shining Bamboo', placeJa: 'ひかる たけ',
    tale: tale('kaguya', 'Kaguya-hime, the Moon Princess', 'かぐやひめ', [
      pg('たけとりの おじいさんが、 ひかる たけを きると、 なかに ちいさな おんなのこが いました。',
        '竹取のおじいさんが、光る竹を切ると、中に小さな女の子がいました。',
        'An old bamboo cutter split a glowing stalk, and inside sat a tiny girl.'),
      pg('おんなのこは うつくしい かぐやひめに なりました。 ごにんの きぞくが けっこんを もうしこみました。',
        '女の子は美しいかぐや姫になりました。五人の貴族が結婚を申し込みました。',
        'She grew into the beautiful Princess Kaguya, and five noblemen asked to marry her.'),
      pg('ひめは 「ほとけの はちを」「ひの ねずみの かわを」と、 できない ものを たのみました。 だれも もって こられませんでした。',
        '姫は「仏の鉢を」「火鼠の皮を」と、できない物を頼みました。誰も持って来られませんでした。',
        'She asked each for an impossible treasure: the Buddha\'s stone bowl, the robe of the fire-rat. None could bring one.'),
      pg('じゅうごやの よる、 つきから むかえが きました。 かぐやひめは なきながら つきへ かえって いきました。',
        '十五夜の夜、月から迎えが来ました。かぐや姫は泣きながら月へ帰っていきました。',
        'On the night of the full moon, envoys came from the Moon, and Kaguya-hime went home to it in tears.'),
    ]),
    heart: { name: 'The Shining Stalk', sprite: 'prop:bamboo', lines: [
      ['ひかる たけ', 'One stalk glows from inside, soft as moonlight. Something tiny is asleep in there.'],
      [undefined, 'The Tale of the Bamboo Cutter, over a thousand years old, is the oldest story written in Japanese.'],
    ] },
    people: [
      { name: 'Princess Kaguya', sprite: 'folk:princess:kaguya', lines: [
        ['つきが きれいですね', 'Tsuki ga kirei desu ne: the moon is beautiful, isn\'t it. A writer once said it is how a shy person says "I love you".'],
        [undefined, 'I asked for impossible things because I knew I could not stay. The moon was always my home.'],
      ] },
      { name: 'Old Sanuki, bamboo cutter', sprite: 'folk:oldman:sanuki', lines: [
        ['たけ を とる', 'Take wo toru: to cut bamboo. That is all my name means, たけとり. Then the bamboo gave me a daughter.'],
        [undefined, 'After she left, the emperor burned her letter on the highest mountain. Some say that is why it is called Fuji: 不死, undying.'],
      ] },
      { name: 'Lord Kuramochi, suitor', sprite: 'folk:noble:kuramochi', lines: [
        ['うそ は いけません', 'She asked me for a jewelled branch from the island of Hōrai. I had craftsmen fake one. They came to the palace asking to be paid.'],
        [undefined, 'Lesson learned: a forged treasure always sends you its bill.'],
      ] },
    ],
  },
  {
    host: 'river_crossing', scene: 'river', place: 'The Rice-Bowl Ford', placeJa: 'おわんの わたし',
    tale: tale('issun', 'Issun-bōshi, the One-Inch Boy', 'いっすんぼうし', [
      pg('いっすんぼうしは ゆびほどの おおきさの おとこのこでした。 ゆめは みやこで さむらいに なる ことでした。',
        '一寸法師は指ほどの大きさの男の子でした。夢は都で侍になることでした。',
        'Issun-bōshi was a boy no bigger than a thumb. His dream was to become a samurai in the capital.'),
      pg('おわんを ふねに、 はしを かいに、 はりを かたなに して、 かわを くだりました。',
        'お椀を舟に、箸を櫂に、針を刀にして、川を下りました。',
        'With a rice bowl for a boat, a chopstick for an oar and a needle for a sword, he went down the river.'),
      pg('みやこで ひめを まもって いると、 おにが きて いっすんぼうしを のみこみました。 いっすんぼうしは おなかの なかを はりで ちくちく さしました。',
        '都で姫を守っていると、鬼が来て一寸法師を飲み込みました。一寸法師はお腹の中を針でちくちく刺しました。',
        'Guarding a princess in the capital, he was swallowed by an ogre, and pricked its belly from inside with his needle.'),
      pg('おには にげて、 うちでの こづちを おとしました。 ひめが それを ふると、 いっすんぼうしは おおきく なりました。',
        '鬼は逃げて、打ち出の小槌を落としました。姫がそれを振ると、一寸法師は大きくなりました。',
        'The ogre fled and dropped its magic mallet. The princess shook it, and Issun-bōshi grew to full size.'),
    ]),
    heart: { name: 'Issun-bōshi', sprite: 'prop:bowl', lines: [
      ['いっすん', 'Issun: one sun, about three centimetres. I am exactly one sun tall. Watch where you step.'],
      [undefined, 'Small body, big heart. 一寸の虫にも五分の魂: even a one-inch bug has a half-inch soul.'],
    ] },
    people: [
      { name: 'The Princess', sprite: 'folk:princess:issun_hime', lines: [
        ['うちでの こづち', 'The magic mallet: shake it and wish, and the wish comes out. I wished him tall.'],
        [undefined, 'Tiny or tall, he was the bravest guard I ever had.'],
      ] },
      { name: 'Red Ogre', sprite: 'oni', lines: [
        ['いたい、 いたい！', 'Itai, itai! It hurts! He was in my STOMACH with a NEEDLE. Never swallow a samurai.'],
        [undefined, 'I dropped my mallet running away. Ogres are not good at keeping treasure.'],
      ] },
    ],
  },
  {
    host: 'sakura_village', scene: 'house', place: 'The Weaver\'s House', placeJa: 'はたおりの いえ', weather: 'snow',
    tale: tale('tsuru', 'The Crane\'s Gift', 'つるの おんがえし', [
      pg('ゆきの ひ、 わかものが わなに かかった つるを たすけました。',
        '雪の日、若者が罠にかかった鶴を助けました。',
        'On a snowy day, a young man freed a crane caught in a trap.'),
      pg('その よる、 うつくしい むすめが きて、 いっしょに くらす ことに なりました。 むすめは 「はたを おる ところを みないで ください」と いいました。',
        'その夜、美しい娘が来て、一緒に暮らすことになりました。娘は「機を織るところを見ないでください」と言いました。',
        'That night a lovely young woman came, and stayed to live with him. "Never watch me while I weave," she said.'),
      pg('むすめが おった ぬのは とても うつくしく、 たかく うれました。 でも むすめは どんどん やせて いきました。',
        '娘が織った布はとても美しく、高く売れました。でも娘はどんどん痩せていきました。',
        'The cloth she wove was so beautiful it sold for a fortune, but she grew thinner and thinner.'),
      pg('わかものが のぞくと、 つるが じぶんの はねを ぬいて おって いました。 つるは 「さようなら」と いって、 そらへ とんで いきました。',
        '若者がのぞくと、鶴が自分の羽を抜いて織っていました。鶴は「さようなら」と言って、空へ飛んでいきました。',
        'He peeked, and saw a crane weaving with feathers plucked from its own body. "Goodbye," it said, and flew away into the sky.'),
    ]),
    heart: { name: 'The Loom', sprite: 'prop:loom', lines: [
      ['とん とん からり', 'Ton ton karari: the sound of the loom. The cloth on it is white, with feathers woven in.'],
      ['おんがえし', 'Ongaeshi: repaying a kindness. 恩, a debt of kindness, is something Japanese tales never let you forget.'],
    ] },
    people: [
      { name: 'Yohyō, the young man', sprite: 'folk:man:yohyo', lines: [
        ['みないで ください', 'Minaide kudasai: please don\'t look. ～ないでください asks someone NOT to do something. I looked.'],
        [undefined, 'Every winter I leave the trap-free field for the cranes. It is all I can do now.'],
      ] },
      { name: 'Tsū, the crane', sprite: 'prop:crane', lines: [
        ['つる', 'Tsuru: crane. Fold a thousand paper cranes, senbazuru, and a wish comes true.'],
        [undefined, 'I wove until I had no feathers left to give. That is what a debt of kindness felt like to me.'],
      ] },
    ],
  },
  {
    host: 'mountain_pass', scene: 'mountain', place: 'Crackling Mountain', placeJa: 'かちかちやま',
    tale: tale('kachikachi', 'Kachi-kachi Yama, the Crackling Mountain', 'かちかちやま', [
      pg('いたずらな たぬきが、 おじいさんの はたけを あらし、 おばあさんを だまして にげました。',
        'いたずらな狸が、おじいさんの畑を荒らし、おばあさんをだまして逃げました。',
        'A wicked tanuki raided an old man\'s field, tricked his kind old wife, and ran off.'),
      pg('なかよしの うさぎが おこって、 たぬきに まきを せおわせました。 うさぎが ひうちいしを かちかち ならしました。',
        '仲良しの兎が怒って、狸に薪を背負わせました。兎が火打ち石をかちかち鳴らしました。',
        'Their friend the rabbit, furious, got the tanuki to carry firewood on its back, and struck flints behind it: kachi, kachi.'),
      pg('「かちかち いう おとは なに？」「ここは かちかちやまだからさ。」 まきが もえて、 たぬきは にげました。',
        '「かちかちいう音は何？」「ここはかちかち山だからさ。」薪が燃えて、狸は逃げました。',
        '"What is that kachi-kachi sound?" "This is Crackling Mountain, that\'s all." The wood caught fire and the tanuki fled.'),
      pg('さいごに うさぎは きの ふねで、 たぬきは どろの ふねで うみに でました。 どろの ふねは とけて しまいました。',
        '最後に兎は木の舟で、狸は泥の舟で海に出ました。泥の舟は溶けてしまいました。',
        'Last of all they raced boats: the rabbit in wood, the tanuki in mud. The mud boat melted away.'),
    ]),
    heart: { name: 'Tricky Tanuki', sprite: 'tanu1', lines: [
      ['かちかち？', 'What IS that kachi-kachi noise behind me? ...Why does my back feel warm?'],
      [undefined, 'かちかち is a sound word, giongo. Japanese has thousands: どきどき heartbeat, ぺこぺこ hungry.'],
    ] },
    people: [
      { name: 'Usagi the Rabbit', sprite: 'prop:hare', lines: [
        ['ゆるさない！', 'Yurusanai: I won\'t forgive this. Nobody tricks my old friends and gets away with it.'],
        [undefined, 'In Japan we see a rabbit pounding rice cakes on the moon, not a man\'s face. Look next full moon.'],
      ] },
      { name: 'The Old Man', sprite: 'folk:oldman:kachikachi', lines: [
        ['ありがとう、 うさぎさん', 'The rabbit did for us what we were too old to do. Old tales can be fierce about fairness.'],
      ] },
    ],
  },
  {
    host: 'bamboo_grove', scene: 'forest', place: 'The Sparrow\'s Inn', placeJa: 'すずめの おやど',
    tale: tale('shitakiri', 'The Tongue-Cut Sparrow', 'したきりすずめ', [
      pg('やさしい おじいさんは すずめを かわいがって いました。 でも いじわるな おばあさんが すずめの したを きって しまいました。',
        '優しいおじいさんは雀をかわいがっていました。でも意地悪なおばあさんが雀の舌を切ってしまいました。',
        'A kind old man loved a little sparrow, but his spiteful wife cut its tongue and drove it away.'),
      pg('おじいさんが すずめの おやどを たずねると、 すずめたちは ごちそうと おどりで もてなしました。',
        'おじいさんが雀のお宿を訪ねると、雀たちはごちそうとおどりでもてなしました。',
        'The old man found the sparrows\' inn in the bamboo, and they welcomed him with a feast and dancing.'),
      pg('かえりに 「おおきい つづらと ちいさい つづら、 どちらに しますか。」 おじいさんは ちいさい ほうを えらびました。 なかは たからものでした。',
        '帰りに「大きいつづらと小さいつづら、どちらにしますか。」おじいさんは小さい方を選びました。中は宝物でした。',
        '"A big basket or a small one?" He chose the small one, and it was full of treasure.'),
      pg('おばあさんは おおきい つづらを もらいました。 あけると、 おばけが たくさん でて きました。',
        'おばあさんは大きいつづらをもらいました。開けると、お化けがたくさん出てきました。',
        'The greedy wife went and took the big one. When she opened it, out poured monsters.'),
    ]),
    heart: { name: 'Little Sparrow', sprite: 'prop:sparrow', lines: [
      ['ちゅん ちゅん', 'Chun chun! That is a sparrow\'s song in Japanese. Welcome to the inn, honoured guest.'],
      [undefined, 'おやど: an inn. The お makes it polite. Inns in Japan bow you in and bow you out.'],
    ] },
    people: [
      { name: 'The Kind Old Man', sprite: 'folk:oldman:sparrow', lines: [
        ['ちいさい ほうで いいです', 'Chiisai hou de ii desu: the small one is fine. ほうが compares two things. Modesty won me the treasure.'],
      ] },
      { name: 'The Greedy Old Woman', sprite: 'folk:oldwoman:greedy', lines: [
        ['おおきい ほうを ちょうだい！', 'The BIG one! Give me the big one! ...Why is it moving?'],
        ['よくばり', 'Yokubari: greedy. Every old tale has one, and the big box is always the wrong box.'],
      ] },
      { name: 'Two Baskets', sprite: 'prop:basket', lines: [
        ['つづら', 'Tsuzura: wicker baskets for travel. One big, one small. Choose with your heart, not your eyes.'],
      ] },
    ],
  },
  {
    host: 'sakura_village', scene: 'field', place: 'The Blossoming Field', placeJa: 'はなさかの はたけ', weather: 'sakura',
    tale: tale('hanasaka', 'The Old Man Who Made Trees Bloom', 'はなさかじいさん', [
      pg('やさしい ふうふの いぬの シロが 「ここ ほれ わん わん」と なきました。 ほると、 こばんが ざくざく でて きました。',
        '優しい夫婦の犬のシロが「ここ掘れワンワン」と鳴きました。掘ると、小判がざくざく出てきました。',
        'Shiro, the kind couple\'s dog, barked "Dig here, woof woof!" They dug, and gold coins came pouring out.'),
      pg('となりの いじわるな おじいさんは シロを むりやり つれて いきましたが、 でて きたのは ごみだけでした。',
        '隣の意地悪なおじいさんはシロを無理やり連れて行きましたが、出てきたのはごみだけでした。',
        'The mean old neighbour dragged Shiro off to dig for him, but all he found was rubbish.'),
      pg('シロの おはかの きで うすを つくると、 また こばんが でました。 うすが もやされると、 おじいさんは その はいを もらいました。',
        'シロのお墓の木で臼を作ると、また小判が出ました。臼が燃やされると、おじいさんはその灰をもらいました。',
        'A mortar made from the tree on Shiro\'s grave made gold too. When the neighbour burned it, the old man kept the ashes.'),
      pg('はいを まくと、 かれた きに はなが さきました。 とのさまは よろこんで、 ごほうびを くれました。',
        '灰をまくと、枯れた木に花が咲きました。殿様は喜んで、ご褒美をくれました。',
        'He scattered the ash, and dead trees burst into blossom. The lord was delighted and rewarded him.'),
    ]),
    heart: { name: 'Shiro', sprite: 'prop:dog', lines: [
      ['ここ ほれ わん わん', 'Koko hore wan wan: dig here, woof woof! ここ here, ほれ dig. Every child in Japan can say it.'],
    ] },
    people: [
      { name: 'Hanasaka-jiisan', sprite: 'folk:oldman:hanasaka', lines: [
        ['かれきに はなを さかせましょう', 'Kareki ni hana wo sakasemashou: let\'s make the dead trees bloom! ～ましょう means "let\'s".'],
        [undefined, 'Kindness kept coming back to us, even after the worst was done to Shiro.'],
      ] },
      { name: 'The Jealous Neighbour', sprite: 'folk:oldman:neighbour', lines: [
        ['ずるい！', 'Zurui: no fair! When I threw the ash, it flew in the lord\'s eyes. I was punished, of course.'],
      ] },
      { name: 'The Lord', sprite: 'folk:noble:hanasaka_lord', lines: [
        ['みごと！', 'Migoto: splendid! Blossoms in winter. Give that old man a reward.'],
      ] },
    ],
  },
  {
    host: 'moon_shrine', scene: 'night', place: 'The Ogres\' Dancing Ground', placeJa: 'おにの おどりば', weather: 'fireflies',
    tale: tale('kobutori', 'The Old Man with the Lump', 'こぶとりじいさん', [
      pg('ほおに おおきな こぶの ある おじいさんが、 やまで あめやどりを して いると、 おにたちが おどりはじめました。',
        '頬に大きなこぶのあるおじいさんが、山で雨宿りをしていると、鬼たちが踊り始めました。',
        'An old man with a big lump on his cheek was sheltering from rain in the hills when a band of ogres began to dance.'),
      pg('おじいさんも たのしく なって、 いっしょに おどりました。 おには よろこんで、 「また こい。 こぶを あずかる」と こぶを とりました。',
        'おじいさんも楽しくなって、一緒に踊りました。鬼は喜んで、「また来い。こぶを預かる」とこぶを取りました。',
        'He couldn\'t help joining in. The ogres loved it, and took his lump "as a pledge you\'ll come back".'),
      pg('となりの こぶの ある おじいさんも まねを しました。 でも おどりが へたで、 おには おこりました。',
        '隣のこぶのあるおじいさんもまねをしました。でも踊りが下手で、鬼は怒りました。',
        'A neighbour with a lump of his own copied him, but he danced badly and grumpily, and the ogres were angry.'),
      pg('「この こぶは かえす！」 おには こぶを くっつけました。 となりの おじいさんは こぶが ふたつに なりました。',
        '「このこぶは返す！」鬼はこぶをくっつけました。隣のおじいさんはこぶが二つになりました。',
        '"Take your lump back!" They stuck the first man\'s lump on him too, and he went home with two.'),
    ]),
    heart: { name: 'Lumpy Old Jirō', sprite: 'folk:oldman:kobutori', lines: [
      ['たのしい！', 'Tanoshii: what fun! When the music starts, the feet move. Even in front of ogres.'],
      [undefined, 'They took my lump and I never went back for it. Don\'t tell them.'],
    ] },
    people: [
      { name: 'Drum Ogre', sprite: 'oni', lines: [
        ['もっと おどれ！', 'Motto odore: dance more! ～え is a rough command form. Ogres don\'t say please.'],
        [undefined, 'We hold that lump as a promise. A promise is a promise, even a lumpy one.'],
      ] },
      { name: 'Grumpy Neighbour Tarobei', sprite: 'folk:oldman:tarobei', lines: [
        ['まねを しただけなのに', 'Mane wo shita dake na no ni: I only copied him! Copying without joy, it turns out, gets you two lumps.'],
      ] },
    ],
  },
  {
    host: 'moon_shrine', scene: 'temple', place: 'Morin-ji Temple', placeJa: 'もりんじ',
    tale: tale('bunbuku', 'The Lucky Teakettle', 'ぶんぶくちゃがま', [
      pg('おてらの おしょうさんが ふるい ちゃがまを ひに かけると、 ちゃがまに あしと しっぽが はえて にげだしました。',
        'お寺のおしょうさんが古い茶釜を火にかけると、茶釜に足としっぽが生えて逃げ出しました。',
        'A temple priest put an old iron teakettle on the fire, and it sprouted legs and a tail and ran away.'),
      pg('ちゃがまは たぬきが ばけた ものでした。 おしょうさんは こわく なって、 くずやに うりました。',
        '茶釜は狸が化けたものでした。おしょうさんは怖くなって、くず屋に売りました。',
        'The kettle was really a tanuki in disguise. The frightened priest sold it to a junk dealer.'),
      pg('たぬきは くずやに 「みせものに して ください」と いいました。 つなわたりを する ちゃがまは だいにんきに なりました。',
        '狸はくず屋に「見せ物にしてください」と言いました。綱渡りをする茶釜は大人気になりました。',
        'The tanuki asked the kindly dealer to put it in a show. A tightrope-walking teakettle was a huge hit.'),
      pg('くずやは おかねもちに なり、 ちゃがまを おてらに かえしました。 いまも おてらで だいじに されて います。',
        'くず屋はお金持ちになり、茶釜をお寺に返しました。今もお寺で大事にされています。',
        'The dealer grew rich and returned the kettle to the temple, where it is treasured to this day.'),
    ]),
    heart: { name: 'Bunbuku the Teakettle', sprite: 'prop:kettle', lines: [
      ['あつい あつい！', 'Atsui, atsui! Hot, hot! Who puts a kettle on the fire? ...Well. Everyone. But still.'],
      ['ぶんぶく', 'Bunbuku is the sound of good luck bubbling over. 茶釜, chagama: the iron kettle of the tea ceremony.'],
    ] },
    people: [
      { name: 'Priest Shukaku', sprite: 'folk:monk:shukaku', lines: [
        ['ばけた！', 'Baketa: it transformed! 化ける, to shape-shift, is what tanuki and foxes do best.'],
      ] },
      { name: 'Jinbei the Junk Dealer', sprite: 'folk:merchant:jinbei', lines: [
        ['いらっしゃい！', 'Roll up! See the teakettle walk the rope! Kindness to an odd kettle made my fortune.'],
      ] },
    ],
  },
  {
    host: 'river_crossing', scene: 'field', place: 'The Persimmon Orchard', placeJa: 'かきの はたけ',
    tale: tale('sarukani', 'The Crab and the Monkey', 'さるかにがっせん', [
      pg('かには おにぎりを もって いました。 さるは かきの たねと とりかえようと いいました。',
        '蟹はおにぎりを持っていました。猿は柿の種と取り替えようと言いました。',
        'A crab had a rice ball. A monkey talked it into trading for a persimmon seed.'),
      pg('かには たねを うえて、 だいじに そだてました。 りっぱな かきの きに なりました。',
        '蟹は種を植えて、大事に育てました。立派な柿の木になりました。',
        'The crab planted the seed and tended it with care until it became a fine persimmon tree.'),
      pg('さるは きに のぼって あまい かきを たべ、 かにに かたい あおい かきを なげつけました。',
        '猿は木に登って甘い柿を食べ、蟹に硬い青い柿を投げつけました。',
        'The monkey climbed it, ate the sweet fruit, and threw hard green persimmons down at the crab.'),
      pg('かにの こどもと、 くりと はちと うすが ちからを あわせて、 さるを こらしめました。',
        '蟹の子どもと、栗と蜂と臼が力を合わせて、猿をこらしめました。',
        'The crab\'s children, with a chestnut, a bee and a rice mortar, joined forces and taught the monkey a lesson.'),
    ]),
    heart: { name: 'The Persimmon Tree', sprite: 'prop:persimmon', lines: [
      ['はやく めを だせ', '"Sprout quick, seed, or I\'ll snip you!" the crab sang every day. かき: persimmon. Autumn\'s fruit.'],
    ] },
    people: [
      { name: 'Kani the Crab', sprite: 'prop:crab', lines: [
        ['かに', 'Kani: crab. Crabs walk sideways, かにあるき. I walked sideways all the way to justice.'],
      ] },
      { name: 'Saru the Monkey', sprite: 'prop:monkey', lines: [
        ['ごめんなさい', 'Gomen nasai: I am sorry. The chestnut burned me, the bee stung me, and the mortar sat on me.'],
      ] },
      { name: 'Usu the Mortar', sprite: 'prop:mortar', lines: [
        ['うす', 'Usu: the big wooden mortar for pounding mochi. Heavy. Patient. Excellent at sitting on monkeys.'],
      ] },
    ],
  },
  {
    host: 'sakura_village', scene: 'house', place: 'The Mouse House', placeJa: 'ねずみの いえ',
    tale: tale('nezumi', 'The Mouse\'s Wedding', 'ねずみの よめいり', [
      pg('ねずみの ふうふは、 むすめを せかいで いちばん つよい ものと けっこんさせたいと おもいました。',
        'ねずみの夫婦は、娘を世界で一番強いものと結婚させたいと思いました。',
        'A mouse couple wanted their daughter to marry the strongest one in the world.'),
      pg('「おひさまが いちばん。」 でも おひさまは 「くもに かくされて しまう」と いいました。 くもは 「かぜに とばされる」と いいました。',
        '「お日様が一番。」でもお日様は「雲に隠されてしまう」と言いました。雲は「風に飛ばされる」と言いました。',
        '"The Sun!" But the Sun said, "Clouds hide me." The Cloud said, "The wind blows me away."'),
      pg('かぜは 「かべには かてない」と いいました。 かべは 「ねずみに かじられて しまう」と いいました。',
        '風は「壁には勝てない」と言いました。壁は「ねずみにかじられてしまう」と言いました。',
        'The Wind said, "I can\'t beat a wall." The Wall said, "But mice gnaw right through me."'),
      pg('いちばん つよいのは ねずみでした。 むすめは となりの ねずみと けっこんしました。',
        '一番強いのはねずみでした。娘は隣のねずみと結婚しました。',
        'So the strongest of all was a mouse. The daughter married the mouse next door, and was very happy.'),
    ]),
    heart: { name: 'Bride Chūko', sprite: 'prop:mouse', lines: [
      ['ちゅう', 'Chuu! Mice say chuu. I wanted the boy next door all along. Parents take the long way round.'],
    ] },
    people: [
      { name: 'Father Mouse', sprite: 'prop:mouse', lines: [
        ['いちばん つよい のは だれ？', 'Who is the strongest? いちばん, number one, makes a superlative: いちばん つよい, the strongest.'],
        [undefined, 'I asked the Sun, the Cloud, the Wind and a Wall. The answer was in my own house.'],
      ] },
      { name: 'The Old Wall', sprite: 'prop:wall', lines: [
        ['かべ', 'Kabe: wall. Nothing knocks me down. Except those little teeth. Chew, chew, chew.'],
      ] },
    ],
  },
  {
    host: 'mountain_pass', scene: 'forest', place: 'The Rolling Rice Ball Hole', placeJa: 'おむすびの あな',
    tale: tale('omusubi', 'The Rolling Rice Ball', 'おむすびころりん', [
      pg('おじいさんが やまで おむすびを たべようと すると、 おむすびが ころころ ころがって あなに おちました。',
        'おじいさんが山でおむすびを食べようとすると、おむすびがころころ転がって穴に落ちました。',
        'An old man was about to eat his rice ball on the mountain when it rolled away, korokoro, into a hole.'),
      pg('あなから うたが きこえました。 「おむすび ころりん すっとんとん。」 おじいさんも あなに はいって しまいました。',
        '穴から歌が聞こえました。「おむすびころりんすっとんとん。」おじいさんも穴に入ってしまいました。',
        'A song came up from the hole: "Rice ball rolling, down it drops!" Then the old man tumbled in too.'),
      pg('あなの なかは ねずみの くにでした。 ねずみたちは おれいに おもちつきを して、 こづちを くれました。',
        '穴の中はねずみの国でした。ねずみたちはお礼にお餅つきをして、小槌をくれました。',
        'Inside was the land of mice. They thanked him with a rice-cake party and gave him a little lucky mallet.'),
      pg('まねを した よくばりな おじいさんは、 ねこの なきまねを して、 ねずみに おいだされました。',
        'まねをした欲張りなおじいさんは、猫の鳴きまねをして、ねずみに追い出されました。',
        'A greedy neighbour copied him, meowed like a cat to scare the mice, and was chased out with nothing.'),
    ]),
    heart: { name: 'The Rice Ball', sprite: 'prop:riceball', lines: [
      ['ころりん', 'Korori-n! A rice ball, still rolling. Some call it おむすび, some おにぎり. Both mean rice pressed by hand.'],
    ] },
    people: [
      { name: 'Grandpa Gonbei', sprite: 'folk:oldman:gonbei', lines: [
        ['おむすび ころりん すっとんとん', 'The mice sang it, and I could not stop humming. Try it: o-mu-su-bi ko-ro-rin!'],
      ] },
      { name: 'Mouse Elder', sprite: 'prop:mouse', lines: [
        ['ぺったん ぺったん', 'Pettan, pettan: the sound of pounding mochi. We pounded all night for the man who fed us.'],
      ] },
    ],
  },
  {
    host: 'mountain_pass', scene: 'snow', place: 'The Six Jizō', placeJa: 'ろくじぞう', weather: 'snow',
    tale: tale('kasajizo', 'The Jizō Statues in Straw Hats', 'かさじぞう', [
      pg('まずしい おじいさんは、 おしょうがつの もちを かう ために、 まちへ かさを うりに いきました。',
        '貧しいおじいさんは、お正月の餅を買うために、町へ笠を売りに行きました。',
        'A poor old man went to town to sell straw hats, hoping to buy rice cakes for New Year.'),
      pg('かさは ひとつも うれませんでした。 かえりみち、 ゆきを かぶった ろくにんの おじぞうさまが いました。',
        '笠は一つも売れませんでした。帰り道、雪をかぶった六人のお地蔵様がいました。',
        'Not one sold. On the way home he passed six stone Jizō statues standing in the snow.'),
      pg('おじいさんは じぞうに かさを かぶせました。 ひとつ たりないので、 じぶんの てぬぐいを かぶせました。',
        'おじいさんは地蔵に笠をかぶせました。一つ足りないので、自分の手ぬぐいをかぶせました。',
        'He put his hats on their heads. One short, he tied his own hand towel on the last.'),
      pg('おおみそかの よる、 そとで おとが しました。 じぞうたちが こめや もちを たくさん おいて いきました。',
        '大晦日の夜、外で音がしました。地蔵たちが米や餅をたくさん置いていきました。',
        'On New Year\'s Eve came footsteps in the snow: the Jizō had left rice and rice cakes piled at his door.'),
    ]),
    heart: { name: 'Stone Jizō', sprite: 'prop:jizo', lines: [
      ['おじぞうさま', 'Ojizou-sama: the stone guardian of travellers and children, in his red bib. He is wearing a straw hat.'],
      [undefined, 'Jizō stand by roads all over Japan. People give them hats, bibs and little offerings.'],
    ] },
    people: [
      { name: 'Old Hat-Maker Sakuzō', sprite: 'folk:oldman:sakuzo', lines: [
        ['さむいでしょう', 'Samui deshou: you must be cold. I said it to stones. でしょう guesses how someone feels.'],
      ] },
      { name: 'Old Wife Ume', sprite: 'folk:oldwoman:ume', lines: [
        ['よい ことを しましたね', 'You did a good thing. No rice cakes for us, I thought. Then the snow outside began to crunch.'],
        ['あけまして おめでとう', 'Akemashite omedetou: Happy New Year! Said from the first of January.'],
      ] },
    ],
  },
];
