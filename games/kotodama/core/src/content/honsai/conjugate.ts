import type { ConjClass } from './words';

// The Verb Forge: Japanese conjugation as plain rules. Every verb and adjective in
// Honsai carries its class from JMdict, so one engine conjugates all of them, both
// the written form (食べる) and its reading (たべる), which differ only for 来る.
//
// Group 2 (ichidan): drop る and add the ending (食べる → 食べます).
// Group 1 (godan): the last kana moves along its row: 書く → 書か/書き/書け/書こ.
// Group 3: する and 来る, learned by heart.

export type VerbForm =
  | 'masu' | 'masen' | 'mashita' | 'masendeshita'
  | 'nai' | 'ta' | 'nakatta' | 'te' | 'teiru' | 'tara' | 'tai' | 'sugiru'
  | 'potential' | 'volitional' | 'passive' | 'causative' | 'causpass' | 'ba';
/** Forms each class conjugates directly; the rest are built from other forms. */
type BaseForm = Exclude<VerbForm, 'teiru' | 'tara' | 'tai' | 'sugiru' | 'causpass'>;
/** そう: "looks ~" (嬉しそう); く: the adverb (早く, 静かに), as in 〜くなる. */
export type AdjForm = 'adj-nai' | 'adj-ta' | 'adj-nakatta' | 'adj-te' | 'adj-sou' | 'adj-ku' | 'adj-sugiru';
export type Form = VerbForm | AdjForm;

export interface Conjugated {
  text: string;
  reading: string;
}

/** The row each godan ending moves along: [a, i, u, e, o]. */
const ROWS: Record<string, [string, string, string, string, string]> = {
  u: ['わ', 'い', 'う', 'え', 'お'], ku: ['か', 'き', 'く', 'け', 'こ'], iku: ['か', 'き', 'く', 'け', 'こ'],
  gu: ['が', 'ぎ', 'ぐ', 'げ', 'ご'], su: ['さ', 'し', 'す', 'せ', 'そ'], tsu: ['た', 'ち', 'つ', 'て', 'と'],
  nu: ['な', 'に', 'ぬ', 'ね', 'の'], bu: ['ば', 'び', 'ぶ', 'べ', 'ぼ'], mu: ['ま', 'み', 'む', 'め', 'も'],
  ru: ['ら', 'り', 'る', 'れ', 'ろ'], aru: ['ら', 'り', 'る', 'れ', 'ろ'], 'ru-aru': ['ら', 'い', 'る', 'れ', 'ろ'],
};
/** て-form endings by godan row; た is the same with た/だ. */
const TE: Record<string, string> = { u: 'って', tsu: 'って', ru: 'って', aru: 'って', 'ru-aru': 'って', mu: 'んで', bu: 'んで', nu: 'んで', ku: 'いて', gu: 'いで', su: 'して', iku: 'って' };

const isVerb = (c: ConjClass) => c !== '' && c !== 'i-adj' && c !== 'ii-adj' && c !== 'na-adj';
export const isVerbClass = isVerb;
export const isAdjClass = (c: ConjClass) => c === 'i-adj' || c === 'ii-adj' || c === 'na-adj';

/** Conjugate one string (written form or reading); `kana` tells 来る's two spellings apart. */
function conj(word: string, c: ConjClass, form: Form, kana: boolean): string {
  // Built on other forms: 〜ている is the て-form + いる, 〜たら is the た-form + ら.
  if (form === 'teiru') return `${conj(word, c, 'te', kana)}いる`;
  if (form === 'tara') return `${conj(word, c, 'ta', kana)}ら`;
  // 〜たい is the ます-stem + たい: 食べます → 食べたい.
  if (form === 'tai') return `${conj(word, c, 'masu', kana).slice(0, -2)}たい`;
  // 〜すぎる (too much) is the ます-stem + すぎる: 食べすぎる, 飲みすぎる.
  if (form === 'sugiru') return `${conj(word, c, 'masu', kana).slice(0, -2)}すぎる`;
  // Causative-passive, "made to do": the causative's passive. Group 1 (except す-verbs) uses the
  // short form: 書かせられる → 書かされる, the one people say and textbooks teach.
  if (form === 'causpass') {
    const caus = conj(word, c, 'causative', kana);
    const short = ROWS[c] && c !== 'su' && c !== 'aru';
    return short ? `${caus.slice(0, -2)}される` : `${caus.slice(0, -1)}られる`;
  }
  if (c === 'suru') {
    const base = word.slice(0, -2);
    const s: Record<BaseForm, string> = {
      masu: 'します', masen: 'しません', mashita: 'しました', masendeshita: 'しませんでした', nai: 'しない', ta: 'した',
      nakatta: 'しなかった', te: 'して', potential: 'できる', volitional: 'しよう', passive: 'される', causative: 'させる', ba: 'すれば',
    };
    return base + s[form as BaseForm];
  }
  if (c === 'kuru') {
    const base = word.slice(0, -2);
    const stem = { i: kana ? 'き' : '来', o: kana ? 'こ' : '来', u: kana ? 'く' : '来' };
    const s: Record<BaseForm, string> = {
      masu: `${stem.i}ます`, masen: `${stem.i}ません`, mashita: `${stem.i}ました`, masendeshita: `${stem.i}ませんでした`,
      nai: `${stem.o}ない`, ta: `${stem.i}た`, nakatta: `${stem.o}なかった`, te: `${stem.i}て`, potential: `${stem.o}られる`,
      volitional: `${stem.o}よう`, passive: `${stem.o}られる`, causative: `${stem.o}させる`, ba: `${stem.u}れば`,
    };
    return base + s[form as BaseForm];
  }
  if (c === 'ichidan') {
    const stem = word.slice(0, -1);
    const s: Record<BaseForm, string> = {
      masu: 'ます', masen: 'ません', mashita: 'ました', masendeshita: 'ませんでした', nai: 'ない', ta: 'た', nakatta: 'なかった',
      te: 'て', potential: 'られる', volitional: 'よう', passive: 'られる', causative: 'させる', ba: 'れば',
    };
    return stem + s[form as BaseForm];
  }
  if (c === 'i-adj' || c === 'ii-adj') {
    // いい conjugates from its old form よい: いい → よくない, よかった.
    const stem = c === 'ii-adj' && word.endsWith('いい') ? `${word.slice(0, -2)}よ` : word.slice(0, -1);
    // そう after いい is よさそう: the old form again, plus さ.
    const sou = c === 'ii-adj' ? 'さそう' : 'そう';
    const s: Record<AdjForm, string> = { 'adj-nai': 'くない', 'adj-ta': 'かった', 'adj-nakatta': 'くなかった', 'adj-te': 'くて', 'adj-sou': sou, 'adj-ku': 'く', 'adj-sugiru': 'すぎる' };
    return stem + s[form as AdjForm];
  }
  if (c === 'na-adj') {
    const s: Record<AdjForm, string> = { 'adj-nai': 'じゃない', 'adj-ta': 'だった', 'adj-nakatta': 'じゃなかった', 'adj-te': 'で', 'adj-sou': 'そう', 'adj-ku': 'に', 'adj-sugiru': 'すぎる' };
    return word + s[form as AdjForm];
  }
  // Godan.
  const row = ROWS[c];
  if (!row) throw new Error(`Cannot conjugate class '${c}'`);
  const stem = word.slice(0, -1);
  const [a, i, , e, o] = row;
  const te = TE[c] as string;
  const ta = te.replace('て', 'た').replace('で', 'だ');
  // ある has no ない-form of its own: its negative is simply ない.
  const neg = c === 'aru' ? word.slice(0, -2) : stem + a;
  const s: Record<BaseForm, string> = {
    masu: `${stem}${i}ます`, masen: `${stem}${i}ません`, mashita: `${stem}${i}ました`, masendeshita: `${stem}${i}ませんでした`,
    nai: `${neg}ない`, ta: stem + ta, nakatta: `${neg}なかった`, te: stem + te, potential: `${stem}${e}る`,
    volitional: `${stem}${o}う`, passive: `${stem}${a}れる`, causative: `${stem}${a}せる`, ba: `${stem}${e}ば`,
  };
  return s[form as BaseForm];
}

export function conjugate(text: string, reading: string, c: ConjClass, form: Form): Conjugated {
  return { text: conj(text, c, form, false), reading: conj(reading, c, form, true) };
}

export const FORM_LABEL: Record<Form, { ja: string; en: string }> = {
  masu: { ja: 'ます形', en: 'polite present (ます)' },
  masen: { ja: 'ません', en: 'polite negative (ません)' },
  mashita: { ja: 'ました', en: 'polite past (ました)' },
  masendeshita: { ja: 'ませんでした', en: 'polite past negative' },
  nai: { ja: 'ない形', en: 'plain negative (ない)' },
  ta: { ja: 'た形', en: 'plain past (た)' },
  nakatta: { ja: 'なかった', en: 'plain past negative' },
  te: { ja: 'て形', en: 'て-form' },
  teiru: { ja: 'ている', en: '〜ている (is doing / is in a state)' },
  tara: { ja: 'たら', en: '〜たら (if / when)' },
  tai: { ja: 'たい', en: '〜たい (want to)' },
  sugiru: { ja: 'すぎる', en: '〜すぎる (too much)' },
  causpass: { ja: '使役受身', en: 'causative-passive (was made to)' },
  potential: { ja: '可能形', en: 'potential (can do)' },
  volitional: { ja: '意向形', en: "volitional (let's)" },
  passive: { ja: '受身形', en: 'passive' },
  causative: { ja: '使役形', en: 'causative (make/let do)' },
  ba: { ja: 'ば形', en: 'conditional (ば)' },
  'adj-nai': { ja: '否定', en: 'negative' },
  'adj-ta': { ja: '過去', en: 'past' },
  'adj-nakatta': { ja: '過去否定', en: 'past negative' },
  'adj-te': { ja: 'て形', en: 'て-form (and...)' },
  'adj-sou': { ja: 'そう', en: '〜そう (looks ~)' },
  'adj-ku': { ja: '副詞形', en: 'adverb (〜く / 〜に)' },
  'adj-sugiru': { ja: 'すぎる', en: '〜すぎる (too ~)' },
};

const GROUP: Partial<Record<ConjClass, string>> = {
  ichidan: 'Group 2 (る-verb)', kuru: 'Group 3: 来る is irregular', suru: 'Group 3: する is irregular',
  iku: 'Group 1, but 行く is special', aru: 'Group 1, but ある is special',
};

/** The rule a learner needs on the answer screen. */
export function ruleNote(c: ConjClass, form: Form): string {
  if (c === 'i-adj') return { 'adj-nai': 'い-adjective: drop い, add くない.', 'adj-ta': 'い-adjective: drop い, add かった.', 'adj-nakatta': 'い-adjective: drop い, add くなかった.', 'adj-te': 'い-adjective: drop い, add くて.', 'adj-sou': 'い-adjective: drop い, add そう (looks ~).', 'adj-ku': 'い-adjective: drop い, add く to describe a verb: 早く起きる, 寒くなる.', 'adj-sugiru': 'い-adjective: drop い, add すぎる (too ~): 高すぎる.' }[form as AdjForm] ?? '';
  if (c === 'ii-adj') return form === 'adj-sou' ? 'いい conjugates from its old form よい, and adds さ before そう: よさそう.' : form === 'adj-sugiru' ? 'いい conjugates from its old form よい: よすぎる.' : 'いい conjugates from its old form よい: よくない, よかった, よく.';
  if (c === 'na-adj') return { 'adj-nai': 'な-adjective: add じゃない (formal: ではない).', 'adj-ta': 'な-adjective: add だった.', 'adj-nakatta': 'な-adjective: add じゃなかった.', 'adj-te': 'な-adjective: add で to join another phrase.', 'adj-sou': 'な-adjective: add そう (looks ~): 元気そう.', 'adj-ku': 'な-adjective: add に to describe a verb: 静かに話す, 元気になる.', 'adj-sugiru': 'な-adjective: add すぎる (too ~): 静かすぎる.' }[form as AdjForm] ?? '';
  // 行く is only irregular in て/た, and ある only in its negative: elsewhere they are ordinary Group 1 verbs.
  const special = (c === 'iku' && ['te', 'ta', 'teiru', 'tara'].includes(form)) || (c === 'aru' && ['nai', 'nakatta'].includes(form));
  const group = (c === 'iku' || c === 'aru') && !special ? 'Group 1 (う-verb)' : GROUP[c] ?? 'Group 1 (う-verb)';
  const godanStep: Partial<Record<Form, string>> = {
    masu: 'last kana moves to the い-row, add ます', masen: 'い-row, add ません', mashita: 'い-row, add ました', masendeshita: 'い-row, add ませんでした',
    nai: 'last kana moves to the あ-row (う→わ), add ない', nakatta: 'あ-row, add なかった', potential: 'え-row, add る', volitional: 'お-row, add う',
    passive: 'あ-row, add れる', causative: 'あ-row, add せる', ba: 'え-row, add ば',
    te: 'う/つ/る→って, む/ぶ/ぬ→んで, く→いて, ぐ→いで, す→して', ta: 'same as て-form with た/だ',
    teiru: 'make the て-form, then add いる', tara: 'make the た-form, then add ら',
    tai: 'last kana moves to the い-row, add たい', sugiru: 'い-row (the ます-stem), add すぎる',
    causpass: 'あ-row, add される (す-verbs: させられる)',
  };
  if (c === 'ichidan') return form === 'teiru' ? `${group}: drop る, add て, then いる.` : form === 'tara' ? `${group}: drop る, add たら.` : form === 'potential' ? `${group}: drop る, add られる (same as the passive).` : form === 'causpass' ? `${group}: drop る, add させられる.` : `${group}: drop る, add the ending.`;
  if (c === 'suru' && form === 'potential') return `${group}: its potential is できる: 勉強できる.`;
  if (c === 'suru' && form === 'tai') return `${group}: し + たい: 勉強したい.`;
  if (c === 'suru' && form === 'causpass') return `${group}: する → させられる.`;
  if (c === 'kuru' && form === 'causpass') return `${group}: 来る → 来させられる (こさせられる).`;
  if (c === 'su' && form === 'causpass') return `${group}: す-verbs take the long form: 話す → 話させられる.`;
  if (form === 'sugiru' && (c === 'suru' || c === 'kuru')) return `${group}: ます-stem + すぎる: しすぎる, 来すぎる (きすぎる).`;
  if (c === 'kuru' && form === 'tai') return `${group}: き + たい: 来たい (きたい).`;
  if (c === 'suru' || c === 'kuru') return `${group}: learn it by heart.`;
  if (c === 'iku' && (form === 'te' || form === 'ta' || form === 'teiru' || form === 'tara')) return `${group}: 行って / 行った (not 行いて), so 行っている, 行ったら.`;
  if (c === 'aru' && (form === 'nai' || form === 'nakatta')) return `${group}: its negative is just ない / なかった.`;
  return `${group}: ${godanStep[form] ?? ''}.`;
}

/**
 * Wrong answers a learner might really give: the same word put through other
 * classes' rules (書く as if it were 書む: 書んで), and the classic over-regular
 * mistakes. Distinct, never the right answer.
 */
export function wrongForms(text: string, reading: string, c: ConjClass, form: Form): string[] {
  const right = conjugate(text, reading, c, form).text;
  const out = new Set<string>();
  const add = (s: string) => {
    if (s && s !== right) out.add(s);
  };
  if (isVerb(c)) {
    const stem = text.slice(0, -1);
    const lastIsRu = text.endsWith('る');
    for (const other of ['ichidan', 'ru', 'u', 'ku', 'gu', 'su', 'tsu', 'mu', 'bu'] as ConjClass[]) {
      if (other === c) continue;
      // Reinterpret the word as a member of the other class: swap the final kana for that class's.
      const end = other === 'ichidan' ? 'る' : (ROWS[other] as string[])[2];
      const as = (c === 'suru' || c === 'kuru') ? `${text.slice(0, -1)}${end}` : `${stem}${end}`;
      if (other === 'ichidan' && !lastIsRu && c !== 'suru') add(conj(`${stem}る`, 'ichidan', form, false));
      else add(conj(as, other, form, false));
    }
    // ら抜き言葉: casual speech says 食べれる and 来れる for the potential. Not textbook, but not
    // wrong either, so they never appear as a wrong choice.
    // The long causative-passive (書かせられる) is also correct, just less common.
    if (form === 'causpass') out.delete(conj(text, c, 'causative', false).slice(0, -1) + 'られる');
    if (form === 'potential' && (c === 'ichidan' || c === 'kuru')) {
      out.delete(`${stem}れる`);
      out.delete(`${text.slice(0, -2)}来れる`);
      out.delete(`${text.slice(0, -2)}これる`);
    }
  } else if (c === 'i-adj' || c === 'ii-adj') {
    const base = text.slice(0, -1);
    ({
      'adj-nai': [`${text}じゃない`, `${base}じゃない`, `${text}くない`, `${base}ない`],
      'adj-ta': [`${text}だった`, `${text}かった`, `${base}くた`, `${base}だった`],
      'adj-nakatta': [`${text}じゃなかった`, `${base}かったない`, `${base}くないかった`, `${text}くなかった`],
      'adj-te': [`${text}て`, `${text}で`, `${base}て`, `${base}くで`],
      // Not おいしいそう / おいしかったそう: those are grammatical ("I hear it is / was ~").
      'adj-sou': [`${base}くそう`, `${base}なそう`, `${base}さそう`, `${text}なそう`],
      'adj-ku': [`${text}く`, `${text}に`, `${base}に`, `${base}くに`],
      'adj-sugiru': [`${text}すぎる`, `${base}くすぎる`, `${base}なすぎる`, `${base}さすぎる`],
    } as Record<string, string[]>)[form]?.forEach(add);
  } else if (c === 'na-adj') {
    ({
      'adj-nai': [`${text}くない`, `${text}ない`, `${text}じゃなかった`, `${text}だない`],
      'adj-ta': [`${text}かった`, `${text}た`, `${text}じゃない`, `${text}だかった`],
      'adj-nakatta': [`${text}くなかった`, `${text}なかった`, `${text}だった`, `${text}じゃないだった`],
      'adj-te': [`${text}くて`, `${text}て`, `${text}だて`, `${text}にて`],
      // Not だそう: that is grammatical ("I hear it's ~"), just a different meaning.
      'adj-sou': [`${text}なそう`, `${text}くそう`, `${text}にそう`, `${text}のそう`],
      'adj-ku': [`${text}く`, `${text}な`, `${text}で`, `${text}くに`],
      'adj-sugiru': [`${text}なすぎる`, `${text}くすぎる`, `${text}にすぎる`, `${text}だすぎる`],
    } as Record<string, string[]>)[form]?.forEach(add);
  }
  return [...out];
}
