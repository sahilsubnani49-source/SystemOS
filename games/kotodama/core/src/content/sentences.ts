import type { WordArea } from './words';

// Arc 4 context sentences: read a whole sentence and pick the word for the blank.
// Each sentence lists its OWN wrong answers, chosen by hand so that none of them
// could also complete it. Random decoys would sometimes fit, and a learner
// marked wrong for a valid answer learns the wrong lesson.
//
// Ids are `c-<n>` and are save-file keys: append new sentences, never renumber.

export interface Sentence {
  id: string;
  /** Japanese with exactly one ＿＿ blank. */
  text: string;
  /** English translation (shown as a hint under the sentence). */
  en: string;
  answer: string;
  wrong: [string, string, string];
  area: Extract<WordArea, 'foothills' | 'village' | 'monastery' | 'forest' | 'peaks'>;
}

type Row = [text: string, en: string, answer: string, wrong: [string, string, string]];

const DATA: Record<Sentence['area'], Row[]> = {
  foothills: [
    ['わたしの＿＿は医者です。', 'My older brother is a doctor.', '兄', ['夏', '朝', '夜']],
    ['＿＿はさくらがきれいです。', 'In spring, the cherry blossoms are beautiful.', '春', ['家族', '医者', '店員']],
    ['父は＿＿です。', 'My father is an office worker.', '会社員', ['夏休み', '今夜', '冬']],
    ['ちょっと＿＿ください。', 'Please wait a moment.', '待って', ['夜中', '兄弟', '春休み']],
    ['＿＿、テレビを見ました。', 'This morning, I watched TV.', '今朝', ['待つ', '急ぐ', '始める']],
    ['＿＿は五人です。', 'My family is five people.', '家族', ['毎朝', '急ぐ', '冬休み']],
  ],
  village: [
    ['この＿＿はとてもおいしいです。', 'This cooking is very tasty.', '料理', ['黒い', '売る', '遠い']],
    ['＿＿を飲みませんか。', 'Won\'t you drink some green tea?', 'お茶', ['牛肉', '品物', '茶色']],
    ['駅はここから＿＿です。', 'The station is far from here.', '遠い', ['ご飯', '料理', '牛肉']],
    ['このかばんは＿＿です。', 'This bag is heavy.', '重い', ['飲み物', '買い物', 'お茶']],
    ['あの店で＿＿をしました。', 'I did some shopping at that shop.', '買い物', ['赤い', '弱い', '近い']],
    ['空が＿＿です。', 'The sky is blue.', '青い', ['食べ物', '品物', '牛肉']],
  ],
  monastery: [
    ['毎日、日本語を＿＿しています。', 'I study Japanese every day.', '勉強', ['病院', '答え', '頭']],
    ['この＿＿はむずかしいです。', 'This problem is difficult.', '問題', ['教える', '死ぬ', '習う']],
    ['先生に＿＿を習います。', 'I learn English from the teacher.', '英語', ['病気', '大学院', '病院']],
    ['あしたは＿＿があります。', 'There is an exam tomorrow.', '試験', ['教える', '習う', '死ぬ']],
    ['母は＿＿で入院しています。', 'My mother is in hospital with an illness.', '病気', ['答え', '文字', '漢字']],
    ['かれは子どもに日本語を＿＿。', 'He teaches Japanese to children.', '教えます', ['病院', '問題', '文学']],
  ],
  forest: [
    ['毎朝、この道を＿＿。', 'Every morning, I walk along this road.', '歩きます', ['子犬', '海外', '西洋']],
    ['六時に＿＿。', 'I get up at six.', '起きます', ['西洋', '子犬', '運転']],
    ['友だちに本を＿＿。', 'I borrow a book from a friend.', '借ります', ['走ります', '起きます', '止まります']],
    ['かれは車の＿＿が上手です。', 'He is good at driving a car.', '運転', ['子犬', '借りる', '帰る']],
    ['かぜをひいたので、早く家に＿＿。', 'I caught a cold, so I will go home early.', '帰ります', ['子犬', '西洋', '運動']],
    ['バスはここに＿＿か。', 'Does the bus stop here?', '止まります', ['歩きます', '貸します', '持ちます']],
  ],
  peaks: [
    ['この漢字の＿＿はなんですか。', 'What is the meaning of this kanji?', '意味', ['作る', '同じ', '歌う']],
    ['日曜日に＿＿を見に行きました。', 'On Sunday I went to see a film.', '映画', ['思う', '知る', '開ける']],
    ['＿＿で本を借ります。', 'I borrow books at the library.', '図書館', ['考える', '楽しい', '自分']],
    ['かれは＿＿な歌手です。', 'He is a famous singer.', '有名', ['地図', '時計', '出発']],
    ['あしたは＿＿があるので、行けません。', 'I have an errand tomorrow, so I can\'t go.', '用事', ['楽しい', '同じ', '開ける']],
    ['車に＿＿してください。', 'Please watch out for cars.', '注意', ['世界', '本屋', '映画館']],
  ],
};

export const SENTENCES: readonly Sentence[] = (Object.keys(DATA) as Sentence['area'][])
  .flatMap((area) => (DATA[area] as Row[]).map(([text, en, answer, wrong]) => ({ text, en, answer, wrong, area })))
  .map((s, n) => ({ ...s, id: `c-${n + 1}` }));

const BY_ID = new Map(SENTENCES.map((s) => [s.id, s]));

export function getSentence(id: string): Sentence {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown sentence id: ${id}`);
  return s;
}

export function sentencesForArea(area: Sentence['area']): Sentence[] {
  return SENTENCES.filter((s) => s.area === area);
}
