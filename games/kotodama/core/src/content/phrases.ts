import type { WellArea } from './words';

// The Well of Old Tales, floor 2: set phrases and proverbs, in plain hiragana.
// These are the things Japanese people actually say, which no word list teaches:
// the greeting before a meal, the answer to "I'm home", and the proverbs that
// grandmothers quote.
//
// A phrase is always asked as "what does it mean?". Its wrong answers are written
// by hand, like a sentence's: three other things a person might plausibly say.
//
// Ids are `f-<n>` and are save-file keys: append new phrases, never renumber.

export interface Phrase {
  id: string;
  /** Hiragana, with spaces between words so a long proverb can be read. */
  text: string;
  /** What it means in use. This is the answer. */
  meaning: string;
  /** Proverbs only: the word-for-word image, shown when the answer is revealed. */
  literal?: string;
  wrong: [string, string, string];
  area: WellArea;
}

type Row = [text: string, meaning: string, wrong: [string, string, string], literal?: string];

const DATA: Row[] = [
  // ── Every day ─────────────────────────────────────────────────────────
  ['いただきます', 'Said before eating: I gratefully receive', ['Said after eating: thank you for the meal', 'Said when leaving home', 'Said before going to sleep']],
  ['ごちそうさま', 'Said after eating: thank you for the meal', ['Said before eating: I gratefully receive', 'Said when coming home', 'Said to cheer someone on']],
  ['ただいま', "I'm home", ['Welcome back', "I'm off, and I'll be back", 'Good night']],
  ['おかえり', 'Welcome back', ["I'm home", 'Take care on your way', 'Thank you for the meal']],
  ['いってきます', "I'm off, and I'll be back", ["I'm home", 'Welcome back', 'Please wait here']],
  ['おつかれさま', 'Thank you for your hard work', ['Do your best', 'Good night', 'Nice to meet you']],
  ['がんばって', 'Do your best!', ['Thank you for your hard work', 'Be careful!', 'Welcome back']],
  ['おやすみなさい', 'Good night', ['Good morning', "I'm home", 'See you tomorrow']],
  ['よろしく おねがいします', 'Please treat me well', ['Thank you very much', 'I am sorry to be late', 'Please say it again']],
  // ── Proverbs ──────────────────────────────────────────────────────────
  ['ななころび やおき', 'Never give up, however often you fall', ['Too many cooks spoil the meal', 'Rest before a long journey', 'An early riser gains the day'], 'Fall seven times, get up eight.'],
  ['さるも きから おちる', 'Even experts make mistakes', ['Do not climb what you cannot descend', 'A fool learns nothing from falling', 'Small friends can be great help'], 'Even monkeys fall from trees.'],
  ['いちご いちえ', 'Treasure each meeting; it will never come again', ['One good friend is worth ten', 'The first step is the hardest', 'Trust is built one day at a time'], 'One time, one meeting.'],
  ['いしの うえにも さんねん', 'Patience wins in the end', ['A hard heart never changes', 'Bad luck comes in threes', 'Old habits are slow to die'], 'Three years sitting on a stone (will warm it).'],
  ['ちりも つもれば やまと なる', 'Small efforts add up to something great', ['A mountain hides many small dangers', 'Neglect a little and lose a lot', 'Great things cannot be hurried'], 'Even dust, piled up, becomes a mountain.'],
  ['はなより だんご', 'Substance matters more than show', ['Beauty fades but kindness stays', 'Sweet words hide a bitter heart', 'Hunger is the best sauce'], 'Dumplings rather than flowers.'],
  ['ねこに こばん', 'A treasure wasted on one who cannot value it', ['A small gift given with a big heart', 'Riches bring more worry than joy', 'Never trust a quiet cat'], 'Gold coins to a cat.'],
  ['いそがば まわれ', 'When in a hurry, take the sure way round', ['Run now and rest later', 'A lost road teaches the traveller', 'He who waits loses his turn'], 'If you hurry, go around.'],
];

export const PHRASES: readonly Phrase[] = DATA.map(([text, meaning, wrong, literal], n) => ({
  id: `f-${n + 1}`, text, meaning, wrong, literal, area: 'well2',
}));

const BY_ID = new Map(PHRASES.map((p) => [p.id, p]));

export function getPhrase(id: string): Phrase {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`Unknown phrase id: ${id}`);
  return p;
}
