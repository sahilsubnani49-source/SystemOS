import type { WordArea } from './words';

// Arc 5 reading passages, in the style of the JLPT N3 reading section: a short
// notice, letter or rune-scroll, then one comprehension question.
//
// The question and the four choices are in ENGLISH, so the item tests whether
// the learner understood the Japanese, not whether they can decode a Japanese
// question. Each wrong choice is written by hand to be plausible but clearly
// contradicted by the text (a detail flipped, a day swapped, a reason inverted).
//
// Ids are `p-<n>` and are save-file keys: append new passages, never renumber.

export type PassageArea = Extract<WordArea, 'coast' | 'glacier' | 'forge' | 'valor' | 'runeforge'>;

export interface Passage {
  id: string;
  /** Two or three Japanese sentences. Only kanji taught by `area` or earlier. */
  text: string;
  /** English comprehension question. */
  question: string;
  answer: string;
  wrong: [string, string, string];
  area: PassageArea;
}

type Row = [text: string, question: string, answer: string, wrong: [string, string, string]];

const DATA: Record<PassageArea, Row[]> = {
  coast: [
    [
      '北の軍が海から来ました。村の人たちは山へにげました。兵たちは村を守るために、のこりました。',
      'Why did the soldiers stay behind?',
      'To protect the village',
      ['To attack the northern army', 'To climb the mountain', 'To go out to sea'],
    ],
    [
      '王は会議で、戦争をやめると決めました。でも、多くの兵はまだ戦いたいと言いました。',
      'What did the king decide at the meeting?',
      'To stop the war',
      ['To start a war', 'To choose new soldiers', 'To leave the country'],
    ],
    [
      'この国の歴史は長いです。むかしは王がいましたが、今は国民が政府を選びます。',
      'Who chooses the government now?',
      'The citizens',
      ['The king', 'The soldiers', 'The ministers of old'],
    ],
    [
      'あした、海で大きな勝負があります。勝った人は、女王からたくさんのお金をもらいます。',
      'What does the winner receive?',
      'A lot of money from the queen',
      ['A sword from the king', 'A ship from the prince', 'Nothing; it is only practice'],
    ],
  ],
  glacier: [
    [
      '兄は毎日おそくまで働いています。給料は高いですが、いつも疲れていて、あまり笑いません。',
      'How is the older brother described?',
      'He is well paid but always tired',
      ['He is poorly paid but cheerful', 'He works only in the mornings', 'He laughs all the time'],
    ],
    [
      '友だちからメールが来て、とても喜びました。でも、メールには「もう会えない」と書いてあって、悲しくなりました。',
      'Why did the writer become sad?',
      'The message said they could not meet again',
      ['No message came', 'The friend was angry', 'The message was lost'],
    ],
    [
      'この店の商品は安いので、よく売れます。でも、このごろは物価が上がって、店の人はこまっています。',
      'What is troubling the shopkeeper?',
      'Prices have been rising',
      ['The goods are too expensive to sell', 'Nobody comes to the shop', 'The shop is closing tomorrow'],
    ],
    [
      'ぼくの願いは、自分の店を持つことです。そのために、毎月少しずつ貯金しています。',
      'Why does the writer save money every month?',
      'To own a shop someday',
      ['To pay back a friend', 'To buy a ship', 'To travel abroad'],
    ],
  ],
  forge: [
    [
      '今朝は雪がたくさん降りました。とても寒いので、子どもたちは外で遊ばないで、家の中で寝ていました。',
      'What did the children do this morning?',
      'They stayed inside and slept',
      ['They played in the snow', 'They went swimming', 'They climbed the mountain'],
    ],
    [
      'この島は冬でも暖かいです。夏は暑いので、人々は毎日海で泳ぎます。',
      'What is true about the island?',
      'It is warm even in winter',
      ['It snows every winter', 'Nobody swims in summer', 'Summer there is cool'],
    ],
    [
      'ドアを押しても開きません。引いてください。',
      'How should you open the door?',
      'Pull it',
      ['Push it', 'Knock on it', 'Wait for someone'],
    ],
    [
      '山に登るとちゅうで、さいふを落としました。下りるとき、知らない人が拾ってくれました。',
      'Who found the wallet?',
      'A stranger, on the way down',
      ['The writer, at the top', 'A friend, at the station', 'Nobody; it was never found'],
    ],
  ],
  valor: [
    [
      '天気予報によると、あしたは雨だそうです。山へ行く予定を変えるかどうか、みんなで相談しました。',
      'What did everyone discuss?',
      'Whether to change the plan to go to the mountains',
      ['Which umbrella to buy', 'Whether the forecast was wrong', 'Where to have lunch'],
    ],
    [
      '先週、会社に新しい人が来ました。社長が紹介してくれたので、すぐに友達になりました。',
      'How did the writer meet the new person?',
      'The company president introduced them',
      ['They met at the station', 'They were old school friends', 'The new person sent a letter'],
    ],
    [
      'わたしは毎日日記を書いています。初めて書いたのは十年前で、今もずっと続いています。',
      'When did the writer start keeping a diary?',
      'Ten years ago',
      ['Last week', 'Ten days ago', 'They have not started yet'],
    ],
    [
      '本を借りたら、二週間のうちに返してください。おくれる時は、図書室に連絡してください。',
      'What should you do if you will be late returning a book?',
      'Contact the library room',
      ['Buy a new copy', 'Return it after one month', 'Nothing; there is no deadline'],
    ],
  ],
  runeforge: [
    [
      'この町は道路がせまくて、とても不便です。それで、町の人たちは新しい道を作ることにしました。',
      'Why are the townspeople building a new road?',
      'The roads are narrow and inconvenient',
      ['The old road was destroyed in a war', 'The king ordered it', 'They want to reach the airport'],
    ],
    [
      '実は、わたしはまだひこうきに乗ったことがありません。来月の旅行で、初めて空港へ行きます。',
      'What will the writer do for the first time next month?',
      'Go to an airport',
      ['Ride a ship', 'Visit a friend overseas', 'Buy a car'],
    ],
    [
      'ホテルの二階に、きれいなへやがありました。でも、駅から遠いので、結局ほかの宿にとまりました。',
      'Why did the writer stay somewhere else?',
      'The hotel was far from the station',
      ['The room was dirty', 'The hotel was full', 'The room was on the second floor'],
    ],
    [
      'このけんを使う前に、必ず火の色を見てください。色が赤い時は、まだ使わないでください。',
      'What must you always do before using the sword?',
      'Check the colour of the fire',
      ['Sharpen it', 'Wait until it turns red', 'Ask the smith for permission'],
    ],
  ],
};

export const PASSAGES: Passage[] = (Object.keys(DATA) as PassageArea[])
  .flatMap((area) => DATA[area].map(([text, question, answer, wrong]) => ({ text, question, answer, wrong, area })))
  .map((p, n) => ({ ...p, id: `p-${n + 1}` }));

const BY_ID = new Map(PASSAGES.map((p) => [p.id, p]));

export function getPassage(id: string): Passage | undefined {
  return BY_ID.get(id);
}

export function passagesForArea(area: PassageArea): Passage[] {
  return PASSAGES.filter((p) => p.area === area);
}
