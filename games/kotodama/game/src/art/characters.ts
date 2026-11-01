import { PixelCanvas, shade } from './pixel';

export type Facing = 'up' | 'down' | 'left' | 'right';
export type HairStyle = 'topknot' | 'hood' | 'long' | 'bald' | 'kasa' | 'helmet' | 'oniHorns' | 'bun' | 'kabuto';
export type Gear = 'katana' | 'scarf' | 'beard' | 'club' | 'staff' | 'axe' | 'fan' | 'shield' | 'none';

export interface CharacterSpec {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  trim: string;
  bottom: string;
  gear: Gear[];
  /** Face cloth (ninja). */
  mask?: string;
  eye?: string;
}

const OUTLINE = '#120C18';

/**
 * Draws a 16×16 chibi character. `left` is produced by mirroring `right`.
 * frame 0 = standing, frame 1 = mid-step (legs apart, body bobs a pixel).
 */
export function drawCharacter(spec: CharacterSpec, facing: Facing, frame: 0 | 1): PixelCanvas {
  if (facing === 'left') return drawCharacter(spec, 'right', frame).flipX();
  const c = new PixelCanvas(16, 16);
  const bob = frame === 1 ? 1 : 0;
  const side = facing === 'right';
  const back = facing === 'up';
  const eye = spec.eye ?? '#1A1020';

  // Legs / hakama (drawn first so the body overlaps).
  const legY = 12;
  c.rect(4, legY, 8, 2, spec.bottom);
  c.rect(4, legY + 2, 3, 1, shade(spec.bottom, -0.12));
  c.rect(9, legY + 2, 3, 1, shade(spec.bottom, -0.12));
  if (frame === 0) {
    c.rect(5, 15, 2, 1, '#2A1E1A');
    c.rect(9, 15, 2, 1, '#2A1E1A');
  } else {
    c.rect(side ? 3 : 4, 15, 2, 1, '#2A1E1A');
    c.rect(side ? 10 : 10, 14, 2, 1, '#2A1E1A');
  }

  // Torso with a lighter centre panel and trim belt.
  const by = 8 + bob;
  c.rect(4, by, 8, 4, spec.top);
  c.rect(side ? 6 : 5, by, side ? 4 : 6, 1, shade(spec.top, 0.12));
  c.rect(4, by + 3, 8, 1, spec.trim);
  if (!back && !side) {
    c.set(7, by, spec.trim);
    c.set(8, by, spec.trim);
    c.set(7, by + 1, spec.skin);
    c.set(8, by + 1, spec.skin);
  }
  // Arms.
  if (side) {
    c.rect(8, by + 1, 2, 3, shade(spec.top, -0.1));
    c.set(9, by + 4, spec.skin);
  } else {
    c.rect(3, by, 1, 3, shade(spec.top, -0.1));
    c.rect(12, by, 1, 3, shade(spec.top, -0.1));
    c.set(3, by + 3, spec.skin);
    c.set(12, by + 3, spec.skin);
  }

  // Head.
  const hy = 2 + bob;
  c.rect(5, hy, 6, 6, spec.skin);
  if (!back) {
    if (side) {
      c.set(9, hy + 3, eye);
      c.set(10, hy + 4, shade(spec.skin, -0.15));
    } else {
      c.set(6, hy + 3, eye);
      c.set(9, hy + 3, eye);
      c.set(6, hy + 4, shade(spec.skin, 0.1));
    }
  }
  drawHair(c, spec, hy, side, back);
  if (spec.mask && !back) c.rect(side ? 7 : 5, hy + 4, side ? 4 : 6, 2, spec.mask);

  for (const g of spec.gear) drawGear(c, g, spec, by, hy, side, back);
  c.outline(OUTLINE);
  return c;
}

function drawHair(c: PixelCanvas, s: CharacterSpec, hy: number, side: boolean, back: boolean) {
  const h = s.hair;
  switch (s.hairStyle) {
    case 'topknot':
      c.rect(5, hy, 6, 2, h);
      c.rect(7, hy - 2, 2, 2, h);
      if (side) c.rect(5, hy, 2, 4, h);
      if (back) c.rect(5, hy, 6, 5, h);
      break;
    case 'bun':
      c.rect(5, hy, 6, 2, h);
      c.ellipse(6, hy - 2, 4, 3, h);
      c.set(10, hy - 1, '#E04848');
      if (back) c.rect(5, hy, 6, 5, h);
      break;
    case 'long':
      c.rect(5, hy, 6, 2, h);
      c.rect(4, hy + 1, 1, 7, h);
      c.rect(11, hy + 1, 1, 7, h);
      if (side) c.rect(4, hy, 3, 8, h);
      if (back) c.rect(4, hy, 8, 8, h);
      break;
    case 'hood':
      c.rect(4, hy - 1, 8, 3, h);
      c.rect(4, hy + 2, 1, 4, h);
      c.rect(11, hy + 2, 1, 4, h);
      if (back) c.rect(4, hy - 1, 8, 7, h);
      if (side) c.rect(4, hy - 1, 4, 7, h);
      break;
    case 'kasa': // conical straw hat
      c.rect(3, hy, 10, 1, h);
      c.rect(5, hy - 1, 6, 1, h);
      c.rect(7, hy - 2, 2, 1, h);
      c.rect(2, hy + 1, 12, 1, shade(h, -0.15));
      break;
    case 'helmet': // round Norse helm with nasal guard
      c.ellipse(4, hy - 2, 8, 5, h);
      c.rect(4, hy + 1, 8, 1, shade(h, -0.2));
      if (!back) c.rect(side ? 9 : 7, hy + 2, side ? 1 : 2, 2, shade(h, -0.2));
      break;
    case 'oniHorns':
      c.rect(5, hy, 6, 2, h);
      c.rect(4, hy - 2, 1, 3, '#F4E9D0');
      c.rect(11, hy - 2, 1, 3, '#F4E9D0');
      if (back) c.rect(5, hy, 6, 5, h);
      break;
    case 'bald':
      c.set(7, hy, shade(s.skin, 0.12));
      break;
    case 'kabuto': // samurai helmet: dark bowl, flared neck guard, golden crest
      c.rect(4, hy - 1, 8, 3, h);
      c.rect(3, hy + 2, 2, 3, h);
      c.rect(11, hy + 2, 2, 3, h);
      if (back) c.rect(4, hy, 8, 5, h);
      else {
        c.line(5, hy - 3, 7, hy - 1, '#E8B04B');
        c.line(10, hy - 3, 8, hy - 1, '#E8B04B');
      }
      break;
  }
}

function drawGear(c: PixelCanvas, g: Gear, s: CharacterSpec, by: number, hy: number, side: boolean, back: boolean) {
  switch (g) {
    case 'katana':
      if (side) {
        c.line(3, by + 5, 7, by + 2, '#C9D2DC');
        c.set(7, by + 2, '#5A3A22');
      } else {
        c.line(back ? 4 : 11, by + 1, back ? 12 : 13, by - 4, '#C9D2DC');
        c.set(back ? 4 : 11, by + 1, '#5A3A22');
      }
      break;
    case 'scarf':
      c.rect(4, by, 8, 1, '#D1343B');
      if (!side) c.rect(back ? 7 : 10, by + 1, 2, 3, '#D1343B');
      else c.rect(3, by, 2, 3, '#D1343B');
      break;
    case 'beard':
      if (!back) c.rect(side ? 7 : 5, hy + 4, side ? 4 : 6, 3, s.hair === '#F4E9D0' ? '#F4E9D0' : shade(s.hair, 0.1));
      break;
    case 'club':
      c.rect(side ? 10 : 13, by - 3, 2, 7, '#5B5B66');
      c.set(side ? 10 : 13, by - 3, '#9A9AAA');
      break;
    case 'staff':
      c.rect(side ? 10 : 13, by - 5, 1, 10, '#8A5A2B');
      c.ellipse(side ? 9 : 12, by - 7, 3, 3, '#E8B04B');
      break;
    case 'axe':
      c.rect(side ? 10 : 13, by - 2, 1, 6, '#6E4A2A');
      c.rect(side ? 11 : 14, by - 2, 2, 3, '#B8C0C8');
      break;
    case 'fan':
      if (!back) c.rect(side ? 10 : 2, by + 1, 2, 2, '#E8B04B');
      break;
    case 'shield': // painted Viking round shield on the off-hand
      if (back) break;
      c.ellipse(side ? 3 : 0, by - 1, 6, 6, '#B3262E');
      c.rect(side ? 5 : 2, by, 2, 4, '#E8B04B');
      c.set(side ? 5 : 2, by + 2, '#C9D2DC');
      break;
    case 'none':
      break;
  }
}

export const CHARACTERS: Record<string, CharacterSpec> = {
  samurai: { skin: '#F2C9A0', hair: '#1B1420', hairStyle: 'topknot', top: '#B3262E', trim: '#E8B04B', bottom: '#1F2E5A', gear: ['katana'] },
  ninja: { skin: '#F2C9A0', hair: '#1E1B2B', hairStyle: 'hood', top: '#2A2740', trim: '#55507A', bottom: '#1E1B2B', gear: ['scarf'], mask: '#1E1B2B' },
  master: { skin: '#E8C09A', hair: '#F4E9D0', hairStyle: 'bald', top: '#6F6A7E', trim: '#2E2A3E', bottom: '#3C3850', gear: ['beard', 'staff'] },
  villager: { skin: '#E8B98E', hair: '#C9A15A', hairStyle: 'kasa', top: '#4E7A5A', trim: '#2F4A38', bottom: '#5A4632', gear: [] },
  villagerB: { skin: '#F0C8A2', hair: '#3A2418', hairStyle: 'bun', top: '#7A4E8A', trim: '#E8B04B', bottom: '#4A3A5A', gear: ['fan'] },
  miko: { skin: '#F4CFAE', hair: '#15101C', hairStyle: 'long', top: '#F4F1EA', trim: '#C0392B', bottom: '#C0392B', gear: [] },
  ronin: { skin: '#D9A87E', hair: '#B08A4A', hairStyle: 'kasa', top: '#5A5A66', trim: '#2E2E38', bottom: '#3A3A44', gear: ['katana'] },
  kunoichi: { skin: '#F2C9A0', hair: '#4A1A3A', hairStyle: 'hood', top: '#5A1E46', trim: '#E8B04B', bottom: '#3A1230', gear: ['scarf'], mask: '#3A1230' },
  viking: { skin: '#F0C2A0', hair: '#9AA4AE', hairStyle: 'helmet', top: '#6B4A2E', trim: '#2E5A8A', bottom: '#4A3A2A', gear: ['beard', 'axe'] },
  oni: { skin: '#C8443A', hair: '#2A1A1A', hairStyle: 'oniHorns', top: '#E8B04B', trim: '#2A1A1A', bottom: '#3A2A20', gear: ['club'], eye: '#FFE14B' },
  // ── Arc 2: Frost Harbor ───────────────────────────────────────────
  runa: { skin: '#F4D2B4', hair: '#E8D08A', hairStyle: 'long', top: '#2E5A8A', trim: '#F4F1EA', bottom: '#3A4A5A', gear: [] },
  ferryman: { skin: '#D9A87E', hair: '#C9A15A', hairStyle: 'kasa', top: '#4A6A8A', trim: '#2A3A4A', bottom: '#3A3A44', gear: [] },
  shieldmaiden: { skin: '#F4D2B4', hair: '#E8C86A', hairStyle: 'long', top: '#3A5A8A', trim: '#C9D2DC', bottom: '#4A3A2A', gear: ['shield', 'axe'] },
  berserker: { skin: '#E8B48E', hair: '#B8542A', hairStyle: 'long', top: '#5A3A22', trim: '#2A1A14', bottom: '#3A2A20', gear: ['beard', 'axe'], eye: '#E8574B' },
  skald: { skin: '#F0C8A2', hair: '#C8B89A', hairStyle: 'long', top: '#5A2A6A', trim: '#E8B04B', bottom: '#3A2A4A', gear: ['beard', 'staff'] },
  draugr: { skin: '#7A9A8A', hair: '#5A6A64', hairStyle: 'helmet', top: '#3A4A44', trim: '#5A6A64', bottom: '#2A3430', gear: ['axe'], eye: '#7FFFD4' },
  champion: { skin: '#F0C2A0', hair: '#C9D2DC', hairStyle: 'helmet', top: '#8A1E2E', trim: '#E8B04B', bottom: '#2A2A3A', gear: ['beard', 'shield', 'axe'] },
  // ── Arc 3: Castle Capital ─────────────────────────────────────────
  gatecaptain: { skin: '#E8B98E', hair: '#2A2A3A', hairStyle: 'kabuto', top: '#3A3A5A', trim: '#E8B04B', bottom: '#1E1E2E', gear: ['katana'] },
  rogueninja: { skin: '#E8C09A', hair: '#3A1A1A', hairStyle: 'hood', top: '#4A1E1E', trim: '#8A2A2A', bottom: '#2A1414', gear: ['scarf'], mask: '#2A1414' },
  teamaster: { skin: '#F4D2B4', hair: '#2A1E2A', hairStyle: 'bun', top: '#5A7A5A', trim: '#F4E9D0', bottom: '#3A4A3A', gear: ['fan'] },
  assassin: { skin: '#F2C9A0', hair: '#14141E', hairStyle: 'long', top: '#1E1E2A', trim: '#8E6CEF', bottom: '#14141E', gear: ['katana'], mask: '#1E1E2A' },
  karo: { skin: '#E8B98E', hair: '#3A3A3A', hairStyle: 'topknot', top: '#6A2A5A', trim: '#E8B04B', bottom: '#2A1E3A', gear: ['fan'] },
  shogun: { skin: '#E0B490', hair: '#1A1A24', hairStyle: 'kabuto', top: '#8E1F2F', trim: '#E8B04B', bottom: '#1A1A24', gear: ['katana', 'fan'] },
  // ── Arc 4: Mountain Temples ───────────────────────────────────────
  yamabushi: { skin: '#D9A87E', hair: '#2A1E1A', hairStyle: 'bun', top: '#E8E0C8', trim: '#3A6A3A', bottom: '#4A6A4A', gear: ['staff'] },
  abbot: { skin: '#E8C09A', hair: '#E8C09A', hairStyle: 'bald', top: '#B8641E', trim: '#E8B04B', bottom: '#8A4A1A', gear: ['staff'] },
  karasu: { skin: '#3A3A4A', hair: '#14141E', hairStyle: 'hood', top: '#1E1E2A', trim: '#B3262E', bottom: '#14141E', gear: ['fan'], eye: '#FFE14B' },
  tenguking: { skin: '#C83A2A', hair: '#F4F1EA', hairStyle: 'long', top: '#3A2A6A', trim: '#E8B04B', bottom: '#1E1E3A', gear: ['beard', 'fan', 'staff'], eye: '#FFE14B' },
  merchant: { skin: '#EBC29C', hair: '#2A1E14', hairStyle: 'topknot', top: '#3A6A8A', trim: '#E8E0C8', bottom: '#2A3A4A', gear: [] },
  // ── Arc 5: Northern Runeforge ─────────────────────────────────────
  hakon: { skin: '#F0C2A0', hair: '#8A929E', hairStyle: 'helmet', top: '#2E4A6A', trim: '#B3262E', bottom: '#3A2A20', gear: ['beard', 'shield'] },
  hrimr: { skin: '#9CCDE2', hair: '#E8F8FF', hairStyle: 'long', top: '#4A6A8A', trim: '#DFF4FF', bottom: '#2A3A4A', gear: ['beard', 'club'], eye: '#2A4A6A' },
  brokk: { skin: '#E8B48E', hair: '#B8642A', hairStyle: 'bald', top: '#5A4A6A', trim: '#8A929E', bottom: '#3A2A20', gear: ['beard', 'club'] },
  valkyrie: { skin: '#F4D2B4', hair: '#E8C86A', hairStyle: 'helmet', top: '#E8E0F0', trim: '#E8B04B', bottom: '#5A7AAA', gear: ['shield', 'staff'] },
  jarl: { skin: '#F0C2A0', hair: '#1E1E2A', hairStyle: 'helmet', top: '#2A1A2E', trim: '#7FF4FF', bottom: '#14141E', gear: ['axe', 'shield'], eye: '#7FF4FF' },
};

/** 16×16 warhorse, side view (mirror for left). frame 1 = gallop pose. */
export function drawHorse(facing: Facing, frame: 0 | 1): PixelCanvas {
  if (facing === 'left') return drawHorse('right', frame).flipX();
  const c = new PixelCanvas(16, 16);
  const coat = '#7A4A2A';
  const mane = '#2A1A14';
  const side = facing === 'right';
  if (side) {
    c.rect(2, 7, 11, 5, coat); // body
    c.rect(11, 3, 3, 6, coat); // neck
    c.rect(12, 2, 4, 3, coat); // head
    c.set(14, 3, '#120C18');
    c.rect(10, 2, 2, 5, mane);
    c.rect(1, 7, 2, 4, mane); // tail
    c.rect(5, 7, 5, 2, '#C0392B'); // saddle cloth
    c.rect(6, 6, 3, 1, '#E8B04B');
    const legs = frame === 0 ? [3, 5, 9, 11] : [2, 6, 8, 12];
    legs.forEach((x, i) => c.rect(x, 12, 1, i % 2 === frame ? 3 : 4, shade(coat, -0.15)));
  } else {
    c.rect(5, 4, 6, 9, coat);
    c.rect(6, 1, 4, 5, coat);
    c.rect(7, 1, 2, 2, mane);
    c.rect(4, 7, 8, 3, '#C0392B');
    c.rect(5, 13, 2, frame ? 2 : 3, shade(coat, -0.15));
    c.rect(9, 13, 2, frame ? 3 : 2, shade(coat, -0.15));
    if (facing === 'down') { c.set(6, 3, '#120C18'); c.set(9, 3, '#120C18'); }
  }
  c.outline('#120C18');
  return c;
}
