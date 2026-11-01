import { describe, expect, it } from 'vitest';
import { WORDS } from '../content/words';
import { KANA, getKana, kanaWhere } from '../content/kana';
import { getItem, mirrorKanaId } from '../content/items';
import { buildPrompt, misspellings, resolveKind } from '../battle/prompts';
import { CURRICULUM, kanaPoolForArea, poolForArea } from '../content/curriculum';
import { SPIRIT_FAMILIES, familyForRow } from '../content/spirits';
import { familyStage, foeCombatant, heroCombatant, MIRROR_FLAG } from '../progression';
import { newGame } from '../save/schema';
import { MAX_STAGE } from '../srs/schedule';
import { createRng } from '../util/rng';

const KATAKANA_ONLY = /^[゠-ヿ]+$/;

describe('loanwords', () => {
  it('has ~60 words with unique ids, spellings and meanings, all in katakana', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(60);
    for (const key of ['id', 'text', 'meaning'] as const) {
      expect(new Set(WORDS.map((w) => w[key])).size, key).toBe(WORDS.length);
    }
    for (const w of WORDS) expect(w.text, w.id).toMatch(KATAKANA_ONLY);
  });

  it('produces near-miss spellings that are never the real word', () => {
    expect(misspellings('コーヒー')).toContain('コヒー'); // dropped long mark
    expect(misspellings('ベッド')).toContain('ベド'); // dropped small tsu
    expect(misspellings('ソース')).toContain('ンース'); // ソ/ン swap
    for (const w of WORDS) expect(misspellings(w.text)).not.toContain(w.text);
  });

  it('builds meaning / spell / listen / recognize prompts with 4 unique choices for every word', () => {
    const rng = createRng(2);
    const pool = poolForArea('longship');
    for (const w of WORDS) {
      for (const kind of ['meaning', 'spell', 'listen', 'recognize'] as const) {
        const p = buildPrompt(kind, w.id, pool, rng, null);
        expect(p.choices, `${w.id}/${kind}`).toHaveLength(4);
        expect(new Set(p.choices).size, `${w.id}/${kind}`).toBe(4);
        expect(p.choices).toContain(p.answer);
      }
    }
  });

  it('never asks to type or mirror a word, and never asks a bare kana its meaning', () => {
    expect(resolveKind('type', 'w-pan')).toBe('meaning');
    expect(resolveKind('mirror', 'w-pan')).toBe('meaning');
    expect(resolveKind('recall', 'w-pan')).toBe('spell');
    expect(resolveKind('meaning', 'k-ka')).toBe('recognize');
    expect(resolveKind('spell', 'k-ka')).toBe('recall');
    expect(buildPrompt('type', 'w-pan', [], createRng(1), null).kind).toBe('meaning');
  });
});

describe('mirror prompts', () => {
  it('pairs every kana with its twin in the other script', () => {
    const rng = createRng(4);
    for (const k of KANA) {
      const p = buildPrompt('mirror', k.id, [], rng, null);
      const twin = getKana(mirrorKanaId(k.id)!);
      expect(twin.romaji).toBe(k.romaji);
      expect(p.answer).toBe(twin.char);
      expect(new Set(p.choices).size).toBe(4);
      // Every choice is in the OTHER script: no answering by "it's the only katakana".
      for (const c of p.choices) expect(KANA.find((x) => x.char === c)?.script).toBe(twin.script);
    }
  });
});

describe('katakana curriculum', () => {
  it('teaches katakana in Arc 2 and adds words only from the tower on', () => {
    expect(kanaPoolForArea('harbor').every((id) => id.startsWith('k-'))).toBe(true);
    expect(poolForArea('harbor').some((id) => id.startsWith('w-'))).toBe(false);
    expect(poolForArea('tower').some((id) => id.startsWith('w-'))).toBe(true);
    expect(poolForArea('longship').filter((id) => id.startsWith('w-'))).toHaveLength(WORDS.length);
    expect(kanaPoolForArea('caves')).toContain('k-ga');
    for (const a of Object.values(CURRICULUM)) for (const id of poolForArea(a.id)) expect(() => getItem(id)).not.toThrow();
  });
});

describe('Norse spirit families', () => {
  it('has one katakana family per row, named in katakana from its own row', () => {
    const norse = SPIRIT_FAMILIES.filter((f) => f.script === 'katakana');
    expect(norse).toHaveLength(10);
    for (const f of norse) {
      const rowChars = kanaWhere({ script: 'katakana', row: f.row }).map((k) => k.char[0]);
      for (const st of f.stages) {
        expect(st.nameJa, `${f.id}`).toMatch(KATAKANA_ONLY);
        expect(rowChars, `${f.id}: ${st.nameJa}`).toContain(st.nameJa[0]);
      }
    }
    expect(familyForRow('k', 'katakana').id).toBe('kobold');
    expect(familyForRow('nn', 'katakana').id).toBe('wyrm');
    expect(familyForRow('k').id).toBe('kobi');
  });

  it('evolves from KATAKANA mastery, not hiragana', () => {
    const master = (script: 'hiragana' | 'katakana') =>
      Object.fromEntries(kanaWhere({ script, row: 'a', kind: 'basic' }).map((k) => [k.id, { id: k.id, stage: MAX_STAGE, dueAt: 0, reps: 5, lapses: 0, lastSeenAt: 0 }]));
    expect(familyStage('alv', master('hiragana'))).toBe(0);
    expect(familyStage('alv', master('katakana'))).toBe(2);
    expect(familyStage('akari', master('katakana'))).toBe(0);
  });

  it('gives Norse foes a katakana true name from their row, even when the pool has words', () => {
    const rng = createRng(3);
    for (let i = 0; i < 20; i++) {
      const foe = foeCombatant({ familyId: 'kobold', level: 20 }, 'f', poolForArea('longship'), rng);
      const k = getKana(foe.trueKana!);
      expect(k.script).toBe('katakana');
      expect(k.row).toBe('k');
    }
    // Area pool lacks the row → still a valid kana of the family's own row.
    expect(getKana(foeCombatant({ familyId: 'wyrm', level: 20 }, 'f', poolForArea('harbor'), rng).trueKana!).script).toBe('katakana');
  });
});

describe('mirror moves', () => {
  it('are learned only after Runa teaches them', () => {
    const save = newGame('samurai', 'Ren', 'x', 1);
    expect(heroCombatant(save).moves).not.toContain('twinDraw');
    expect(heroCombatant({ ...save, flags: { [MIRROR_FLAG]: true } }).moves).toContain('twinDraw');
    expect(heroCombatant({ ...newGame('ninja', 'Aki', 'x', 1), flags: { [MIRROR_FLAG]: true } }).moves).toContain('mirrorKunai');
  });
});
