import { describe, expect, it } from 'vitest';
import { PARTY_SIZE, canReleaseSpirit, newGame, releaseSpirit, spiritToReserve, spiritToTeam, swapSpirits, type OwnedSpirit, type Save } from '../index';

const sp = (uid: string): OwnedSpirit => ({ uid, familyId: 'akari', level: 5, xp: 0 });
const uids = (list: OwnedSpirit[]) => list.map((s) => s.uid);

function saveWith(party: string[], box: string[]): Save {
  return { ...newGame('samurai', 'Test', '2026-01-01', 1), party: party.map(sp), box: box.map(sp) };
}

describe('managing spirits', () => {
  it('swaps a team spirit with a reserve, keeping both positions', () => {
    const next = swapSpirits(saveWith(['a', 'b'], ['c', 'd']), 'b', 'd');
    expect(uids(next.party)).toEqual(['a', 'd']);
    expect(uids(next.box)).toEqual(['c', 'b']);
  });

  it('swaps two team spirits to change who acts first', () => {
    expect(uids(swapSpirits(saveWith(['a', 'b'], []), 'a', 'b').party)).toEqual(['b', 'a']);
  });

  it('refuses a swap with an unknown spirit or with itself', () => {
    const save = saveWith(['a', 'b'], ['c']);
    expect(swapSpirits(save, 'a', 'zzz')).toBe(save);
    expect(swapSpirits(save, 'a', 'a')).toBe(save);
  });

  it('moves a reserve onto the team only while there is room', () => {
    const roomy = saveWith(['a'], ['c']);
    expect(uids(spiritToTeam(roomy, 'c').party)).toEqual(['a', 'c']);
    expect(spiritToTeam(roomy, 'c').box).toEqual([]);
    const full = saveWith(['a', 'b'], ['c']);
    expect(full.party.length).toBe(PARTY_SIZE);
    expect(spiritToTeam(full, 'c')).toBe(full);
  });

  it('rests a team spirit, but never the last one', () => {
    const next = spiritToReserve(saveWith(['a', 'b'], ['c']), 'a');
    expect(uids(next.party)).toEqual(['b']);
    expect(uids(next.box)).toEqual(['c', 'a']);
    const lone = saveWith(['a'], ['c']);
    expect(spiritToReserve(lone, 'a')).toBe(lone);
  });

  it('releases a spirit from the team or the reserve', () => {
    expect(uids(releaseSpirit(saveWith(['a', 'b'], ['c']), 'a').party)).toEqual(['b']);
    expect(releaseSpirit(saveWith(['a', 'b'], ['c']), 'c').box).toEqual([]);
  });

  it('promotes a reserve when the whole team is released', () => {
    const next = releaseSpirit(saveWith(['a'], ['c', 'd']), 'a');
    expect(uids(next.party)).toEqual(['c']);
    expect(uids(next.box)).toEqual(['d']);
  });

  it('never releases the last spirit', () => {
    const lone = saveWith(['a'], []);
    expect(canReleaseSpirit(lone)).toBe(false);
    expect(releaseSpirit(lone, 'a')).toBe(lone);
  });

  it('keeps the Kotodex record of a released spirit', () => {
    const save = { ...saveWith(['a', 'b'], []), dex: { seen: ['akari'], caught: ['akari'] } };
    expect(releaseSpirit(save, 'a').dex.caught).toEqual(['akari']);
  });

  it('never loses or duplicates a spirit, whatever the order of moves', () => {
    let save = saveWith(['a', 'b'], ['c', 'd', 'e']);
    save = swapSpirits(save, 'a', 'e');
    save = spiritToReserve(save, 'b');
    save = spiritToTeam(save, 'c');
    save = swapSpirits(save, 'e', 'c');
    expect([...uids(save.party), ...uids(save.box)].sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
