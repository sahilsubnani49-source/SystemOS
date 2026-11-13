import type { LessonArea } from './words';

// Listening exercises for the Terakoya. Nothing is shown but a speaker and a
// question in English: the player hears one or more lines and picks the answer.
// The text appears only afterwards, on the reveal, with its translation.
//
// Three kinds, in the spirit of a first-year course's listening practice:
//   numbers   a time, a price or a phone number (the classic first drill)
//   meaning   one sentence: what was said?
//   dialogue  two or three lines between two people: what happened?
//
// Written in kana with spaces between words, so the neural voice reads every
// line (a test checks this). Every line was written for this game. Ids are
// `l-<n>` and are save-file keys: append, never renumber.

export interface Listening {
  id: string;
  /** Spoken in order, as one recording. */
  lines: string[];
  /** The whole thing in English, shown on the reveal. */
  en: string;
  /** Shown under the speaker, in English. */
  question: string;
  answer: string;
  wrong: [string, string, string];
  area: LessonArea;
}

type Row = [lines: string[], en: string, question: string, answer: string, wrong: [string, string, string]];

const DATA: Record<LessonArea, Row[]> = {
  lesson1: [
    [['いま ごご にじ はんです。'], 'It is half past two in the afternoon.', 'What time is it?', '2:30 p.m.', ['7:30 p.m.', '2:30 a.m.', '12:30 p.m.']],
    [['この かさは せんごひゃく えんです。'], 'This umbrella is 1,500 yen.', 'How much is the umbrella?', '1,500 yen', ['1,050 yen', '5,000 yen', '15,000 yen']],
    [['わたしの でんわばんごうは よん きゅう ろく の いち はち さん です。'], 'My phone number is 496-183.', 'What is the phone number?', '496-183', ['469-183', '496-138', '476-183']],
    [['はじめまして。 キムです。 かんこくから きました。 だいがくせいです。'], 'Nice to meet you. I am Kim. I came from Korea. I am a university student.', 'Where is Kim from?', 'Korea', ['China', 'Japan', 'America']],
    [['すみません、 トイレは どこですか。', 'あそこです。 としょかんの となりです。'], 'Excuse me, where is the toilet? / Over there. Next to the library.', 'Where is the toilet?', 'Next to the library', ['Inside the library', 'Next to the school', 'Behind the bank']],
    [['これは だれの ほんですか。', 'たなかさんの ほんです。'], "Whose book is this? / It is Mr. Tanaka's book.", 'Whose book is it?', "Mr. Tanaka's", ["The teacher's", "Kim's", 'The speaker\'s own']],
    [['その とけいは いくらですか。', 'さんまん えんです。'], 'How much is that watch? / It is 30,000 yen.', 'How much is the watch?', '30,000 yen', ['3,000 yen', '300,000 yen', '13,000 yen']],
    [['しつれいですが、 せんこうは なんですか。', 'れきしです。 にほんの れきしです。'], 'Excuse me, but what is your major? / History. Japanese history.', 'What is the major?', 'History', ['Economics', 'Japanese', 'Science']],
  ],
  lesson2: [
    [['まいにち ろくじに おきます。 しちじに あさごはんを たべます。'], 'I get up at six every day. I eat breakfast at seven.', 'When is breakfast?', 'At 7:00', ['At 6:00', 'At 8:00', 'At 4:00']],
    [['どようびに ともだちと えいがを みました。'], 'On Saturday I saw a movie with a friend.', 'What did they do on Saturday?', 'Saw a movie with a friend', ['Read at the library', 'Studied at school', 'Worked all day']],
    [['あした いっしょに コーヒーを のみませんか。', 'いいですね。 のみましょう。'], "Won't you have a coffee with me tomorrow? / Sounds good. Let's.", 'What is the answer to the invitation?', "Yes, let's", ['No, thank you', "I don't drink coffee", 'Maybe next week']],
    [['しゅうまつは うちで べんきょうします。 にちようびは はたらきます。'], 'At the weekend I study at home. On Sunday I work.', 'What do they do on Sunday?', 'Work', ['Study at home', 'Go to school', 'See a movie']],
    [['きのうは としょかんへ いきませんでした。 がっこうで べんきょうしました。'], "Yesterday I didn't go to the library. I studied at school.", 'Where did they study yesterday?', 'At school', ['At the library', 'At home', "At a friend's house"]],
    [['よる じゅういちじに ねます。'], 'I go to bed at eleven at night.', 'When do they go to bed?', '11 p.m.', ['10 p.m.', '7 p.m.', '1 a.m.']],
    [['だいがくの まえに ほんやが あります。 ほんやの となりに ぎんこうが あります。'], 'There is a bookshop in front of the university. Next to the bookshop there is a bank.', 'What is next to the bookshop?', 'A bank', ['The university', 'A library', 'A café']],
    [['こうえんに こどもが さんにん います。 いぬも います。'], 'There are three children in the park. There is a dog too.', 'Who is in the park?', 'Three children and a dog', ['Two children and a cat', 'Three adults and a dog', 'One child and two dogs']],
  ],
  lesson3: [
    [['この レストランは やすくて おいしいです。'], 'This restaurant is cheap and tasty.', 'What is the restaurant like?', 'Cheap and tasty', ['Expensive but tasty', 'Cheap but not tasty', 'Quiet and new']],
    [['きのうの テストは むずかしくなかったです。'], "Yesterday's test was not difficult.", 'How was the test?', 'It was not difficult', ['It was difficult', 'It will be difficult', 'It was very long']],
    [['ここで しゃしんを とっても いいですか。', 'すみません、 ここは ちょっと…'], "May I take a photo here? / Sorry, here it's a bit...", 'May they take photos here?', 'No', ['Yes', 'Only outside', 'Only today']],
    [['すみません、 まどを あけて ください。 あついです。'], "Excuse me, please open the window. It's hot.", 'Why open the window?', "It's hot", ["It's cold", "It's quiet", "It's dark"]],
    [['わたしの まちは しずかで、 きれいです。 でも、 ちょっと ふべんです。'], 'My town is quiet and pretty. But it is a little inconvenient.', 'How is the town described?', 'Quiet, pretty, a little inconvenient', ['Lively, pretty and convenient', 'Quiet, old and dirty', 'Busy and expensive']],
    [['ねこが すきです。 でも、 いぬは あまり すきじゃありません。'], "I like cats. But I don't like dogs very much.", 'How do they feel about dogs?', "They don't like them much", ['They love them', 'They are scared of them', 'They own one']],
    [['あさ おきて、 シャワーを あびて、 コーヒーを のみます。'], 'In the morning I get up, shower, and drink coffee.', 'What do they do second?', 'Take a shower', ['Drink coffee', 'Get up', 'Eat breakfast']],
    [['この シャツは いくらですか。', 'にせん はっぴゃく えんです。', 'じゃあ、 これを ください。'], "How much is this shirt? / 2,800 yen. / Then I'll take it.", 'How much is the shirt?', '2,800 yen', ['2,080 yen', '8,200 yen', '28,000 yen']],
  ],
  lesson4: [
    [['あには とうきょうに すんで います。 ぎんこうで はたらいて います。'], 'My older brother lives in Tokyo. He works at a bank.', 'What does the older brother do?', 'Works at a bank', ['Studies in Tokyo', 'Works at a school', 'Lives in Osaka']],
    [['あしたは さむいと おもいます。'], 'I think it will be cold tomorrow.', 'What does the speaker think?', 'It will be cold tomorrow', ['It was cold yesterday', 'It will be hot tomorrow', 'It is cold now']],
    [['にほんで すしを たべた ことが あります。 でも、 ふじさんに のぼった ことは ありません。'], "I have eaten sushi in Japan. But I have never climbed Mt. Fuji.", 'What have they never done?', 'Climbed Mt. Fuji', ['Eaten sushi', 'Been to Japan', 'Eaten in Japan']],
    [['しゅうまつ、 なにを しましたか。', 'そうじを したり、 せんたくを したり しました。'], 'What did you do at the weekend? / Things like cleaning and doing the laundry.', 'What did they do at the weekend?', 'Cleaning, laundry and so on', ['Went to the movies', 'Nothing at all', 'Visited a friend']],
    [['たなかさんは きょう びょうきで、 がっこうを やすむと いって いました。'], 'Mr. Tanaka said he is ill today and will be absent from school.', 'What did Mr. Tanaka say?', 'He is ill and will miss school', ['He will be late for school', 'He has a lot of homework', 'He is going on a trip']],
    [['なつと ふゆと、 どちらが すきですか。', 'ふゆの ほうが すきです。 ゆきが すきですから。'], 'Summer or winter, which do you like? / I like winter more, because I like snow.', 'Which season, and why?', 'Winter, because of the snow', ['Summer, because of the sea', 'Winter, because it is quiet', 'Summer, because it is hot']],
    [['あの あかい シャツを きて いる ひとが キムさんです。'], 'The person wearing that red shirt is Kim.', 'Which one is Kim?', 'The one in the red shirt', ['The one in the red hat', 'The one in the blue shirt', 'The one in red shoes']],
    [['でんしゃに のる まえに、 きっぷを かって ください。 わすれないで ください。'], "Before you get on the train, please buy a ticket. Please don't forget.", 'What must you not forget?', 'To buy a ticket first', ['To get off at the next stop', 'To bring an umbrella', 'To call before coming']],
  ],
  lesson5: [
    [['とうきょうから おおさかまで しんかんせんで にじかん はん かかります。'], 'From Tokyo to Osaka takes two and a half hours by shinkansen.', 'How long does the trip take?', '2 and a half hours', ['2 hours', '3 and a half hours', '1 and a half hours']],
    [['なつやすみに なにを しますか。', 'ほっかいどうへ いく つもりです。 ふねで いきます。'], 'What will you do in the summer holidays? / I plan to go to Hokkaido. By ship.', 'How will they travel?', 'By ship', ['By plane', 'By train', 'By bicycle']],
    [['きのう かった あおい かさを でんしゃに わすれました。'], 'I left the blue umbrella I bought yesterday on the train.', 'What was left on the train?', 'A blue umbrella bought yesterday', ['A red umbrella', 'A blue bag', 'A black umbrella bought today']],
    [['でんしゃと バスと どちらが はやいですか。', 'でんしゃの ほうが ずっと はやいですよ。'], 'Which is faster, the train or the bus? / The train, by far.', 'Which is faster?', 'The train, by far', ['The bus', 'Both the same', 'The bus, a little']],
    [['しゅくだいは もう しましたか。', 'いいえ、 まだ して いません。 これから します。'], 'Have you done your homework? / No, not yet. I will now.', 'Has the homework been done?', 'Not yet; they will do it now', ['Yes, already', 'They forgot it', 'There was no homework']],
    [['きせつの なかで ふゆが いちばん すきです。 ゆきが きれいですから。'], 'Of the seasons I like winter best, because the snow is beautiful.', 'Which season is the favourite?', 'Winter', ['Spring', 'Summer', 'Autumn']],
    [['やすみに どこか いきましたか。', 'いいえ、 どこにも いきませんでした。 うちで ねて いました。'], 'Did you go anywhere on your break? / No, nowhere. I slept at home.', 'What did they do on the break?', 'Stayed home and slept', ['Went to the sea', 'Visited family', 'Went to work']],
    [['えきの まえで しろい シャツを きて いる ひとが わたしの あにです。'], 'The person in a white shirt in front of the station is my older brother.', 'How do you spot the brother?', 'White shirt, in front of the station', ['Black shirt, in the station', 'White hat, in the park', 'White shirt, on the train']],
  ],
  lesson6: [
    [['どうしたんですか。', 'あたまが いたいんです。 きのうから ねつも あります。'], "What's wrong? / I have a headache. And a fever since yesterday.", "What's wrong?", 'Headache, and a fever since yesterday', ['Stomachache since yesterday', 'Sore throat since this morning', 'Fever since last week']],
    [['ケーキを みっつも たべたんです。 たべすぎました。'], 'I ate three whole cakes. I ate too much.', 'Why do they feel bad?', 'They ate three cakes', ['They ate nothing', 'They drank too much', 'They slept too little']],
    [['かぜなら、 はやく ねた ほうが いいですよ。 おふろには はいらない ほうが いいです。'], "If it's a cold, you'd better go to bed early. Better not to take a bath.", 'What is the advice?', 'Sleep early and skip the bath', ['Take a hot bath', 'Go to work as usual', 'Eat a lot']],
    [['すみません、 きょうは ちょうしが わるいので、 はやく かえっても いいですか。'], "Sorry, I'm not feeling well today; may I go home early?", 'What do they ask?', 'To go home early', ['To come in late', 'For some medicine', 'To see a doctor']],
    [['この くすりは いちにち さんかい、 しょくじの あとで のんで ください。'], 'Take this medicine three times a day, after meals.', 'How is the medicine taken?', 'Three times a day, after meals', ['Twice a day, before meals', 'Three times a day, before meals', 'Once a day, at night']],
    [['あしたは しけんなので、 こんばん べんきょうしなければ いけません。'], 'There is an exam tomorrow, so I have to study tonight.', 'Why must they study tonight?', 'There is an exam tomorrow', ['There was an exam today', 'They have homework', 'The teacher said so']],
    [['こどもの とき、 よく びょういんへ いきました。 からだが よわかったんです。'], 'As a child I often went to hospital. I was physically weak, you see.', 'Why the many hospital visits as a child?', 'They were physically weak', ['Their father was a doctor', 'They lived next door to it', 'They broke a leg']],
    [['あしたは はれるでしょうか。', 'てんきよほうでは、 ごごから あめでしょう。'], 'Will it be sunny tomorrow? / The forecast says rain from the afternoon.', 'What is the forecast?', 'Rain from the afternoon', ['Sunny all day', 'Rain in the morning', 'Snow from the afternoon']],
  ],
  lesson7: [
    [['わたしは ギターが ひけます。 でも、 うたは あまり うたえません。'], "I can play the guitar. But I can't really sing.", 'What can the speaker do?', 'Play the guitar', ['Sing well', 'Play the piano', 'Dance']],
    [['この みせは やすいし、 おいしいし、 みせの ひとも しんせつです。'], 'This shop is cheap, tasty, and the staff are kind too.', 'Why is the shop good?', 'Cheap, tasty, kind staff', ['Close to the station', 'Open late', 'Quiet and new']],
    [['あの ケーキ、 おいしそうですね。', 'じゃあ、 ひとつ たべて みましょう。'], "That cake looks delicious. / Then let's try one.", 'What will they do?', 'Try one of the cakes', ['Buy a present', 'Bake a cake', 'Leave the shop']],
    [['にほんごの じしょなら、 この ほんやに たくさん ありますよ。'], "If it's a Japanese dictionary you want, this bookshop has plenty.", 'What is the suggestion?', 'This bookshop has many dictionaries', ['Borrow one from the library', 'Buy one online', 'Ask the teacher']],
    [['たんじょうびに あねが セーターを くれました。 わたしは あねに はなを あげました。'], 'For my birthday my sister gave me a sweater. I gave my sister flowers.', 'What did the speaker give?', 'Flowers, to the sister', ['A sweater, to the sister', 'Flowers, to the mother', 'A book, to the sister']],
    [['あしたは あめが ふるかもしれません。 かさを もって いった ほうが いいですよ。'], "It might rain tomorrow. You'd better take an umbrella.", 'Why take an umbrella?', 'It might rain tomorrow', ['It is raining now', 'It will surely rain', 'The sun is strong']],
    [['ねむいなら、 すこし ねたら どうですか。'], "If you're sleepy, why not sleep a little?", 'What is suggested?', 'A short sleep', ['A cup of coffee', 'A walk outside', 'Going home']],
    [['わたしは いま あたらしい パソコンが いちばん ほしいです。'], 'Right now, what I want most is a new computer.', 'What do they want most?', 'A new computer', ['A new phone', 'A new bicycle', 'An old computer']],
  ],
  lesson8: [
    [['なつやすみ、 どこへ いく つもりですか。', 'きょうとへ いこうと おもって います。 りょかんに とまりたいんです。'], "Where are you going this summer? / I'm thinking of Kyoto. I want to stay at a ryokan.", 'Where do they want to stay?', 'At a Japanese inn', ['At a hotel', "At a friend's house", 'At a temple']],
    [['りょこうの まえに、 ちずを しらべて おきます。'], "Before the trip I'll look up the map.", 'What will they do before the trip?', 'Look up a map', ['Buy souvenirs', 'Book a hotel', 'Pack a bag']],
    [['これは にほんで かった おみやげです。 どうぞ。'], 'This is a souvenir I bought in Japan. Here you are.', 'What is being given?', 'A souvenir from Japan', ['A library book', 'A birthday cake', 'A souvenir from Korea']],
    [['すみません、 えきへ いく みちを おしえて いただけませんか。'], 'Excuse me, could you tell me the way to the station?', 'What are they asking for?', 'Directions to the station', ['A train ticket', 'The time', 'A map to borrow']],
    [['けさ、 ははが おこして くれなかったので、 じゅぎょうに まにあいませんでした。'], "This morning my mother didn't wake me, so I missed the start of class.", 'Why were they late?', "Their mother didn't wake them", ['The train was late', 'They were ill', 'They forgot the time']],
    [['いい てんきだと いいですね。', 'ええ、 あめだったら こまりますね。'], "I hope the weather is good. / Yes, rain would be a problem.", 'What do they hope for?', 'Good weather', ['Rain', 'Snow', 'A day off']],
    [['ともだちに ノートを かして あげました。 でも、 まだ かえして くれません。'], "I lent my friend my notebook. But they still haven't given it back.", 'What is the problem?', 'The notebook has not come back', ['The friend lost it', 'It was borrowed from the friend', 'The wrong notebook came back']],
    [['けさ えきで さいふを なくした ひとは、 じむしょへ きて ください。'], 'Whoever lost a wallet at the station this morning, please come to the office.', 'Who should come to the office?', 'Whoever lost a wallet this morning', ['Whoever found a wallet', 'Whoever lost a bag yesterday', 'The station staff']],
  ],
  lesson9: [
    [['てんきよほうに よると、 あしたは ゆきが ふるそうです。'], 'According to the forecast, it will snow tomorrow.', 'What does the forecast say?', 'Snow tomorrow', ['Rain tomorrow', 'It is snowing now', 'It snowed yesterday']],
    [['ねえ、 きいた？ たなかさん、 らいげつ けっこんするって。'], "Hey, did you hear? Tanaka's getting married next month.", 'What is the news about Tanaka?', 'Getting married next month', ['Moving next month', 'Got married last month', 'Changing jobs']],
    [['しごとが おわったら、 でんわして ください。'], 'Please call me when work is finished.', 'When should they call?', 'When work is over', ['Before work', 'At lunch', 'Tomorrow morning']],
    [['ドアが あいて いますね。', 'あ、 さっき しめたのに。 かぜで あいたんでしょう。'], 'The door is open. / Oh, I shut it just now. The wind must have opened it.', 'Why is the door open?', 'The wind opened it', ['Someone opened it', 'It was never shut', 'It is broken']],
    [['しまった！ でんしゃに かさを わすれて しまいました。'], 'Oh no! I left my umbrella on the train.', 'What happened?', 'An umbrella was left on the train', ['They missed the train', 'They lost a ticket', 'The umbrella broke']],
    [['この ボタンを おすと、 おゆが でます。 きを つけて ください。'], 'Press this button and hot water comes out. Be careful.', 'What happens when you press it?', 'Hot water comes out', ['A light comes on', 'A door opens', 'Cold water comes out']],
    [['おんがくを ききながら べんきょうするのは よくないですよ。'], 'Studying while listening to music is not good.', 'What is not good?', 'Studying with music on', ['Music at night', 'Studying late', 'Eating while studying']],
    [['もっと はやく よやくすれば よかったです。 もう せきが ありません。'], 'I should have booked earlier. There are no seats left.', 'What do they regret?', 'Not booking earlier', ['Booking the wrong seat', 'Arriving late', 'Booking at all']],
  ],
  lesson10: [
    [['しゃちょうは もう おかえりに なりました。'], 'The president has already gone home.', 'Where is the president?', 'Gone home', ['In a meeting', 'Just arrived', 'At lunch']],
    [['せんせい、 なにを めしあがりますか。', 'そうですね、 おちゃを いただきます。'], "Sensei, what will you have? / Let me see... I'll have tea.", 'What will the teacher have?', 'Tea', ['Coffee', 'Cake', 'Nothing']],
    [['はじめまして。 やまだと もうします。 どうぞ よろしく おねがいいたします。'], 'How do you do. My name is Yamada. I am pleased to meet you.', 'What is the speaker doing?', 'A polite self-introduction', ['Apologizing', 'Saying goodbye', 'Asking the way']],
    [['あした ごご にじに そちらへ うかがっても よろしいでしょうか。'], 'Would it be all right if I called on you at 2 p.m. tomorrow?', 'What are they asking?', 'May they visit at 2 tomorrow', ['Can the other person visit', 'Is the shop open at 2', 'Can they leave at 2']],
    [['てつだって くれて、 ほんとうに ありがとう。 たすかりました。'], 'Thank you so much for helping. You saved me.', 'Why the thanks?', 'For helping', ['For a present', 'For waiting', 'For a meal']],
    [['この じしょは じが おおきくて、 みやすいです。'], 'This dictionary has big print and is easy to read.', 'Why is the dictionary good?', 'Big print, easy to read', ['It is light', 'It is cheap', 'It has pictures']],
    [['かいぎが なんじに おわるか、 まだ わかりません。'], "We don't know yet what time the meeting ends.", 'What is not known yet?', 'When the meeting ends', ['Where the meeting is', 'Who will come', 'If there is a meeting']],
    [['きむらさんは きょう くる はずです。 きのう でんわで そう いって いましたから。'], 'Kimura should come today. That is what Kimura said on the phone yesterday.', 'Why expect Kimura today?', 'Kimura said so yesterday', ['Kimura always comes', 'Kimura is the teacher', 'Kimura sent a letter']],
  ],
  lesson11: [
    [['でんしゃの なかで だれかに あしを ふまれました。 いたかったです。'], 'On the train someone stepped on my foot. It hurt.', 'What happened on the train?', 'Someone stepped on their foot', ['They stepped on someone', 'They fell over', 'Their bag was stolen']],
    [['きのう どろぼうに さいふを ぬすまれました。'], 'Yesterday a thief stole my wallet.', 'What happened yesterday?', 'A wallet was stolen', ['They caught a thief', 'They found a wallet', 'They lost their keys']],
    [['こどもの ころ、 ははに まいにち やさいを たべさせられました。'], 'As a child, my mother made me eat vegetables every day.', 'What were they made to do?', 'Eat vegetables every day', ['Practise piano', 'Study every day', 'Clean their room']],
    [['まどが あけて ありますね。', 'ええ、 へやが あついので、 わたしが あけて おきました。'], "The window's been opened. / Yes, the room is hot, so I opened it.", 'Why is the window open?', 'The room is hot, so they opened it', ['The wind opened it', 'Someone forgot to shut it', 'To let the cat out']],
    [['あめが ふっても、 しあいは あります。'], 'Even if it rains, the match is on.', 'What about the match?', 'It goes ahead even in rain', ['It is cancelled if it rains', 'It was cancelled', 'It starts later if it rains']],
    [['らいねんから まいあさ はしる ことに しました。'], 'I have decided to run every morning from next year.', 'What have they decided?', 'To run every morning from next year', ['To stop running', 'To run every evening', 'To start next month']],
    [['たくさん れんしゅうしたのに、 しあいに まけました。'], 'Even though I practised a lot, I lost the match.', 'How do they feel?', 'Let down: they lost despite practising', ['Happy: they won', 'Just tired', 'Glad they skipped practice']],
    [['この くすりを のめば、 すぐ なおりますよ。'], "If you take this medicine, you'll soon get better.", 'What does the speaker say?', 'Take it and you will soon be better', ['It tastes good', 'Stop taking it', 'It only works at night']],
  ],
};

export const LISTENING: readonly Listening[] = (Object.keys(DATA) as LessonArea[])
  .flatMap((area) => DATA[area].map(([lines, en, question, answer, wrong]) => ({ lines, en, question, answer, wrong, area })))
  .map((l, n) => ({ ...l, id: `l-${n + 1}` }));

const BY_ID = new Map(LISTENING.map((l) => [l.id, l]));

export function getListening(id: string): Listening {
  const l = BY_ID.get(id);
  if (!l) throw new Error(`Unknown listening exercise: ${id}`);
  return l;
}

export function listeningFor(area: LessonArea): Listening[] {
  return LISTENING.filter((l) => l.area === area);
}

/** The whole recording as one string, for the speaker. */
export const listeningText = (l: Listening) => l.lines.join(' ');
