import { PixelCanvas, shade } from './pixel';

// Story objects and animals for the folk-tale scenes, keyed 'prop:<name>'. Each is a
// 16x16 drawing made from a few shapes, outlined like every other sprite. Animals
// face the viewer; they never walk, so one pose is enough.

const OUT = '#120C18';
const EYE = '#120C18';
const WHITE = '#F4F1EA';
const WOOD = '#8A5A32';
const STONE = '#9A9AA6';
const RED = '#C0392B';
const GOLD = '#E8B04B';

type Painter = (c: PixelCanvas) => void;

/** Two black eyes at (x, y) and (x + gap, y). */
const eyes = (c: PixelCanvas, x: number, y: number, gap = 3) => {
  c.set(x, y, EYE);
  c.set(x + gap, y, EYE);
};

const P: Record<string, Painter> = {
  // ── Food and plants ───────────────────────────────────────────────
  peach: (c) => {
    c.ellipse(2, 4, 12, 11, '#F4A7B0');
    c.ellipse(3, 6, 6, 6, '#F8C6C8');
    c.line(8, 5, 8, 9, shade('#F4A7B0', -0.2));
    c.rect(7, 2, 2, 3, '#6B4A2E');
    c.ellipse(9, 1, 5, 3, '#5BAA5B');
  },
  persimmon: (c) => {
    c.rect(7, 8, 2, 7, WOOD);
    c.ellipse(1, 1, 14, 9, '#4E8A4E');
    for (const [x, y] of [[3, 3], [9, 2], [6, 6], [11, 5]] as const) c.ellipse(x, y, 3, 3, '#E8742A');
  },
  riceball: (c) => {
    c.ellipse(2, 3, 12, 11, WHITE);
    c.rect(5, 10, 6, 4, '#1E3A2A');
    c.set(5, 6, '#DDD6C8');
    c.set(9, 7, '#DDD6C8');
  },
  bamboo: (c) => {
    for (const x of [2, 7, 11]) c.rect(x, 0, 3, 16, x === 7 ? '#C8E87A' : '#4E8A4E');
    for (const y of [3, 8, 13]) c.rect(2, y, 12, 1, '#2F5A2F');
    c.ellipse(6, 5, 5, 6, '#FFF4B0');
    c.rect(8, 7, 1, 2, GOLD);
  },
  wishbamboo: (c) => {
    c.rect(7, 1, 2, 15, '#4E8A4E');
    c.line(8, 4, 2, 2, '#4E8A4E');
    c.line(8, 7, 14, 4, '#4E8A4E');
    for (const [x, y, col] of [[2, 3, RED], [12, 5, '#5B8DEF'], [4, 8, GOLD], [11, 10, '#F4A7C0']] as const) c.rect(x, y, 2, 4, col);
  },
  willow: (c) => {
    c.rect(7, 6, 2, 10, '#6B4A2E');
    c.ellipse(2, 0, 12, 8, '#7AB86A');
    for (const x of [2, 4, 11, 13]) c.rect(x, 5, 1, 7, '#7AB86A');
  },
  spring: (c) => {
    c.ellipse(1, 6, 14, 9, STONE);
    c.ellipse(3, 8, 10, 5, '#5B8DEF');
    c.rect(5, 9, 3, 1, '#A8D4FF');
    c.rect(7, 2, 1, 5, '#A8D4FF');
  },
  // ── Animals ───────────────────────────────────────────────────────
  dog: (c) => {
    c.ellipse(3, 7, 10, 8, WHITE);
    c.ellipse(4, 2, 8, 7, WHITE);
    c.rect(3, 2, 2, 3, '#DDD6C8');
    c.rect(11, 2, 2, 3, '#DDD6C8');
    eyes(c, 6, 5);
    c.rect(7, 7, 2, 1, EYE);
    c.rect(5, 9, 6, 1, RED);
  },
  monkey: (c) => {
    c.ellipse(3, 7, 10, 8, '#8A5A3A');
    c.ellipse(3, 1, 10, 8, '#8A5A3A');
    c.ellipse(5, 3, 6, 5, '#F0B8A0');
    c.rect(2, 3, 2, 2, '#F0B8A0');
    c.rect(12, 3, 2, 2, '#F0B8A0');
    eyes(c, 6, 4);
    c.rect(7, 6, 2, 1, '#C0605A');
  },
  bear: (c) => {
    c.ellipse(2, 6, 12, 10, '#5A3A22');
    c.ellipse(3, 1, 10, 9, '#5A3A22');
    c.rect(3, 1, 3, 3, '#5A3A22');
    c.rect(10, 1, 3, 3, '#5A3A22');
    c.ellipse(6, 5, 4, 3, '#C8A07A');
    eyes(c, 5, 4, 5);
    c.set(7, 5, EYE);
    c.rect(6, 10, 4, 2, '#F4E9D0');
  },
  hare: (c) => {
    c.ellipse(3, 8, 10, 7, WHITE);
    c.ellipse(4, 4, 8, 7, WHITE);
    c.rect(5, 0, 2, 6, WHITE);
    c.rect(9, 0, 2, 6, WHITE);
    c.rect(5, 1, 1, 4, '#F4A7C0');
    c.rect(10, 1, 1, 4, '#F4A7C0');
    c.set(6, 7, RED);
    c.set(9, 7, RED);
  },
  sparrow: (c) => {
    c.ellipse(3, 5, 10, 9, '#8A6A4A');
    c.ellipse(5, 8, 6, 5, '#E8D8B8');
    c.ellipse(5, 3, 6, 5, '#6B4A2E');
    eyes(c, 6, 5, 3);
    c.rect(7, 6, 2, 1, GOLD);
    c.rect(6, 14, 1, 2, GOLD);
    c.rect(9, 14, 1, 2, GOLD);
  },
  crane: (c) => {
    c.ellipse(3, 7, 10, 6, WHITE);
    c.rect(8, 1, 2, 8, WHITE);
    c.rect(8, 0, 2, 2, RED);
    c.rect(10, 1, 3, 1, '#3A3A3A');
    c.rect(3, 9, 3, 3, '#1E1E2A');
    c.rect(6, 13, 1, 3, '#3A3A3A');
    c.rect(10, 13, 1, 3, '#3A3A3A');
  },
  turtle: (c) => {
    c.ellipse(2, 5, 12, 9, '#4E7A3A');
    c.ellipse(4, 6, 8, 6, '#6A9A4A');
    c.line(8, 6, 8, 11, '#3A5A2A');
    c.line(5, 9, 11, 9, '#3A5A2A');
    c.ellipse(6, 1, 4, 5, '#8AAA6A');
    eyes(c, 7, 3, 1);
    for (const [x, y] of [[2, 12], [12, 12], [2, 6], [12, 6]] as const) c.rect(x, y, 2, 2, '#8AAA6A');
  },
  crab: (c) => {
    c.ellipse(2, 7, 12, 7, '#D84A2A');
    c.rect(1, 3, 3, 3, '#D84A2A');
    c.rect(12, 3, 3, 3, '#D84A2A');
    c.rect(2, 6, 1, 2, '#D84A2A');
    c.rect(13, 6, 1, 2, '#D84A2A');
    c.rect(6, 5, 1, 2, '#D84A2A');
    c.rect(9, 5, 1, 2, '#D84A2A');
    eyes(c, 6, 4, 3);
    for (const x of [3, 5, 10, 12]) c.rect(x, 14, 1, 2, '#B83A1A');
  },
  mouse: (c) => {
    c.ellipse(3, 7, 10, 8, '#A8A0A8');
    c.ellipse(4, 3, 8, 7, '#A8A0A8');
    c.ellipse(2, 1, 5, 5, '#C8B8C0');
    c.ellipse(9, 1, 5, 5, '#C8B8C0');
    eyes(c, 6, 6);
    c.set(7, 8, '#F4A7C0');
    c.line(12, 12, 15, 9, '#C8A0A8');
  },
  cow: (c) => {
    c.ellipse(2, 5, 12, 10, WHITE);
    c.ellipse(3, 7, 4, 4, '#2A2A2A');
    c.ellipse(9, 9, 4, 3, '#2A2A2A');
    c.rect(2, 2, 2, 3, '#DDD6C8');
    c.rect(12, 2, 2, 3, '#DDD6C8');
    c.ellipse(5, 11, 6, 4, '#F4C8C0');
    eyes(c, 5, 6, 5);
  },
  rooster: (c) => {
    c.ellipse(3, 5, 10, 9, WHITE);
    c.rect(6, 1, 4, 3, RED);
    c.rect(10, 5, 2, 1, GOLD);
    c.rect(9, 6, 1, 2, RED);
    c.set(8, 4, EYE);
    c.ellipse(1, 3, 4, 7, '#2A4A3A');
    c.rect(6, 14, 1, 2, GOLD);
    c.rect(9, 14, 1, 2, GOLD);
  },
  toad: (c) => {
    c.ellipse(1, 4, 14, 11, '#6A7A3A');
    c.ellipse(2, 2, 4, 4, '#6A7A3A');
    c.ellipse(10, 2, 4, 4, '#6A7A3A');
    c.set(3, 3, GOLD);
    c.set(12, 3, GOLD);
    c.rect(4, 9, 8, 1, '#3A4A1A');
    c.ellipse(4, 10, 8, 4, '#C8C88A');
  },
  jellyfish: (c) => {
    c.ellipse(2, 1, 12, 8, '#C8B8F0');
    c.ellipse(4, 2, 5, 3, '#E8E0FF');
    for (const x of [3, 6, 9, 12]) c.line(x, 8, x + ((x % 2) ? 1 : -1), 15, '#A898E0');
    eyes(c, 6, 5);
  },
  shark: (c) => {
    c.ellipse(1, 6, 14, 6, '#6A7A8A');
    c.rect(7, 2, 3, 4, '#6A7A8A');
    c.ellipse(3, 9, 10, 3, '#DDE4E8');
    c.set(4, 8, EYE);
    c.line(3, 10, 6, 10, WHITE);
  },
  spider: (c) => {
    c.ellipse(5, 6, 6, 6, '#3A2A3A');
    c.ellipse(6, 3, 4, 4, '#3A2A3A');
    c.rect(7, 8, 2, 2, GOLD);
    for (const y of [5, 7, 9, 11]) {
      c.line(5, y, 1, y - 2, '#3A2A3A');
      c.line(10, y, 14, y - 2, '#3A2A3A');
    }
    c.line(8, 0, 8, 3, '#DDE4E8');
  },
  bigspider: (c) => {
    c.ellipse(3, 5, 10, 9, '#4A2A1A');
    c.ellipse(5, 1, 6, 6, '#4A2A1A');
    for (const [x, y] of [[6, 3], [9, 3], [7, 2], [8, 4]] as const) c.set(x, y, RED);
    c.rect(6, 8, 4, 3, '#C8A04A');
    for (const y of [4, 7, 10, 13]) {
      c.line(3, y, 0, y + 2, '#4A2A1A');
      c.line(12, y, 15, y + 2, '#4A2A1A');
    }
  },
  centipede: (c) => {
    for (let i = 0; i < 6; i++) {
      const x = 2 + i * 2;
      const y = 3 + ((i % 2) * 2) + i;
      c.ellipse(x, y, 4, 3, '#8A2A1A');
      c.set(x, y + 3, GOLD);
      c.set(x + 3, y + 3, GOLD);
    }
    c.rect(1, 2, 3, 3, '#5A1A0A');
    c.set(2, 3, GOLD);
  },
  serpent: (c) => {
    for (const [x, y] of [[1, 2], [5, 0], [9, 1], [12, 3]] as const) {
      c.rect(x + 1, y + 3, 2, 8, '#3A6A4A');
      c.ellipse(x, y, 4, 4, '#3A6A4A');
      c.set(x + 1, y + 1, RED);
    }
    c.ellipse(1, 10, 14, 6, '#3A6A4A');
    c.ellipse(3, 11, 10, 3, '#8AAA6A');
  },
  // ── Things ────────────────────────────────────────────────────────
  kettle: (c) => {
    c.ellipse(2, 5, 12, 10, '#4A4A52');
    c.rect(5, 3, 6, 3, '#4A4A52');
    c.rect(6, 2, 4, 1, '#6A6A72');
    c.line(3, 4, 13, 4, '#8A6A3A');
    c.rect(13, 8, 3, 2, '#4A4A52');
    c.ellipse(5, 7, 6, 4, '#8A6A4A');
    eyes(c, 6, 8, 3);
    c.rect(0, 11, 2, 3, '#8A6A4A');
  },
  mortar: (c) => {
    c.ellipse(2, 3, 12, 4, '#B07A4A');
    c.rect(3, 5, 10, 8, '#8A5A32');
    c.ellipse(4, 3, 8, 3, '#5A3A20');
    c.rect(2, 12, 12, 2, '#6A4226');
    c.ellipse(5, 3, 6, 2, WHITE);
  },
  loom: (c) => {
    c.rect(1, 2, 2, 13, WOOD);
    c.rect(13, 2, 2, 13, WOOD);
    c.rect(1, 2, 14, 2, WOOD);
    c.rect(3, 4, 10, 8, WHITE);
    for (const x of [5, 8, 11]) c.rect(x, 5, 1, 6, '#DDE4E8');
    c.rect(3, 12, 10, 2, shade(WOOD, -0.2));
  },
  basket: (c) => {
    c.rect(1, 6, 9, 8, '#B8925A');
    c.rect(1, 5, 9, 2, '#8A6A3A');
    c.rect(10, 10, 5, 4, '#B8925A');
    c.rect(10, 9, 5, 2, '#8A6A3A');
    for (const y of [8, 11]) c.rect(1, y, 9, 1, '#8A6A3A');
  },
  box: (c) => {
    c.rect(2, 5, 12, 9, '#2A1A2A');
    c.rect(2, 4, 12, 3, '#3A2238');
    c.rect(7, 4, 2, 10, RED);
    c.rect(2, 8, 12, 2, RED);
    c.ellipse(6, 1, 4, 4, RED);
    for (const [x, y] of [[4, 11], [11, 6]] as const) c.set(x, y, GOLD);
  },
  bowl: (c) => {
    c.ellipse(1, 7, 14, 7, '#B3262E');
    c.ellipse(2, 7, 12, 3, '#2A1414');
    c.rect(7, 1, 2, 7, '#F2C9A0');
    c.rect(6, 0, 4, 2, '#1B1420');
    c.line(10, 2, 14, 8, '#DDE4E8');
    c.rect(2, 12, 1, 3, '#8A6A3A');
  },
  jizo: (c) => {
    c.ellipse(4, 1, 8, 7, STONE);
    c.rect(3, 6, 10, 9, STONE);
    c.rect(4, 7, 8, 3, RED);
    c.ellipse(2, 0, 12, 4, '#C9A15A');
    eyes(c, 6, 4, 3);
    c.rect(2, 14, 12, 2, shade(STONE, -0.25));
  },
  well: (c) => {
    c.rect(1, 8, 14, 7, STONE);
    c.rect(1, 8, 14, 1, shade(STONE, 0.2));
    c.rect(3, 9, 10, 2, '#1A1A24');
    c.rect(2, 1, 1, 8, WOOD);
    c.rect(13, 1, 1, 8, WOOD);
    c.rect(1, 1, 14, 2, '#5A3A22');
    c.rect(7, 3, 2, 4, '#8A6A3A');
  },
  wall: (c) => {
    c.rect(0, 1, 16, 15, '#C8B89A');
    for (const y of [5, 10]) c.rect(0, y, 16, 1, '#A8987A');
    eyes(c, 4, 7, 7);
    c.rect(6, 12, 4, 1, '#8A7A5A');
  },
  skull: (c) => {
    c.ellipse(2, 1, 12, 11, '#E8E4D8');
    c.rect(4, 10, 8, 4, '#E8E4D8');
    c.ellipse(4, 5, 3, 3, '#120C18');
    c.ellipse(9, 5, 3, 3, '#120C18');
    c.rect(7, 8, 2, 2, '#3A3030');
    for (const x of [5, 7, 9]) c.rect(x, 12, 1, 2, '#8A8478');
  },
  barrel: (c) => {
    c.ellipse(2, 2, 12, 13, '#B07A4A');
    c.rect(2, 4, 12, 1, '#3A3A3A');
    c.rect(2, 11, 12, 1, '#3A3A3A');
    c.rect(5, 6, 6, 4, WHITE);
    c.rect(7, 7, 2, 2, RED);
  },
  bell: (c) => {
    c.rect(7, 0, 2, 2, '#5A4A3A');
    c.ellipse(3, 1, 10, 6, '#6A7A5A');
    c.rect(3, 4, 10, 10, '#6A7A5A');
    c.rect(2, 13, 12, 2, '#5A6A4A');
    for (const y of [6, 9]) c.rect(3, y, 10, 1, '#4A5A3A');
    c.rect(5, 10, 2, 2, GOLD);
  },
  ladle: (c) => {
    c.rect(7, 0, 2, 9, WOOD);
    c.ellipse(3, 8, 10, 7, '#B07A4A');
    c.ellipse(5, 10, 6, 3, '#1A1A24');
  },
  fan: (c) => {
    c.ellipse(1, 0, 14, 12, '#E8E0C8');
    for (let i = 0; i < 5; i++) c.line(8, 12, 2 + i * 3, 2, '#C8B89A');
    c.rect(7, 11, 2, 5, WOOD);
    c.ellipse(5, 3, 6, 4, RED);
  },
  mirror: (c) => {
    c.ellipse(2, 0, 12, 12, '#C8A04A');
    c.ellipse(3, 1, 10, 10, '#C8E0F0');
    c.rect(5, 3, 2, 3, WHITE);
    c.rect(6, 11, 4, 4, '#6A4A2A');
  },
  boulder: (c) => {
    c.ellipse(0, 2, 16, 14, '#7A7480');
    c.ellipse(2, 3, 7, 5, '#9A94A0');
    c.line(10, 5, 8, 12, '#5A5460');
    c.rect(0, 14, 16, 2, '#5A5460');
    c.rect(4, 0, 8, 2, '#E8E0C8');
    for (const x of [5, 8, 11]) c.rect(x, 2, 1, 2, WHITE);
  },
  stone: (c) => {
    c.ellipse(1, 3, 14, 12, '#8A8494');
    c.ellipse(3, 4, 6, 4, '#AAA4B0');
    c.line(9, 7, 12, 11, '#5A5460');
    c.rect(1, 13, 3, 2, '#5A5460');
  },
  hook: (c) => {
    c.line(8, 0, 8, 9, '#C8C8D0');
    c.line(8, 9, 5, 12, '#C8C8D0');
    c.line(5, 12, 4, 9, '#C8C8D0');
    c.ellipse(1, 11, 14, 5, '#5B8DEF');
    c.ellipse(9, 11, 5, 3, '#E86A6A');
  },
  robe: (c) => {
    c.rect(4, 1, 8, 13, '#E8F0FF');
    c.line(1, 3, 4, 1, '#E8F0FF');
    c.line(14, 3, 11, 1, '#E8F0FF');
    c.rect(1, 3, 3, 8, '#D8E4FF');
    c.rect(12, 3, 3, 8, '#D8E4FF');
    for (const [x, y] of [[6, 4], [9, 7], [7, 10], [2, 6], [13, 8]] as const) c.set(x, y, '#F4A7C0');
    c.rect(4, 6, 8, 1, GOLD);
  },
  drum: (c) => {
    c.ellipse(3, 2, 10, 12, '#B3262E');
    c.ellipse(5, 4, 6, 8, '#F4E9D0');
    c.ellipse(6, 6, 4, 4, '#E8B04B');
    for (const [x, y] of [[1, 1], [13, 2], [0, 12], [14, 12]] as const) c.ellipse(x, y, 3, 3, '#B3262E');
  },
  windbag: (c) => {
    c.ellipse(1, 3, 14, 12, '#4E8A6A');
    c.rect(6, 1, 4, 3, '#4E8A6A');
    c.rect(5, 3, 6, 1, GOLD);
    c.line(2, 2, 0, 0, '#DDE4E8');
    c.line(13, 2, 15, 0, '#DDE4E8');
    c.ellipse(4, 7, 4, 3, '#6AAA8A');
  },
  treasureship: (c) => {
    c.rect(7, 0, 1, 9, WOOD);
    c.rect(3, 1, 9, 7, WHITE);
    c.rect(5, 3, 5, 3, RED);
    c.ellipse(0, 9, 16, 6, '#8A4A2A');
    c.rect(0, 9, 16, 2, '#B07A4A');
    for (const x of [3, 7, 11]) c.rect(x, 8, 2, 2, GOLD);
    c.rect(0, 14, 16, 2, '#5B8DEF');
  },
  peonylantern: (c) => {
    c.rect(7, 0, 2, 3, '#3A3A3A');
    c.rect(4, 2, 8, 2, '#3A3A3A');
    c.ellipse(3, 3, 10, 11, '#F8E8C0');
    c.ellipse(5, 6, 6, 5, '#E86A8A');
    c.ellipse(6, 7, 3, 3, '#F4A7C0');
    c.rect(4, 13, 8, 2, '#3A3A3A');
  },
  papercrane: (c) => {
    c.line(1, 6, 8, 9, '#F4E9D0');
    c.line(14, 6, 8, 9, '#F4E9D0');
    c.rect(4, 7, 8, 3, '#F4E9D0');
    c.line(3, 7, 1, 2, '#E8E0C8');
    c.line(12, 7, 14, 2, '#E8E0C8');
    c.rect(7, 4, 2, 4, '#E85A5A');
    c.rect(6, 4, 1, 1, '#E85A5A');
  },
  paperdoll: (c) => {
    c.ellipse(5, 1, 6, 5, WHITE);
    c.rect(4, 6, 8, 8, WHITE);
    c.rect(1, 7, 3, 2, WHITE);
    c.rect(12, 7, 3, 2, WHITE);
    c.rect(4, 14, 3, 2, WHITE);
    c.rect(9, 14, 3, 2, WHITE);
    c.rect(7, 8, 2, 4, RED);
  },
  catscroll: (c) => {
    c.rect(1, 1, 14, 14, '#EFE2C2');
    c.rect(1, 1, 14, 1, WOOD);
    c.rect(1, 14, 14, 1, WOOD);
    for (const [x, y] of [[3, 3], [9, 3], [6, 8]] as const) {
      c.ellipse(x, y, 4, 4, '#3A3A3A');
      c.set(x, y - 1, '#3A3A3A');
      c.set(x + 3, y - 1, '#3A3A3A');
      c.set(x + 1, y + 1, GOLD);
      c.set(x + 2, y + 1, GOLD);
    }
  },
  biwa: (c) => {
    c.ellipse(3, 5, 10, 11, '#8A4A2A');
    c.rect(7, 0, 2, 7, '#5A2A1A');
    c.rect(6, 0, 4, 1, '#3A1A0A');
    for (const x of [6, 7, 8, 9]) c.line(x, 1, x, 13, '#E8D8B8');
    c.ellipse(5, 9, 3, 2, '#3A1A0A');
    eyes(c, 5, 7, 5);
  },
  cloth: (c) => {
    for (let x = 0; x < 16; x++) c.rect(x, 4 + Math.round(Math.sin(x / 2.5) * 3), 1, 5, WHITE);
    c.set(3, 5, EYE);
    c.set(5, 6, EYE);
  },
  sword: (c) => {
    c.line(3, 13, 13, 2, '#C8C8D8');
    c.line(4, 13, 14, 2, '#E8E8F0');
    c.rect(2, 11, 4, 2, GOLD);
    c.line(0, 15, 3, 12, '#2A1A2A');
  },
  baby: (c) => {
    c.ellipse(3, 5, 10, 10, '#F4E9D0');
    c.ellipse(5, 2, 6, 6, '#F4CFAE');
    eyes(c, 6, 4, 3);
    c.rect(7, 6, 2, 1, '#C0605A');
    c.rect(3, 9, 10, 1, '#F4A7C0');
  },
  longneck: (c) => {
    c.rect(4, 10, 8, 6, '#7A4E8A');
    c.rect(7, 4, 2, 7, '#F4D2B4');
    c.line(8, 4, 11, 1, '#F4D2B4');
    c.ellipse(9, 0, 6, 5, '#F4D2B4');
    c.rect(9, 0, 6, 2, '#15101C');
    c.set(11, 2, EYE);
    c.set(13, 2, EYE);
  },
  // ── The Storyteller's Hall ─────────────────────────────────────────
  /** A found tale: a lit paper lantern on a stand, a scroll hanging from it. */
  storylantern: (c) => {
    c.rect(7, 10, 2, 5, WOOD);
    c.rect(4, 14, 8, 2, shade(WOOD, -0.2));
    c.ellipse(3, 1, 10, 10, '#FFE9A8');
    c.ellipse(5, 3, 6, 6, '#FFF6D8');
    c.rect(3, 1, 10, 1, '#5A3A22');
    c.rect(3, 10, 10, 1, '#5A3A22');
    c.rect(7, 4, 2, 4, RED);
  },
  /** A tale still out there: the same lantern, dark. */
  darklantern: (c) => {
    c.rect(7, 10, 2, 5, WOOD);
    c.rect(4, 14, 8, 2, shade(WOOD, -0.2));
    c.ellipse(3, 1, 10, 10, '#5A5466');
    c.ellipse(5, 3, 6, 6, '#6A6478');
    c.rect(3, 1, 10, 1, '#3A2A22');
    c.rect(3, 10, 10, 1, '#3A2A22');
    c.rect(7, 5, 2, 2, '#8A8494');
  },
  /** The hall's gate: a small roofed doorway with a hanging lantern. */
  hallgate: (c) => {
    c.rect(1, 2, 14, 3, '#3A2A3A');
    c.rect(0, 4, 16, 1, '#5A3A4A');
    c.rect(2, 5, 2, 11, '#8A2A1E');
    c.rect(12, 5, 2, 11, '#8A2A1E');
    c.rect(4, 6, 8, 10, '#2A1A14');
    c.rect(5, 7, 6, 3, '#EFE2C2');
    c.ellipse(6, 10, 4, 4, '#FFE9A8');
    c.set(7, 11, RED);
  },
  akaname: (c) => {
    c.ellipse(3, 2, 10, 10, '#D8584A');
    c.rect(4, 10, 8, 5, '#D8584A');
    c.rect(4, 1, 8, 2, '#2A1414');
    eyes(c, 6, 5, 3);
    c.rect(6, 8, 4, 1, '#120C18');
    c.rect(7, 9, 2, 6, '#F47A9A');
  },
};

export const PROP_IDS = Object.keys(P);

/** 'peach' → its drawing. Unknown names get an obvious magenta blob. */
export function drawProp(name: string): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  const painter = P[name];
  if (painter) painter(c);
  else c.ellipse(3, 3, 10, 10, '#FF00FF');
  c.outline(OUT);
  return c;
}

/** A wooden direction post with an arrow board and a small roof. */
export function drawSignpost(): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  c.rect(7, 3, 2, 13, shade(WOOD, -0.15));
  c.rect(2, 4, 12, 4, WOOD);
  c.rect(12, 5, 3, 2, WOOD);
  c.rect(3, 5, 8, 1, '#EFE6CC');
  c.rect(4, 2, 8, 2, '#5A3A22');
  c.rect(6, 1, 4, 1, '#5A3A22');
  c.rect(5, 15, 6, 1, '#6A4A2A');
  c.outline(OUT);
  return c;
}
