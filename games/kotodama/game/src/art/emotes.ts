import type { NpcTask } from '@kotodama/core';
import { PixelCanvas } from './pixel';

// The little speech bubble over a busy townsperson: a 12x12 white bubble with an
// 8x8 pixel icon of what they are doing. Drawn with the same palette as the sprites.

const OUT = '#120C18';
const B = '#3A2A2A';
const ICONS: Record<NpcTask, { rows: string[]; pal: Record<string, string> }> = {
  fish: { rows: ['.......a', '......a.', '.....a..', '....a...', '...a....', '..a....c', '.a.....c', 'a.....cc'], pal: { a: '#8A5A32', c: '#5B8DEF' } },
  sweep: { rows: ['......a.', '.....a..', '....a...', '...a....', '..bbb...', '.bbbbb..', 'b.b.b.b.', '........'], pal: { a: '#8A5A32', b: '#C9A15A' } },
  garden: { rows: ['..p..p..', '.ppp.pp.', '..pyp...', '...p....', '...g.g..', '...gg...', '...g....', '..bbb...'], pal: { p: '#F4A7C0', y: '#E8B04B', g: '#4E8A4E', b: '#8A5A32' } },
  pray: { rows: ['...aa...', '..aaaa..', '..aaaa..', '..aaaa..', '.aaaaaa.', '.aaaaaa.', '..a..a..', '........'], pal: { a: '#E8B98E' } },
  lantern: { rows: ['...b....', '..rrr...', '.rryrr..', '.ryyyr..', '.rryrr..', '..rrr...', '...b....', '........'], pal: { b: B, r: '#C0392B', y: '#FFE14B' } },
  read: { rows: ['........', 'wwww.www', 'wbbw.wbw', 'wwww.www', 'wbbw.wbw', 'wwww.www', 'aaaaaaaa', '........'], pal: { w: '#EFE6CC', b: '#3A3A3A', a: '#8A5A32' } },
  forge: { rows: ['.aaaa...', '.aaaa...', '...b....', '...b....', '...b..o.', '...b.ooo', '....oooo', '........'], pal: { a: '#8A8A9A', b: '#8A5A32', o: '#E8742A' } },
  shop: { rows: ['..yyyy..', '.y....y.', 'y..yy..y', 'y.y..y.y', 'y..yy..y', '.y....y.', '..yyyy..', '........'], pal: { y: '#E8B04B' } },
  gather: { rows: ['....gg..', '...ggg..', '..ggg...', '.ggg....', '.gg.....', 'b.......', '........', '........'], pal: { g: '#5BAA5B', b: '#8A5A32' } },
  snow: { rows: ['...w....', '.w.w.w..', '..www...', 'wwwwwww.', '..www...', '.w.w.w..', '...w....', '........'], pal: { w: '#9CCDE2' } },
  think: { rows: ['..aaa...', '.a...a..', '.....a..', '....a...', '...a....', '...a....', '........', '...a....'], pal: { a: B } },
  sing: { rows: ['...aaaa.', '...a..a.', '...a..a.', '...a..a.', '.aaa.aa.', 'aaaa.aa.', '.aa.....', '........'], pal: { a: B } },
  chat: { rows: ['........', '........', '........', 'a..a..a.', 'a..a..a.', '........', '........', '........'], pal: { a: B } },
  rest: { rows: ['....aaaa', '......a.', '.....a..', '....aaaa', 'aaa.....', '..a.....', '.a......', 'aaa.....'], pal: { a: '#5B8DEF' } },
  look: { rows: ['........', '.aaaaaa.', 'a..bb..a', 'a.bbbb.a', 'a..bb..a', '.aaaaaa.', '........', '........'], pal: { a: B, b: '#2E5A8A' } },
};

export function drawEmote(task: NpcTask): PixelCanvas {
  const c = new PixelCanvas(13, 13);
  c.rect(1, 1, 11, 10, '#FFFFFF');
  c.rect(5, 11, 2, 1, '#FFFFFF');
  c.set(5, 12, '#FFFFFF');
  const icon = ICONS[task];
  c.stamp(3 - 1, 2, icon.rows.map((r) => `.${r}`), icon.pal);
  c.outline(OUT);
  return c;
}
