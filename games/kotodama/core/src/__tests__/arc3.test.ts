import { describe, expect, it } from 'vitest';
import { KANJI, getKanji, kanjiAt, kanjiInGroup, kanjiLookalikes, kanjiReadings } from '../content/kanji';
import { VOCABULARY } from '../content/words';
import { acceptsTyped, buildPrompt, gradeAnswer, kanjiMisspellings, readingMutations, resolveKind } from '../battle/prompts';
import { poolForArea } from '../content/curriculum';
import { SPIRIT_FAMILIES, familyItemIds } from '../content/spirits';
import { familyStage, foeCombatant, heroCombatant } from '../progression';
import { canPurify, reduce, startBattle } from '../battle/engine';
import { newGame } from '../save/schema';
import { MAX_STAGE } from '../srs/schedule';
import { createRng } from '../util/rng';
import { toRomaji } from '../util/romaji';

const NOW = 1_800_000_000_000;

describe('kanji prompts', () => {
  it('builds valid meaning / recall / reading prompts for every N5 kanji', () => {
    const rng = createRng(11);
    const pool = poolForArea('hall');
    for (const k of KANJI) {
      for (const kind of ['meaning', 'recall', 'reading'] as const) {
        const p = buildPrompt(kind, k.id, pool, rng, null);
        expect(p.choices, `${k.char}/${kind}`).toHaveLength(4);
        expect(new Set(p.choices).size, `${k.char}/${kind}`).toBe(4);
        expect(p.choices).toContain(p.answer);
        if (kind === 'reading') {
          // No wrong choice may secretly be another correct reading (日: ひ, にち, か...).
          const valid = new Set(kanjiReadings(k));
          expect(valid.has(p.answer)).toBe(true);
          for (const c of p.choices) if (c !== p.answer) expect(valid.has(c), `${k.char}: ${c}`).toBe(false);
        }
      }
    }
  });

  it('draws "which kanji means X?" decoys from real look-alikes', () => {
    const p = buildPrompt('recall', 'j-木', ['j-木'], createRng(2), null);
    expect(p.display).toBe('tree');
    for (const c of p.choices) if (c !== '木') expect(kanjiLookalikes('木'), c).toContain(c);
  });

  it('accepts ANY reading of a kanji when typed, including macrons', () => {
    expect(acceptsTyped('j-水', 'mizu')).toBe(true);
    expect(acceptsTyped('j-水', 'SUI ')).toBe(true);
    expect(acceptsTyped('j-水', 'kawa')).toBe(false);
    expect(acceptsTyped('j-高', 'kō')).toBe(true);
    expect(acceptsTyped('j-食', 'taberu')).toBe(true);
    expect(acceptsTyped('j-十', 'juu')).toBe(true);
    expect(acceptsTyped('h-ka', 'ka')).toBe(true);
  });

  it('maps every move kind onto something a kanji or a vocab word supports', () => {
    expect(resolveKind('recognize', 'j-水')).toBe('reading');
    expect(resolveKind('listen', 'j-水')).toBe('meaning');
    expect(resolveKind('mirror', 'j-水')).toBe('meaning');
    expect(resolveKind('recognize', 'v-gakusei')).toBe('reading');
    expect(resolveKind('type', 'v-gakusei')).toBe('reading');
    expect(resolveKind('recall', 'v-gakusei')).toBe('spell');
    expect(resolveKind('reading', 'w-pan')).toBe('meaning');
    expect(resolveKind('reading', 'h-ka')).toBe('recognize');
  });
});

describe('vocabulary prompts', () => {
  it('builds valid meaning / reading / spell / listen prompts for every N5 word', () => {
    const rng = createRng(5);
    const pool = poolForArea('hall');
    for (const v of VOCABULARY) {
      for (const kind of ['meaning', 'reading', 'spell', 'listen'] as const) {
        const p = buildPrompt(kind, v.id, pool, rng, null);
        expect(p.choices, `${v.text}/${kind}`).toHaveLength(4);
        expect(new Set(p.choices).size, `${v.text}/${kind}`).toBe(4);
        expect(p.choices).toContain(p.answer);
        expect(p.speak).toBe(v.reading);
      }
    }
  });

  it('makes the reading slips learners actually make', () => {
    expect(readingMutations('がっこう')).toEqual(expect.arrayContaining(['がこう', 'がっこ']));
    expect(readingMutations('きょう')).toContain('きよう');
    expect(readingMutations('しゅう')).toContain('しゅ');
    // っ never lands in front of a small kana.
    for (const v of VOCABULARY) for (const m of readingMutations(v.reading)) expect(m, v.reading).not.toMatch(/っ[ゃゅょ]/);
    expect(readingMutations('かいしゃ')).toContain('がいしゃ');
    for (const v of VOCABULARY) expect(readingMutations(v.reading)).not.toContain(v.reading);
    expect(kanjiMisspellings('学生')).toEqual(expect.arrayContaining(['字生', '生学']));
  });
});

describe('castle-town spirits', () => {
  const kanjiFamilies = SPIRIT_FAMILIES.filter((f) => f.script === 'kanji' && !f.kanjiGroup!.startsWith('n4'));

  it('has one family per kanji group, each named with a kanji from its own group', () => {
    expect(kanjiFamilies).toHaveLength(10);
    expect(new Set(kanjiFamilies.map((f) => f.kanjiGroup)).size).toBe(10);
    for (const f of kanjiFamilies) {
      const chars = kanjiInGroup(f.kanjiGroup!).map((k) => k.char);
      for (const st of f.stages) expect([...st.nameJa].some((c) => chars.includes(c)), `${f.id}: ${st.nameJa}`).toBe(true);
    }
  });

  it('evolves from mastery of its kanji group', () => {
    const f = kanjiFamilies.find((x) => x.kanjiGroup === 'nature')!;
    const mastered = Object.fromEntries(familyItemIds(f).map((id) => [id, { id, stage: MAX_STAGE, dueAt: 0, reps: 5, lapses: 0, lastSeenAt: 0 }]));
    expect(familyStage(f.id, {})).toBe(0);
    expect(familyStage(f.id, mastered)).toBe(2);
  });

  it('is purified by typing a reading of its kanji true name', () => {
    const pool = poolForArea('gardens');
    const foe = foeCombatant({ familyId: 'karakasa', level: 30 }, 'foe1', pool, createRng(3));
    expect(getKanji(foe.trueName!).group).toBe('nature');
    let s = startBattle({ party: [heroCombatant(newGame('samurai', 'Ren', 'x', 1))], enemies: [{ ...foe, hp: 1 }], kanaPool: pool, srs: {}, seed: 9 });
    expect(canPurify(s)).toBe(true);
    s = reduce(s, { type: 'purify' });
    expect(s.prompt?.kind).toBe('type');
    const reading = kanjiReadings(getKanji(foe.trueName!))[0]!;
    expect(gradeAnswer(s.prompt!, toRomaji(reading), 0)).toBe('correct');
    s = reduce(s, { type: 'answer', value: toRomaji(reading), elapsedMs: 0, now: NOW });
    expect(s.phase).toBe('recruited');
  });
});

describe('Arc 3 curriculum', () => {
  it('adds kanji groups cumulatively and ends with the full N5 mock exam', () => {
    const kanjiIn = (a: string) => poolForArea(a).filter((id) => id.startsWith('j-')).length;
    expect(kanjiIn('castle')).toBe(21);
    expect(kanjiIn('market')).toBeGreaterThan(kanjiIn('castle'));
    expect(kanjiIn('hall')).toBe(kanjiAt('N5').length);
    const n5Vocab = VOCABULARY.filter((v) => ['castle', 'market', 'teahouse', 'gardens', 'keep'].includes(v.area));
    expect(poolForArea('hall').filter((id) => id.startsWith('v-'))).toHaveLength(n5Vocab.length);
    expect(poolForArea('castle').some((id) => id.startsWith('h-') || id.startsWith('k-'))).toBe(false);
  });
});
