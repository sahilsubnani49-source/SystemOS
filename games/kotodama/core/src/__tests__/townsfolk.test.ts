import { describe, expect, it } from 'vitest';
import { ALL_MAPS, getMap, TOWNSFOLK_MAPS, townsfolkFor } from '../index';

describe('townsfolk', () => {
  const all = TOWNSFOLK_MAPS.flatMap((id) => townsfolkFor(id).map((n) => ({ map: id, n })));

  it('lives only on real maps, on open ground', () => {
    for (const { map, n } of all) {
      expect(ALL_MAPS.some((d) => d.id === map), map).toBe(true);
      const m = getMap(map);
      expect(m.def.npcs.filter((o) => o.x === n.x && o.y === n.y), `${map}/${n.id} shares a tile`).toHaveLength(1);
      expect(m.def.warps.some((w) => w.x === n.x && w.y === n.y), `${map}/${n.id} stands on a warp`).toBe(false);
    }
  });

  it('never repeats a person, a look, or a lesson', () => {
    const names = all.map(({ n }) => n.name);
    const sprites = all.map(({ n }) => n.sprite);
    const lines = all.flatMap(({ n }) => n.dialogue.map((l) => l.text));
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(sprites).size).toBe(sprites.length);
    expect(new Set(lines).size).toBe(lines.length);
  });

  it('every story region has someone to talk to', () => {
    expect(all.length).toBeGreaterThanOrEqual(60);
    for (const { n } of all) expect(n.dialogue.length).toBeGreaterThanOrEqual(2);
  });
});
