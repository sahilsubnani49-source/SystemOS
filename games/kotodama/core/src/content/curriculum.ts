import { kanaWhere, type KanaRow, type KanaKind } from './kana';

/**
 * Which kana each area tests. Pools are cumulative: earlier rows keep coming back,
 * so review is built into progress. Later arcs (katakana, N5–N3 kanji) add areas here.
 */
export interface AreaCurriculum {
  id: string;
  arc: 1 | 2 | 3 | 4 | 5;
  label: string;
  /** Rows introduced IN this area (shown on the area banner). */
  newRows: KanaRow[];
  rows: KanaRow[];
  kinds: KanaKind[];
}

const BASIC_ALL: KanaRow[] = ['a', 'k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'nn'];

export const CURRICULUM: Record<string, AreaCurriculum> = {
  dojo: { id: 'dojo', arc: 1, label: 'Vowels', newRows: ['a'], rows: ['a'], kinds: ['basic'] },
  bamboo: { id: 'bamboo', arc: 1, label: 'K-row', newRows: ['k'], rows: ['a', 'k'], kinds: ['basic'] },
  river: { id: 'river', arc: 1, label: 'S- and T-rows', newRows: ['s', 't'], rows: ['a', 'k', 's', 't'], kinds: ['basic'] },
  hideout: { id: 'hideout', arc: 1, label: 'N-, H- and M-rows', newRows: ['n', 'h', 'm'], rows: ['a', 'k', 's', 't', 'n', 'h', 'm'], kinds: ['basic'] },
  pass: { id: 'pass', arc: 1, label: 'Y-, R-, W-rows and ん', newRows: ['y', 'r', 'w', 'nn'], rows: BASIC_ALL, kinds: ['basic'] },
  shrine: { id: 'shrine', arc: 1, label: 'Voiced sounds (゛ ゜)', newRows: [], rows: BASIC_ALL, kinds: ['basic', 'dakuten'] },
  gate: { id: 'gate', arc: 1, label: 'All hiragana', newRows: [], rows: BASIC_ALL, kinds: ['basic', 'dakuten', 'yoon'] },
};

export function kanaPoolForArea(areaId: string): string[] {
  const area = CURRICULUM[areaId];
  if (!area) throw new Error(`Unknown curriculum area: ${areaId}`);
  return area.kinds.flatMap((kind) =>
    area.rows.flatMap((row) => kanaWhere({ script: 'hiragana', row, kind }).map((k) => k.id)),
  );
}
