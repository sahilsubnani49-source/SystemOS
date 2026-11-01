import { PixelCanvas, shade } from './pixel';

const OUT = '#120C18';
const EYE = '#120C18';
const W = '#FFFFFF';

type Painter = (c: PixelCanvas, stage: number) => void;

// Each painter draws one folklore-inspired body plan. Stages add features
// (extra tails, auras, armour) rather than swapping to unrelated designs, so an
// evolved spirit is still recognisably the one you raised.
const PAINTERS: Record<string, Painter> = {
  akari(c, stage) {
    // Paper lantern (chōchin-obake): ribbed oval, one big eye, lolling tongue.
    const body = stage === 2 ? '#F6D27A' : '#F2E2B8';
    c.rect(6, 1, 4, 1, '#3A2A20');
    c.ellipse(3, 2, 10, 12, body);
    for (let y = 4; y <= 12; y += 2) c.rect(4, y, 8, 1, shade(body, -0.12));
    c.rect(6, 14, 4, 1, '#3A2A20');
    c.ellipse(5, 5, 4, 4, W);
    c.rect(6, 6, 2, 2, EYE);
    c.rect(8, 10, 3, 1, EYE);
    c.rect(9, 11, 2, 2, '#E25A6A');
    const flame = stage >= 1 ? '#FF8A2A' : '#FFB347';
    c.rect(1, 6, 2, 3, flame);
    c.rect(13, 6, 2, 3, flame);
    if (stage === 2) { c.rect(0, 4, 1, 2, '#FFE14B'); c.rect(15, 4, 1, 2, '#FFE14B'); }
  },
  kobi(c, stage) {
    // Kitsune: ears, white muzzle, foxfire tails (1 / 3 / 9 visible as a fan).
    const fur = stage === 2 ? '#F4E9D0' : '#E8873A';
    c.ellipse(4, 6, 8, 7, fur);
    c.rect(4, 3, 2, 3, fur); c.rect(10, 3, 2, 3, fur);
    c.set(5, 4, '#F2A0A8'); c.set(10, 4, '#F2A0A8');
    c.rect(6, 9, 4, 3, W);
    c.set(6, 7, EYE); c.set(9, 7, EYE); c.set(7, 10, EYE);
    c.rect(5, 13, 2, 2, fur); c.rect(9, 13, 2, 2, fur);
    const tails = stage === 0 ? 1 : stage === 1 ? 3 : 5;
    for (let t = 0; t < tails; t++) {
      const x = 12 + Math.min(2, t);
      const y = 4 + t * 2;
      c.rect(x, y, 2, 2, fur);
      c.set(x + 1, y - 1, '#5AB8FF');
    }
  },
  suiko(c, stage) {
    // Kappa: green body, water dish on head, beak, turtle shell edge.
    const skin = stage === 2 ? '#2E8A6A' : '#5AB86A';
    c.ellipse(3, 4, 10, 10, skin);
    c.ellipse(5, 2, 6, 3, '#BEE6F2');
    c.rect(6, 2, 4, 1, '#E8F8FF');
    c.rect(6, 9, 4, 2, '#E8B04B');
    c.set(6, 7, EYE); c.set(9, 7, EYE);
    c.rect(3, 11, 10, 2, stage >= 1 ? '#6B4A2E' : '#8A6A3A');
    c.rect(4, 14, 2, 1, skin); c.rect(10, 14, 2, 1, skin);
    if (stage >= 1) { c.set(2, 6, '#7FD4FF'); c.set(13, 5, '#7FD4FF'); }
    if (stage === 2) c.rect(1, 9, 1, 3, '#7FD4FF');
  },
  tanu(c, stage) {
    // Tanuki: round belly, dark eye-mask, leaf on the head.
    const fur = '#8A6A4A';
    c.ellipse(3, 3, 10, 12, fur);
    c.ellipse(5, 8, 6, 6, '#D9C29A');
    c.rect(4, 5, 3, 2, '#3A2A20'); c.rect(9, 5, 3, 2, '#3A2A20');
    c.set(5, 5, W); c.set(10, 5, W);
    c.set(7, 7, EYE); c.set(8, 7, EYE);
    c.rect(6, 1, 4, 2, '#4CB04C'); c.set(8, 0, '#4CB04C');
    if (stage >= 1) { c.rect(1, 9, 2, 3, '#6E5A3A'); c.rect(13, 9, 2, 3, '#6E5A3A'); }
    if (stage === 2) { c.rect(5, 12, 6, 1, '#B8C0C8'); c.rect(4, 11, 8, 1, '#8A929A'); }
  },
  nekaze(c, stage) {
    // Crow tengu: black bird, wings out, red face at stage 2.
    const feather = '#2A2A3A';
    c.ellipse(4, 3, 8, 10, feather);
    c.rect(1, 6, 3, 5, shade(feather, 0.1)); c.rect(12, 6, 3, 5, shade(feather, 0.1));
    c.rect(0, 7, 1, 3, feather); c.rect(15, 7, 1, 3, feather);
    c.rect(5, 5, 6, 3, stage === 2 ? '#C83A3A' : '#3A3A4E');
    c.set(6, 6, '#FFE14B'); c.set(9, 6, '#FFE14B');
    c.rect(7, 8, 2, 2, '#E8B04B');
    c.rect(6, 13, 1, 2, '#E8B04B'); c.rect(9, 13, 1, 2, '#E8B04B');
    if (stage >= 1) c.rect(6, 1, 4, 2, '#1A1A24');
  },
  hikari(c, stage) {
    // Raijū: lightning wolf-cub with zigzag stripes.
    const fur = stage === 2 ? '#6A7AFF' : '#9AB0FF';
    c.ellipse(3, 5, 10, 8, fur);
    c.rect(3, 3, 2, 3, fur); c.rect(11, 3, 2, 3, fur);
    c.set(6, 7, '#FFE14B'); c.set(9, 7, '#FFE14B');
    c.rect(7, 9, 2, 1, EYE);
    c.line(4, 10, 6, 12, '#FFE14B'); c.line(11, 10, 9, 12, '#FFE14B');
    c.rect(4, 13, 2, 2, fur); c.rect(10, 13, 2, 2, fur);
    c.line(13, 6, 15, 3, '#FFE14B');
    if (stage >= 1) c.line(0, 4, 2, 7, '#FFE14B');
    if (stage === 2) { c.rect(5, 1, 6, 1, '#FFE14B'); c.set(7, 0, '#FFE14B'); }
  },
  mimi(c, stage) {
    // Nekomata: cat, splitting tail, shadow-purple at stage 2.
    const fur = stage === 2 ? '#3A2A4A' : '#E8E0D0';
    c.ellipse(3, 5, 9, 8, fur);
    c.rect(3, 3, 2, 3, fur); c.rect(10, 3, 2, 3, fur);
    c.set(4, 4, '#F2A0A8'); c.set(10, 4, '#F2A0A8');
    c.rect(5, 7, 2, 2, stage === 2 ? '#C86AFF' : '#5AC85A');
    c.rect(8, 7, 2, 2, stage === 2 ? '#C86AFF' : '#5AC85A');
    c.set(5, 7, EYE); c.set(8, 7, EYE);
    c.set(7, 10, '#E25A6A');
    if (stage < 2) { c.rect(4, 6, 1, 1, '#E8873A'); c.rect(10, 9, 2, 2, '#3A3A3A'); }
    c.line(12, 10, 15, 6, fur);
    if (stage >= 1) c.line(12, 11, 15, 10, fur);
    c.rect(4, 13, 2, 2, fur); c.rect(9, 13, 2, 2, fur);
  },
  yozakura(c, stage) {
    // Kodama blossom sprite: pale round head, blossom crown, twig arms.
    const body = '#F4F1EA';
    c.ellipse(4, 4, 8, 9, body);
    c.set(6, 7, EYE); c.set(9, 7, EYE);
    c.ellipse(6, 9, 4, 2, shade(body, -0.25));
    const petal = stage === 2 ? '#FFD84B' : '#F4A7C0';
    for (const [x, y] of [[4, 2], [7, 1], [10, 2], [5, 3], [9, 3]] as const) c.rect(x, y, 2, 2, petal);
    c.line(3, 9, 1, 7, '#6E4A2A'); c.line(12, 9, 14, 7, '#6E4A2A');
    c.rect(6, 13, 1, 2, '#6E4A2A'); c.rect(9, 13, 1, 2, '#6E4A2A');
    if (stage >= 1) { c.set(1, 6, petal); c.set(14, 6, petal); }
  },
  riki(c, stage) {
    // Komainu: stone guardian lion with curly mane.
    const stone = stage === 2 ? '#D8B04A' : '#A8A4A0';
    const mane = shade(stone, -0.2);
    c.ellipse(2, 2, 12, 11, mane);
    for (const [x, y] of [[2, 4], [12, 4], [3, 10], [11, 10], [7, 1]] as const) c.rect(x, y, 2, 2, shade(mane, -0.1));
    c.ellipse(4, 4, 8, 8, stone);
    c.rect(5, 6, 2, 2, W); c.rect(9, 6, 2, 2, W);
    c.set(6, 7, EYE); c.set(10, 7, EYE);
    c.rect(6, 9, 4, 2, '#5A3A3A'); c.set(6, 9, W); c.set(9, 9, W);
    c.rect(4, 13, 3, 2, stone); c.rect(9, 13, 3, 2, stone);
    if (stage >= 1) c.rect(6, 12, 4, 1, '#C0392B');
  },
  wadachi(c, stage) {
    // Umibōzu: looming sea-monk blob rising from waves.
    const body = stage === 2 ? '#1A2A5A' : '#2A3A6A';
    c.ellipse(3, 1, 10, 13, body);
    c.rect(5, 5, 2, 2, '#BEE6F2'); c.rect(9, 5, 2, 2, '#BEE6F2');
    c.set(6, 6, EYE); c.set(10, 6, EYE);
    c.rect(1, 12, 14, 2, '#3A7ACA');
    for (let x = 1; x < 15; x += 3) c.set(x, 11, '#BEE6F2');
    c.rect(0, 14, 16, 1, '#2A5AAA');
    if (stage >= 1) { c.rect(2, 7, 1, 4, body); c.rect(13, 7, 1, 4, body); }
    if (stage === 2) c.rect(6, 0, 4, 1, '#E8B04B');
  },
};

export function drawSpirit(familyId: string, stage: number): PixelCanvas {
  const c = new PixelCanvas(16, 16);
  const painter = PAINTERS[familyId];
  if (painter) painter(c, stage);
  else c.ellipse(3, 3, 10, 10, '#FF00FF'); // magenta = missing art, impossible to miss
  c.outline(OUT);
  return c;
}

export const SPIRIT_ART_IDS = Object.keys(PAINTERS);
