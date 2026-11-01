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
  // ── Arc 2: Norse / Germanic folklore ───────────────────────────────
  alv(c, stage) {
    // Light elf: slim glowing figure, long ears, wings of light at stage 1+.
    const glow = stage === 2 ? '#FFE9A0' : '#F4F1EA';
    if (stage >= 1) { c.rect(1, 5, 3, 6, '#FFF4D8'); c.rect(12, 5, 3, 6, '#FFF4D8'); }
    c.ellipse(5, 2, 6, 6, '#F4D2B4');
    c.rect(4, 3, 1, 2, '#F4D2B4'); c.rect(11, 3, 1, 2, '#F4D2B4'); c.set(3, 2, '#F4D2B4'); c.set(12, 2, '#F4D2B4');
    c.rect(5, 1, 6, 2, stage === 2 ? '#FFE14B' : '#E8D08A');
    c.set(6, 4, '#5AB8FF'); c.set(9, 4, '#5AB8FF');
    c.rect(5, 8, 6, 6, glow);
    c.rect(6, 14, 1, 2, glow); c.rect(9, 14, 1, 2, glow);
    if (stage === 2) c.rect(7, 0, 2, 1, '#FFE14B');
  },
  kobold(c, stage) {
    // Mine spirit: stocky, pointed hood, pickaxe; lantern-crown when evolved.
    c.rect(5, 1, 6, 1, '#B3262E'); c.rect(4, 2, 8, 3, '#B3262E'); c.set(7, 0, '#B3262E');
    c.ellipse(4, 4, 8, 6, '#8A9A6A');
    c.set(6, 6, '#FFE14B'); c.set(9, 6, '#FFE14B');
    c.rect(6, 8, 4, 2, '#D9C29A'); // beard
    c.rect(4, 10, 8, 4, '#6E5A4A');
    c.rect(5, 14, 2, 2, '#3A2A20'); c.rect(9, 14, 2, 2, '#3A2A20');
    c.line(12, 7, 14, 13, '#8A6A3A'); c.rect(12, 6, 4, 2, '#B8C0C8');
    if (stage >= 1) c.rect(3, 11, 1, 3, '#C9D2DC');
    if (stage === 2) { c.rect(5, 0, 6, 1, '#E8B04B'); c.set(7, 0, '#FFE14B'); }
  },
  sleip(c, stage) {
    // Storm colt: grey foal; legs multiply toward the eight-legged steed.
    const coat = stage === 2 ? '#E8E8F0' : '#A8A8B8';
    c.rect(3, 6, 10, 5, coat);
    c.rect(10, 2, 3, 6, coat); c.rect(11, 1, 4, 3, coat);
    c.set(13, 2, '#120C18');
    c.rect(9, 1, 2, 5, '#5A6AFF');
    c.rect(1, 6, 2, 4, '#5A6AFF');
    const legs = stage === 0 ? [4, 11] : stage === 1 ? [4, 6, 9, 11] : [3, 4, 6, 7, 9, 10, 11, 12];
    for (const x of legs) c.rect(x, 11, 1, 4, shade(coat, -0.2));
    if (stage >= 1) c.line(14, 8, 15, 5, '#FFE14B');
  },
  troll(c, stage) {
    // Tomte → troll: big nose, mossy back, grows a boulder-like hide.
    const skin = stage === 0 ? '#9A8A6A' : '#7A8A5A';
    if (stage === 0) { c.rect(5, 1, 6, 3, '#B3262E'); c.set(8, 0, '#B3262E'); } // tomte cap
    c.ellipse(2, 3, 12, 11, skin);
    c.set(5, 6, '#120C18'); c.set(10, 6, '#120C18');
    c.ellipse(6, 7, 4, 4, shade(skin, -0.1)); // the nose
    c.rect(6, 11, 4, 1, '#F4E9D0');
    c.rect(3, 14, 3, 2, shade(skin, -0.2)); c.rect(10, 14, 3, 2, shade(skin, -0.2));
    if (stage >= 1) { c.rect(2, 3, 3, 2, '#4A7A3A'); c.rect(11, 2, 3, 2, '#4A7A3A'); }
    if (stage === 2) { c.rect(1, 9, 2, 3, '#8A8A94'); c.rect(13, 9, 2, 3, '#8A8A94'); c.rect(6, 2, 4, 1, '#E8F0F8'); }
  },
  nokk(c, stage) {
    // Water-horse: kelp-maned horse head rising from a pool.
    const coat = stage === 2 ? '#2A6A8A' : '#4A8AAA';
    c.rect(4, 3, 6, 9, coat);
    c.rect(8, 1, 6, 4, coat);
    c.set(12, 2, '#E8F8FF');
    c.rect(3, 1, 2, 9, '#3A8A4A'); // kelp mane
    c.rect(0, 12, 16, 2, '#3A86C8');
    for (let x = 1; x < 15; x += 3) c.set(x, 11, '#BEE6F2');
    if (stage >= 1) c.rect(13, 4, 2, 1, '#7FC4F2');
    if (stage === 2) { c.rect(1, 14, 14, 1, '#24589A'); c.set(10, 0, '#E8F8FF'); }
  },
  hrafn(c, stage) {
    // Rune raven: black bird, glowing rune on the chest when evolved.
    const f = '#1E1E2A';
    c.ellipse(4, 3, 9, 10, f);
    c.rect(1, 6, 3, 6, '#2A2A3A'); c.rect(12, 6, 3, 6, '#2A2A3A');
    c.rect(11, 4, 4, 2, '#3A3A4A'); // beak base
    c.rect(13, 5, 3, 1, '#C9D2DC');
    c.set(9, 5, '#E8574B');
    c.rect(6, 13, 1, 3, '#C9D2DC'); c.rect(9, 13, 1, 3, '#C9D2DC');
    if (stage >= 1) { c.line(7, 7, 7, 11, '#7FC4F2'); c.line(7, 8, 9, 7, '#7FC4F2'); }
    if (stage === 2) { c.rect(0, 5, 1, 7, '#7FC4F2'); c.rect(15, 7, 1, 5, '#7FC4F2'); }
  },
  muspel(c, stage) {
    // Fire imp: ember body, flame hair that grows taller.
    const body = stage === 2 ? '#C83A1A' : '#E8572A';
    c.ellipse(3, 5, 10, 9, body);
    const flame = stage === 0 ? 2 : stage === 1 ? 4 : 5;
    for (let i = 0; i < 4; i++) c.rect(4 + i * 2, 5 - flame + (i % 2), 2, flame, i % 2 ? '#FFB347' : '#FFE14B');
    c.rect(5, 8, 2, 2, '#FFE14B'); c.rect(9, 8, 2, 2, '#FFE14B');
    c.set(5, 8, '#120C18'); c.set(9, 8, '#120C18');
    c.rect(6, 11, 4, 1, '#5A1A0A');
    c.rect(4, 14, 2, 2, '#5A1A0A'); c.rect(10, 14, 2, 2, '#5A1A0A');
    if (stage === 2) { c.rect(1, 7, 2, 2, '#FFB347'); c.rect(13, 7, 2, 2, '#FFB347'); }
  },
  yulecat(c, stage) {
    // The Yule Cat: huge black cat with glowing eyes; gets a red yule ribbon.
    c.ellipse(2, 5, 12, 9, '#1A1A24');
    c.rect(2, 2, 3, 4, '#1A1A24'); c.rect(11, 2, 3, 4, '#1A1A24');
    c.rect(4, 7, 3, 2, '#FFE14B'); c.rect(9, 7, 3, 2, '#FFE14B');
    c.set(5, 7, '#120C18'); c.set(10, 7, '#120C18');
    c.rect(7, 10, 2, 1, '#F2A0A8');
    c.line(13, 11, 15, 6, '#1A1A24');
    if (stage >= 1) c.rect(4, 12, 8, 1, '#B3262E');
    if (stage === 2) { c.set(3, 1, '#F4F8FF'); c.set(12, 1, '#F4F8FF'); c.rect(7, 12, 2, 2, '#E8B04B'); }
  },
  ratatosk(c, stage) {
    // World-tree squirrel: big bushy tail crackling with sparks.
    const fur = '#C87A3A';
    c.ellipse(1, 2, 7, 12, stage === 2 ? '#E8A04A' : fur); // tail
    c.ellipse(6, 6, 7, 8, fur);
    c.rect(7, 4, 2, 2, fur); c.rect(11, 4, 2, 2, fur);
    c.set(8, 8, '#120C18'); c.set(11, 8, '#120C18');
    c.rect(8, 11, 4, 2, '#F4E9D0');
    c.rect(7, 14, 2, 2, '#5A3A22'); c.rect(11, 14, 2, 2, '#5A3A22');
    if (stage >= 1) { c.line(2, 3, 4, 6, '#FFE14B'); c.line(4, 6, 2, 9, '#FFE14B'); }
    if (stage === 2) c.rect(13, 1, 2, 3, '#4CB04C'); // carries a world-tree leaf
  },
  wyrm(c, stage) {
    // Sea serpent: coils above the waves; more coils as it evolves.
    const scale = stage === 2 ? '#1A5A4A' : '#2A7A5A';
    const coils = stage + 1;
    for (let i = 0; i < coils; i++) c.ellipse(1 + i * 4, 8, 5, 5, shade(scale, i * 0.05));
    c.ellipse(9, 2, 7, 6, scale);
    c.set(13, 4, '#FFE14B');
    c.rect(14, 6, 2, 1, '#E8574B');
    c.rect(9, 1, 1, 3, '#4CB0A0'); // fin
    c.rect(0, 12, 16, 2, '#3A86C8');
    for (let x = 0; x < 16; x += 4) c.set(x + 1, 11, '#BEE6F2');
  },
  // ── Arc 3: castle-town spirits (tsukumogami and guardians) ──────────
  soroban(c, stage) {
    // Abacus-bead spirit: a frame of beads with eyes; more rods as it evolves.
    const frame = '#6E4A2A';
    c.rect(1, 3, 14, 1, frame); c.rect(1, 12, 14, 1, frame); c.rect(1, 3, 1, 10, frame); c.rect(14, 3, 1, 10, frame);
    c.rect(2, 6, 12, 1, frame);
    const rods = stage === 0 ? 3 : stage === 1 ? 4 : 5;
    for (let i = 0; i < rods; i++) {
      const x = 3 + i * Math.floor(10 / rods);
      c.rect(x, 4, 2, 2, '#B3262E');
      c.rect(x, 8 + (i % 2), 2, 2, stage === 2 ? '#E8B04B' : '#C87A3A');
    }
    c.set(5, 1, '#120C18'); c.set(10, 1, '#120C18'); c.rect(4, 0, 8, 1, frame);
    c.rect(4, 13, 2, 3, frame); c.rect(10, 13, 2, 3, frame);
  },
  koyomi(c, stage) {
    // Almanac scroll spirit with a sun (日) or moon (月) disc on it.
    c.rect(3, 2, 10, 12, '#F4E9D0');
    c.rect(2, 1, 12, 2, '#8A5A2B'); c.rect(2, 13, 12, 2, '#8A5A2B');
    c.ellipse(5, 4, 6, 6, stage === 1 ? '#E8E0C8' : stage === 2 ? '#E8B04B' : '#E8574B');
    c.set(6, 10, '#120C18'); c.set(9, 10, '#120C18');
    c.rect(7, 11, 2, 1, '#B3262E');
    if (stage >= 1) { c.rect(0, 5, 2, 2, '#FFB347'); c.rect(14, 5, 2, 2, '#FFB347'); }
  },
  hansho(c, stage) {
    // Fire-watch bell: a bronze bell with a face, hanging from a beam.
    const bronze = stage === 2 ? '#C89A3A' : '#8A6A3A';
    c.rect(2, 0, 12, 2, '#5A3A22');
    c.rect(7, 2, 2, 2, '#3A2A1A');
    c.ellipse(3, 3, 10, 10, bronze);
    c.rect(3, 11, 10, 2, shade(bronze, -0.15));
    c.set(6, 7, '#120C18'); c.set(9, 7, '#120C18');
    c.rect(7, 9, 2, 1, '#120C18');
    c.rect(7, 13, 2, 2, '#3A2A1A');
    if (stage >= 1) { c.line(0, 4, 2, 7, '#FFE14B'); c.line(15, 4, 13, 7, '#FFE14B'); }
  },
  hina(c, stage) {
    // Hina doll: white face, black hair, layered court robes.
    const robe = stage === 0 ? '#E8A0B8' : stage === 1 ? '#B3262E' : '#3A2A6A';
    c.rect(5, 1, 6, 3, '#14141E');
    c.rect(6, 3, 4, 4, '#F4F1EA');
    c.set(7, 5, '#120C18'); c.set(9, 5, '#120C18'); c.set(8, 6, '#E25A6A');
    c.rect(3, 7, 10, 7, robe);
    c.rect(4, 8, 8, 1, '#E8B04B'); c.rect(4, 10, 8, 1, shade(robe, 0.15));
    c.rect(7, 7, 2, 7, '#F4F1EA');
    if (stage === 2) { c.rect(5, 0, 6, 1, '#E8B04B'); c.rect(1, 9, 2, 2, '#E8B04B'); }
  },
  ashigaru(c, stage) {
    // Karakuri foot-soldier: wooden clockwork body, jingasa hat, spear later.
    const wood = '#B8844A';
    c.rect(4, 1, 8, 2, '#2A2A3A'); c.rect(3, 3, 10, 1, '#2A2A3A');
    c.rect(5, 4, 6, 4, wood);
    c.set(6, 5, '#120C18'); c.set(9, 5, '#120C18');
    c.rect(4, 8, 8, 4, stage === 0 ? wood : '#3A3A5A');
    c.ellipse(6, 9, 4, 3, '#E8B04B'); // the winding key
    c.rect(5, 12, 2, 4, wood); c.rect(9, 12, 2, 4, wood);
    if (stage >= 1) c.line(13, 1, 13, 14, '#8A6A3A');
    if (stage === 2) c.rect(12, 0, 3, 2, '#C9D2DC');
  },
  kazamuki(c, stage) {
    // Weathervane spirit: a crowing rooster on a cross of directions.
    c.rect(7, 6, 2, 10, '#5A5A66');
    c.rect(2, 12, 12, 1, '#5A5A66');
    c.ellipse(4, 2, 9, 6, stage === 2 ? '#E8B04B' : '#C87A3A');
    c.rect(11, 0, 3, 3, '#B3262E'); // comb
    c.set(11, 3, '#120C18');
    c.rect(13, 4, 2, 1, '#E8B04B');
    c.rect(2, 3, 3, 3, stage >= 1 ? '#5AA0C8' : '#8A5A2B'); // tail
    if (stage >= 1) { c.line(0, 8, 3, 8, '#D8F0FF'); c.line(12, 9, 15, 9, '#D8F0FF'); }
  },
  karakasa(c, stage) {
    // Kasa-obake: a one-eyed paper umbrella hopping on a single leg.
    const paper = stage === 0 ? '#B3262E' : stage === 1 ? '#E8A0B8' : '#2A3A8A';
    c.rect(7, 0, 2, 1, '#3A2A1A');
    c.ellipse(1, 1, 14, 9, paper);
    for (let x = 3; x < 14; x += 3) c.line(8, 1, x, 9, shade(paper, -0.2));
    c.ellipse(6, 3, 4, 4, '#FFFFFF'); c.rect(7, 4, 2, 2, '#120C18');
    c.rect(9, 7, 3, 2, '#E25A6A'); // the long tongue
    c.rect(7, 10, 2, 4, '#8A5A2B');
    c.rect(6, 14, 4, 2, '#F4E9D0');
    if (stage >= 1) { c.set(2, 12, '#7FC4F2'); c.set(13, 11, '#7FC4F2'); }
  },
  zori(c, stage) {
    // Bake-zori: a straw sandal with eyes, arms and legs, always running.
    c.ellipse(2, 3, 12, 10, '#D8B87A');
    for (let y = 5; y < 12; y += 2) c.rect(4, y, 8, 1, '#B8984A');
    c.rect(7, 2, 2, 4, stage === 2 ? '#B3262E' : '#3A2A6A'); // the thong strap
    c.set(5, 7, '#120C18'); c.set(10, 7, '#120C18');
    c.rect(6, 9, 4, 1, '#120C18');
    c.line(1, 8, 0, 12, '#8A5A2B'); c.line(14, 8, 15, 12, '#8A5A2B');
    c.rect(4, 13, 1, 3, '#8A5A2B'); c.rect(11, 12, 1, 3, '#8A5A2B');
    if (stage >= 1) { c.rect(0, 13, 2, 1, '#FFB347'); }
  },
  kagami(c, stage) {
    // Ungaikyo: a round bronze mirror on a stand, with a face in the glass.
    const rim = stage === 2 ? '#E8B04B' : '#8A6A3A';
    c.ellipse(2, 0, 12, 12, rim);
    c.ellipse(3, 1, 10, 10, stage === 0 ? '#C8D8E8' : '#E8F4FF');
    c.set(6, 5, '#120C18'); c.set(9, 5, '#120C18');
    c.rect(7, 7, 2, 1, '#8E6CEF');
    c.rect(7, 12, 2, 2, rim); c.rect(4, 14, 8, 2, rim);
    if (stage >= 1) { c.set(5, 3, '#FFFFFF'); c.set(4, 4, '#FFFFFF'); }
  },
  dosojin(c, stage) {
    // Dosojin: a mossy roadside stone guardian in a red bib.
    const stone = '#8A8A94';
    c.ellipse(3, 1, 10, 14, stone);
    c.rect(5, 5, 2, 1, '#120C18'); c.rect(9, 5, 2, 1, '#120C18');
    c.rect(7, 7, 2, 1, '#5A5A64');
    c.rect(4, 9, 8, 4, '#B3262E'); // bib
    c.rect(3, 14, 10, 2, '#5A5A64');
    if (stage >= 1) { c.rect(3, 2, 3, 2, '#4A7A3A'); c.rect(11, 3, 2, 2, '#4A7A3A'); }
    if (stage === 2) { c.rect(5, 0, 6, 1, '#E8B04B'); c.rect(6, 10, 4, 2, '#E8B04B'); }
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
