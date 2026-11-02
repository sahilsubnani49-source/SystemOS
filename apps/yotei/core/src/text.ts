import type { DraftItem, Rejection } from './types';

// Verbatim-quote verification: the anti-hallucination guarantee. An LLM may only
// POINT AT text in the planner; this code decides whether it really did. The same
// rules run in the backend (backend/app/services/plan_parser.py) and both are tested
// against the shared vectors in __tests__/normalize.vectors.json.

const SMART: Record<string, string> = {
  '‘': "'", '’': "'", '‚': "'", '‛': "'",
  '“': '"', '”': '"', '„': '"', '‟': '"',
  '–': '-', '—': '-', '−': '-', '…': '...', ' ': ' ',
};

/**
 * Normalize one line of markdown for comparison: drop list/heading/quote/checkbox
 * markers and emphasis, unify smart punctuation, collapse whitespace. Case and
 * wording are NOT normalized: "Run 5km" and "run 5 km" are different claims.
 */
export function normalizeLine(line: string): string {
  let s = line.normalize('NFC');
  s = s.replace(/[‘’‚‛“”„‟–—−… ]/g, (c) => SMART[c] ?? c);
  s = s.replace(/^\s*(?:>\s*)*/, ''); // blockquote
  s = s.replace(/^\s*#{1,6}\s+/, ''); // heading
  s = s.replace(/^\s*(?:[-*+]|\d{1,3}[.)])\s+/, ''); // bullet / numbered
  s = s.replace(/^\s*\[[ xX]\]\s+/, ''); // checkbox
  s = s.replace(/(\*\*|__|\*|_|`|~~)/g, ''); // emphasis / code / strike
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // [text](link) → text
  return s.replace(/\s+/g, ' ').trim();
}

/** The whole planner as one normalized searchable string, lines joined by "\n". */
export function normalizeDoc(md: string): string {
  return md
    .split(/\r?\n/)
    .map(normalizeLine)
    .filter((l) => l.length > 0)
    .join('\n');
}

const MIN_QUOTE_CHARS = 3;

/**
 * True when `quote` appears in the planner. Matching is per normalized text with the
 * line breaks treated as spaces, so a quote spanning a wrapped line still counts.
 */
export function quoteInDoc(quote: string, normalizedDoc: string): boolean {
  const q = normalizeLine(quote);
  if (q.length < MIN_QUOTE_CHARS) return false;
  return normalizedDoc.includes(q) || normalizedDoc.replace(/\n/g, ' ').includes(q);
}

export interface VerifyResult {
  kept: DraftItem[];
  rejected: Rejection[];
}

/** Keep only items whose text AND timing text are both in the planner. */
export function verifyItems(md: string, items: DraftItem[]): VerifyResult {
  const doc = normalizeDoc(md);
  const kept: DraftItem[] = [];
  const rejected: Rejection[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const q = normalizeLine(item.quote ?? '');
    if (!quoteInDoc(item.quote ?? '', doc)) {
      rejected.push({ quote: item.quote ?? '', reason: 'Not found in the planner' });
    } else if (!quoteInDoc(item.periodQuote ?? '', doc)) {
      rejected.push({ quote: item.quote, reason: 'Its timing is not written in the planner' });
    } else if (seen.has(`${q}|${normalizeLine(item.periodQuote)}`)) {
      rejected.push({ quote: item.quote, reason: 'Duplicate' });
    } else {
      seen.add(`${q}|${normalizeLine(item.periodQuote)}`);
      kept.push({ ...item, quote: q, periodQuote: normalizeLine(item.periodQuote) });
    }
  }
  return { kept, rejected };
}

/** Lines that look like actionable entries: bullets, numbered items, checkboxes. */
export function taskLines(md: string): string[] {
  return md
    .split(/\r?\n/)
    .filter((l) => /^\s*(?:[-*+]|\d{1,3}[.)])\s+\S/.test(l))
    .map(normalizeLine)
    .filter((l) => l.length >= MIN_QUOTE_CHARS);
}

/** Task-like planner lines that no kept item quotes (shown to the user, never hidden). */
export function unassignedLines(md: string, kept: DraftItem[]): string[] {
  const quotes = kept.map((k) => normalizeLine(k.quote));
  return taskLines(md).filter((line) => !quotes.some((q) => line.includes(q) || q.includes(line)));
}

/** FNV-1a 32-bit: a stable fingerprint of the source planner (not security). */
export function hashText(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
