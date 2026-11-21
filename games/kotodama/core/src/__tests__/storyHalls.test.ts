import { describe, expect, it } from 'vitest';
import {
  FOLK_SITES, HALLS, foundFlag, getMap, hallMapId, hallReport, hallRewardFlag, hallRewardGold, hallTales, storytellerLines, taleReadFlag, visibleNpcs,
} from '../index';

const name = (id: string) => getMap(id).def.name;

describe("Storyteller's Halls", () => {
  it('every folk tale has a lantern in exactly one hall', () => {
    const all = HALLS.flatMap((h) => hallTales(h.arc).map((s) => s.tale.id));
    expect(all.sort()).toEqual(FOLK_SITES.map((s) => s.tale.id).sort());
  });

  it.each(HALLS.map((h) => [h.arc]))('arc %i: the gate only shows after the arc boss', (arc) => {
    const hall = HALLS.find((h) => h.arc === arc)!;
    const hub = getMap(hall.hub);
    const gate = (flags: Record<string, boolean>) => visibleNpcs(hub, flags).find((n) => n.travelsTo?.map === hallMapId(arc));
    expect(gate({})).toBeUndefined();
    expect(gate({ [hall.opensOn]: true })).toBeDefined();
  });

  it('lanterns light up as tales are found, and lit ones lead to the tale', () => {
    const [first] = hallTales(1);
    const hall = getMap(hallMapId(1));
    const at = (flags: Record<string, boolean>) => visibleNpcs(hall, flags).filter((n) => n.id.endsWith(`_${first!.tale.id}`));
    expect(at({}).map((n) => n.sprite)).toEqual(['prop:darklantern']);
    const lit = at({ [foundFlag(first!.tale.id)]: true });
    expect(lit.map((n) => n.sprite)).toEqual(['prop:storylantern']);
    expect(lit[0]?.travelsTo?.map).toBe(`tale_${first!.tale.id}`);
  });

  it('the keeper counts, hints at a missing tale, and pays once for a finished set', () => {
    expect(hallReport(2, {}).found).toBe(0);
    const first = storytellerLines(2, {}, name);
    expect(first.reward).toBe(0);
    expect(first.lines.at(-1)?.text).toContain(name(hallTales(2)[0]!.host));
    const allRead = Object.fromEntries(hallTales(2).map((s) => [taleReadFlag(s.tale.id), true]));
    expect(hallReport(2, allRead)).toMatchObject({ found: hallTales(2).length, read: hallTales(2).length });
    expect(storytellerLines(2, allRead, name).reward).toBe(hallRewardGold(2));
    expect(storytellerLines(2, { ...allRead, [hallRewardFlag(2)]: true }, name).reward).toBe(0);
  });
});
