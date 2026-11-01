import type { TileKind } from '@kotodama/core';
import { hash2, PixelCanvas, shade } from './pixel';

export const TILE = 16;

type Neighbor = (dx: number, dy: number) => TileKind;
type TilePainter = (c: PixelCanvas, ox: number, oy: number, tx: number, ty: number, frame: number, n: Neighbor) => void;

const GRASS = '#5FA84A';
const GRASS_DK = '#4A8A3A';

function grassBase(c: PixelCanvas, ox: number, oy: number, tx: number, ty: number) {
  c.rect(ox, oy, TILE, TILE, GRASS);
  for (let i = 0; i < 6; i++) {
    const x = Math.floor(hash2(tx, ty, i) * 15);
    const y = Math.floor(hash2(tx, ty, i + 9) * 15);
    c.set(ox + x, oy + y, GRASS_DK);
    c.set(ox + x, oy + y - 1, shade(GRASS, 0.08));
  }
}

const isWater = (k: TileKind) => k === 'water' || k === 'deepWater';

const P: Record<TileKind, TilePainter> = {
  grass: (c, ox, oy, tx, ty) => grassBase(c, ox, oy, tx, ty),
  tallGrass(c, ox, oy, tx, ty, frame) {
    c.rect(ox, oy, TILE, TILE, '#4E9A3E');
    for (let i = 0; i < 4; i++) {
      const bx = ox + 1 + i * 4;
      const sway = (frame + i) % 2;
      c.line(bx, oy + 15, bx + sway, oy + 6, '#2E6A2A');
      c.line(bx + 2, oy + 15, bx + 2 + sway, oy + 4, '#3A7A32');
      c.set(bx + 2 + sway, oy + 4, '#8ACA5A');
    }
  },
  path(c, ox, oy, tx, ty) {
    c.rect(ox, oy, TILE, TILE, '#C8A66A');
    for (let i = 0; i < 5; i++)
      c.set(ox + Math.floor(hash2(tx, ty, i) * 16), oy + Math.floor(hash2(tx, ty, i + 5) * 16), '#A8864E');
  },
  sand(c, ox, oy, tx, ty) {
    c.rect(ox, oy, TILE, TILE, '#E6CF8E');
    for (let i = 0; i < 4; i++)
      c.set(ox + Math.floor(hash2(tx, ty, i) * 16), oy + Math.floor(hash2(tx, ty, i + 3) * 16), '#D2B670');
  },
  water(c, ox, oy, tx, ty, frame, n) {
    c.rect(ox, oy, TILE, TILE, '#3A86C8');
    for (let i = 0; i < 3; i++) {
      const y = oy + 3 + i * 5;
      const x = ox + ((Math.floor(hash2(tx, ty, i) * 10) + frame * 2) % 12);
      c.rect(x, y, 3, 1, '#7FC4F2');
    }
    if (!isWater(n(0, -1))) c.rect(ox, oy, TILE, 2, '#D8F0FF');
    if (!isWater(n(-1, 0))) c.rect(ox, oy, 1, TILE, '#BEE6F2');
    if (!isWater(n(1, 0))) c.rect(ox + 15, oy, 1, TILE, '#BEE6F2');
  },
  deepWater(c, ox, oy, tx, ty, frame) {
    c.rect(ox, oy, TILE, TILE, '#24589A');
    const x = ox + ((Math.floor(hash2(tx, ty) * 10) + frame * 3) % 12);
    c.rect(x, oy + 7, 4, 1, '#3A7ACA');
  },
  tree(c, ox, oy, tx, ty) {
    grassBase(c, ox, oy, tx, ty);
    c.rect(ox + 6, oy + 11, 4, 5, '#6E4A2A');
    c.ellipse(ox + 1, oy, 14, 13, '#2E6A3A');
    c.ellipse(ox + 3, oy + 1, 9, 7, '#3E8A4A');
    c.set(ox + 5, oy + 3, '#5AAA5A');
  },
  sakura(c, ox, oy, tx, ty, frame) {
    grassBase(c, ox, oy, tx, ty);
    c.rect(ox + 7, oy + 10, 3, 6, '#5A3A2A');
    c.ellipse(ox, oy, 16, 12, '#E88AA8');
    c.ellipse(ox + 2, oy + 1, 11, 7, '#F4B4CA');
    for (let i = 0; i < 4; i++)
      c.set(ox + Math.floor(hash2(tx, ty, i + frame) * 14) + 1, oy + Math.floor(hash2(tx, ty, i + 7) * 10), '#FFE0EA');
  },
  bamboo(c, ox, oy, tx, ty, frame) {
    c.rect(ox, oy, TILE, TILE, '#3E7A3A');
    for (let i = 0; i < 3; i++) {
      const x = ox + 2 + i * 5 + ((frame + i) % 2);
      c.rect(x, oy, 2, TILE, '#8AC85A');
      c.rect(x, oy + 5 + i, 2, 1, '#5A8A3A');
      c.rect(x, oy + 12 - i, 2, 1, '#5A8A3A');
      c.set(x + 2, oy + 4 + i * 3, '#6AB04A');
    }
  },
  rock(c, ox, oy, tx, ty) {
    grassBase(c, ox, oy, tx, ty);
    c.ellipse(ox + 1, oy + 3, 14, 12, '#7A7A84');
    c.ellipse(ox + 3, oy + 4, 8, 5, '#9A9AA4');
    c.set(ox + 10, oy + 10, '#5A5A64');
  },
  wall(c, ox, oy) {
    c.rect(ox, oy, TILE, TILE, '#E8DCC0'); // plaster
    c.rect(ox, oy, TILE, 2, '#5A3A2A'); // beam
    c.rect(ox, oy + 14, TILE, 2, '#3A2A20');
    c.rect(ox + 7, oy + 2, 2, 12, '#5A3A2A');
  },
  roof(c, ox, oy, tx) {
    c.rect(ox, oy, TILE, TILE, '#3A3A5A');
    for (let y = 0; y < TILE; y += 4) c.rect(ox, oy + y, TILE, 1, '#2A2A44');
    for (let x = (tx % 2) * 2; x < TILE; x += 4) c.rect(ox + x, oy, 1, TILE, '#4A4A6E');
  },
  floor(c, ox, oy) {
    c.rect(ox, oy, TILE, TILE, '#B88A5A');
    for (let y = 3; y < TILE; y += 4) c.rect(ox, oy + y, TILE, 1, '#9A6E44');
  },
  tatami(c, ox, oy, tx, ty) {
    const horiz = (tx + ty) % 2 === 0;
    c.rect(ox, oy, TILE, TILE, '#C8C08A');
    for (let i = 1; i < TILE; i += 2) horiz ? c.rect(ox, oy + i, TILE, 1, '#B8B07A') : c.rect(ox + i, oy, 1, TILE, '#B8B07A');
    c.rect(ox, oy, TILE, 1, '#3A5A3A');
    c.rect(ox, oy, 1, TILE, '#3A5A3A');
  },
  door(c, ox, oy) {
    c.rect(ox, oy, TILE, TILE, '#5A3A2A');
    c.rect(ox + 1, oy + 1, 14, 15, '#F0E6CC'); // shōji
    for (let x = 4; x < 15; x += 4) c.rect(ox + x, oy + 1, 1, 15, '#7A5A3A');
    for (let y = 5; y < 16; y += 5) c.rect(ox + 1, oy + y, 14, 1, '#7A5A3A');
  },
  bridge(c, ox, oy, tx, ty, frame, n) {
    P.water(c, ox, oy, tx, ty, frame, n);
    c.rect(ox, oy + 1, TILE, 14, '#A8784A');
    for (let x = 0; x < TILE; x += 4) c.rect(ox + x, oy + 1, 1, 14, '#7A5432');
    c.rect(ox, oy, TILE, 1, '#C0392B');
    c.rect(ox, oy + 15, TILE, 1, '#C0392B');
  },
  flower(c, ox, oy, tx, ty, frame) {
    grassBase(c, ox, oy, tx, ty);
    const colors = ['#F4A7C0', '#FFE14B', '#FFFFFF', '#9A7AEF'];
    for (let i = 0; i < 4; i++) {
      const x = ox + 2 + Math.floor(hash2(tx, ty, i) * 11);
      const y = oy + 2 + Math.floor(hash2(tx, ty, i + 4) * 11) - (frame % 2);
      c.set(x, y, colors[i % colors.length] as string);
      c.set(x, y + 1, '#2E6A2A');
    }
  },
  torii(c, ox, oy, tx, ty) {
    P.path(c, ox, oy, tx, ty, 0, () => 'path');
    c.rect(ox, oy + 1, TILE, 2, '#C8302A');
    c.rect(ox, oy, TILE, 1, '#2A1A1A');
    c.rect(ox + 1, oy + 5, 14, 1, '#C8302A');
    c.rect(ox + 2, oy + 3, 2, 13, '#C8302A');
    c.rect(ox + 12, oy + 3, 2, 13, '#C8302A');
  },
  fence(c, ox, oy, tx, ty) {
    grassBase(c, ox, oy, tx, ty);
    c.rect(ox, oy + 6, TILE, 2, '#8A6A3A');
    c.rect(ox, oy + 11, TILE, 2, '#8A6A3A');
    c.rect(ox + 2, oy + 4, 2, 11, '#6E4A2A');
    c.rect(ox + 12, oy + 4, 2, 11, '#6E4A2A');
  },
  lantern(c, ox, oy, tx, ty, frame, n) {
    // Stand on whatever surrounds it: tatami indoors, path or grass outside.
    const under = n(0, 1);
    const base: TileKind = under === 'tatami' || under === 'floor' || under === 'grass' ? under : 'path';
    P[base](c, ox, oy, tx, ty, 0, n);
    c.rect(ox + 6, oy + 11, 4, 4, '#7A7A84');
    c.rect(ox + 4, oy + 9, 8, 2, '#8A8A94');
    c.rect(ox + 5, oy + 4, 6, 5, '#9A9AA4');
    c.rect(ox + 7, oy + 5, 2, 3, frame ? '#FFD86A' : '#FFB347');
    c.rect(ox + 3, oy + 2, 10, 2, '#7A7A84');
  },
  snow(c, ox, oy, tx, ty) {
    c.rect(ox, oy, TILE, TILE, '#E8F0F8');
    c.set(ox + Math.floor(hash2(tx, ty) * 16), oy + Math.floor(hash2(ty, tx) * 16), '#C8D8E8');
  },
  // ── Arc 2: Frost Harbor ─────────────────────────────────────────────
  ice(c, ox, oy, tx, ty, frame) {
    c.rect(ox, oy, TILE, TILE, '#BFE3F2');
    c.line(ox + 2, oy + 12, ox + 7, oy + 7, '#E8F8FF');
    c.line(ox + 9, oy + 14, ox + 14, oy + 9, '#9CCDE2');
    if ((frame + tx + ty) % 2 === 0) c.set(ox + 4 + Math.floor(hash2(tx, ty) * 8), oy + 3, '#FFFFFF');
  },
  drift(c, ox, oy, tx, ty, frame) {
    P.snow(c, ox, oy, tx, ty, frame, () => 'snow');
    for (let i = 0; i < 3; i++) {
      const x = ox + 1 + i * 5;
      const lift = (frame + i) % 2;
      c.ellipse(x, oy + 7 - lift, 6, 6, '#FFFFFF');
      c.rect(x + 1, oy + 12 - lift, 4, 1, '#C8D8E8');
    }
  },
  dock(c, ox, oy, tx) {
    c.rect(ox, oy, TILE, TILE, '#8A6A4A');
    for (let x = 0; x < TILE; x += 4) c.rect(ox + x, oy, 1, TILE, '#5A4232');
    c.set(ox + 2 + (tx % 3) * 4, oy + 5, '#3A2A20');
    c.set(ox + 2 + (tx % 3) * 4, oy + 11, '#3A2A20');
  },
  pine(c, ox, oy, tx, ty) {
    P.snow(c, ox, oy, tx, ty, 0, () => 'snow');
    c.rect(ox + 7, oy + 12, 2, 4, '#5A3A2A');
    for (let i = 0; i < 4; i++) c.rect(ox + 7 - i * 2, oy + 1 + i * 3, 2 + i * 4, 3, i % 2 ? '#1E4A3A' : '#2A5A44');
  },
  snowPine(c, ox, oy, tx, ty) {
    P.pine(c, ox, oy, tx, ty, 0, () => 'snow');
    for (let i = 0; i < 4; i++) c.rect(ox + 7 - i * 2, oy + 1 + i * 3, 2 + i * 4, 1, '#F4F8FF');
  },
  longhouseWall(c, ox, oy) {
    c.rect(ox, oy, TILE, TILE, '#6E4A2E');
    for (let y = 0; y < TILE; y += 4) c.rect(ox, oy + y, TILE, 1, '#4A3020');
    c.rect(ox, oy, 2, TILE, '#3A2618');
  },
  longhouseRoof(c, ox, oy, tx, ty) {
    c.rect(ox, oy, TILE, TILE, '#7A6A4A'); // turf/thatch
    for (let y = 2; y < TILE; y += 4) c.rect(ox, oy + y, TILE, 1, '#5A4A32');
    c.rect(ox, oy, TILE, 3, '#F4F8FF'); // snow on the ridge
    c.set(ox + Math.floor(hash2(tx, ty) * 14), oy + 3, '#FFFFFF');
  },
  runestone(c, ox, oy, tx, ty) {
    P.snow(c, ox, oy, tx, ty, 0, () => 'snow');
    c.ellipse(ox + 3, oy + 1, 10, 15, '#8A8A94');
    c.ellipse(ox + 4, oy + 2, 6, 6, '#A0A0AA');
    // A carved rune: a vertical stave with two branches, painted red.
    c.line(ox + 8, oy + 4, ox + 8, oy + 12, '#B3262E');
    c.line(ox + 8, oy + 6, ox + 11, oy + 4, '#B3262E');
    c.line(ox + 8, oy + 9, ox + 11, oy + 7, '#B3262E');
  },
  hull(c, ox, oy, tx) {
    c.rect(ox, oy, TILE, TILE, '#5A3A22');
    for (let y = 3; y < TILE; y += 4) c.rect(ox, oy + y, TILE, 1, '#3A2414');
    // Painted round shields along the gunwale.
    if (tx % 2 === 0) {
      c.ellipse(ox + 3, oy + 3, 10, 10, tx % 4 === 0 ? '#B3262E' : '#E8B04B');
      c.ellipse(ox + 7, oy + 7, 3, 3, '#C9D2DC');
    }
  },
  // ── Arc 3: Castle Capital ───────────────────────────────────────────
  stoneWall(c, ox, oy, tx, ty) {
    // Dry-laid castle stonework: staggered blocks with dark mortar.
    c.rect(ox, oy, TILE, TILE, '#4A4A54');
    for (let row = 0; row < 4; row++) {
      const shift = (row + ty) % 2 ? 4 : 0;
      for (let col = -1; col < 3; col++) {
        const x = ox + col * 8 + shift;
        const shade = hash2(tx * 4 + col, ty * 4 + row) > 0.5 ? '#8A8A94' : '#7A7A84';
        c.rect(Math.max(ox, x + 1), oy + row * 4 + 1, Math.min(7, ox + TILE - (x + 1)), 3, shade);
      }
    }
  },
  gravel(c, ox, oy, tx, ty) {
    // Raked zen gravel: pale with combed ripples.
    c.rect(ox, oy, TILE, TILE, '#D8D0BC');
    for (let y = 2; y < TILE; y += 4) c.rect(ox, oy + y, TILE, 1, '#BEB49C');
    if (hash2(tx, ty) > 0.8) c.ellipse(ox + 5, oy + 5, 6, 5, '#8A8A94');
  },
  noren(c, ox, oy, tx, ty, frame) {
    // Shop front: dark wood frame with an indigo noren curtain that sways.
    c.rect(ox, oy, TILE, TILE, '#5A3A22');
    c.rect(ox + 1, oy + 1, 14, 2, '#3A2414');
    const sway = frame ? 1 : 0;
    for (let i = 0; i < 3; i++) c.rect(ox + 2 + i * 4 + sway, oy + 3, 3, 9, '#2A3A8A');
    c.rect(ox + 6 + sway, oy + 6, 4, 3, '#F4F1EA'); // the shop's crest
  },
  // ── Arc 4: Mountain Temples ─────────────────────────────────────────
  waterfall(c, ox, oy, tx, ty, frame) {
    // Falling water: bright vertical streaks that scroll between frames.
    c.rect(ox, oy, TILE, TILE, '#5AA0D8');
    for (let x = 0; x < TILE; x += 3) {
      const start = (x * 5 + frame * 6 + ty * 4) % TILE;
      c.rect(ox + x, oy + start, 1, 6, '#E8F8FF');
      c.rect(ox + x + 1, oy + ((start + 8) % TILE), 1, 4, '#9CCDE2');
    }
  },
  stairs(c, ox, oy, tx, ty) {
    // Worn stone steps with moss in the cracks.
    c.rect(ox, oy, TILE, TILE, '#9A9AA4');
    for (let y = 0; y < TILE; y += 4) {
      c.rect(ox, oy + y, TILE, 1, '#6A6A74');
      c.rect(ox, oy + y + 1, TILE, 1, '#B4B4BE');
    }
    if (hash2(tx, ty) > 0.6) c.rect(ox + 2 + Math.floor(hash2(ty, tx) * 10), oy + 4, 3, 1, '#4A7A3A');
  },
  cliff(c, ox, oy, tx, ty) {
    // Sheer rock face: layered bands and a crack or two.
    c.rect(ox, oy, TILE, TILE, '#6A5A4A');
    for (let y = 2; y < TILE; y += 5) c.rect(ox, oy + y, TILE, 2, '#5A4A3A');
    const x = ox + Math.floor(hash2(tx, ty) * 12) + 2;
    c.line(x, oy, x - 2, oy + 7, '#3A2E24');
    c.line(x - 2, oy + 7, x, oy + 15, '#3A2E24');
    if (hash2(tx + 3, ty) > 0.7) c.rect(ox + 3, oy, 4, 2, '#4A7A3A');
  },
  void(c, ox, oy) {
    c.rect(ox, oy, TILE, TILE, '#0B0B12');
  },
};

/** Paint one tile at (ox, oy) inside a larger canvas. */
export function paintTile(
  c: PixelCanvas,
  kind: TileKind,
  ox: number,
  oy: number,
  tx: number,
  ty: number,
  frame: number,
  neighbor: Neighbor,
) {
  P[kind](c, ox, oy, tx, ty, frame, neighbor);
}
