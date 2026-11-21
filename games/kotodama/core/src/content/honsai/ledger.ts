import type { SrsTable } from '../../srs/schedule';
import { HONSAI_WORDS } from './words';

// The Word Ledger: how many of Honsai's words the Scribe has taken back from Wapul.
// A word is MET once it has been asked in battle, and RESTORED once it has survived
// a full day in the review schedule (stage 3): remembered, not just recognised once.

export const RESTORED_STAGE = 3;
/** The size of the finished land, all twelve districts. */
export const HONSAI_GOAL = 5000;
export const HONSAI_DISTRICTS = 12;

export interface Ledger {
  total: number;
  met: number;
  restored: number;
  districts: { district: number; total: number; met: number; restored: number }[];
}

export function honsaiLedger(srs: SrsTable): Ledger {
  const districts = new Map<number, { district: number; total: number; met: number; restored: number }>();
  let met = 0;
  let restored = 0;
  for (const w of HONSAI_WORDS) {
    const d = districts.get(w.district) ?? { district: w.district, total: 0, met: 0, restored: 0 };
    d.total++;
    const item = srs[w.id];
    if (item) {
      d.met++;
      met++;
      if (item.stage >= RESTORED_STAGE) {
        d.restored++;
        restored++;
      }
    }
    districts.set(w.district, d);
  }
  return { total: HONSAI_WORDS.length, met, restored, districts: [...districts.values()].sort((a, b) => a.district - b.district) };
}
