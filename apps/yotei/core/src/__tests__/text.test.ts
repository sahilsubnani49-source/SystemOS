import { describe, expect, it } from 'vitest';
import vectors from './normalize.vectors.json';
import { normalizeDoc, normalizeLine, quoteInDoc, unassignedLines, verifyItems } from '../text';
import type { DraftItem } from '../types';

describe('normalizeLine (shared vectors, also run by the backend)', () => {
  it.each(vectors.normalize as [string, string][])('%j → %j', (input, expected) => {
    expect(normalizeLine(input)).toBe(expected);
  });
});

describe('quoteInDoc (shared vectors)', () => {
  it.each(vectors.contains as [string, string, boolean][])('doc %j contains %j: %s', (doc, quote, expected) => {
    expect(quoteInDoc(quote, normalizeDoc(doc))).toBe(expected);
  });
});

const MD = `# 12-week strength plan

## Week 1
- Squat 3x5 at 40kg
- Walk 30 minutes daily

## Week 2
- Squat 3x5 at 45kg
- Book a physio check
`;

const item = (quote: string, periodQuote: string, index: number): DraftItem => ({
  quote,
  periodQuote,
  period: { unit: 'week', index },
});

describe('verifyItems', () => {
  it('keeps verbatim items and rejects invented, reworded, mistimed and duplicate ones', () => {
    const { kept, rejected } = verifyItems(MD, [
      item('Squat 3x5 at 40kg', 'Week 1', 1),
      item('Squat 3x5 at 50kg', 'Week 1', 1), // invented number
      item('Go for a nice relaxing walk', 'Week 1', 1), // sugar-coated rewording
      item('Book a physio check', 'Week 9', 9), // timing not in the planner
      item('Squat 3x5 at 40kg', 'Week 1', 1), // duplicate
    ]);
    expect(kept.map((k) => k.quote)).toEqual(['Squat 3x5 at 40kg']);
    expect(rejected.map((r) => r.reason)).toEqual([
      'Not found in the planner',
      'Not found in the planner',
      'Its timing is not written in the planner',
      'Duplicate',
    ]);
  });

  it('reports planner lines that nothing covers', () => {
    const { kept } = verifyItems(MD, [item('Squat 3x5 at 40kg', 'Week 1', 1)]);
    expect(unassignedLines(MD, kept)).toEqual(['Walk 30 minutes daily', 'Squat 3x5 at 45kg', 'Book a physio check']);
  });
});
