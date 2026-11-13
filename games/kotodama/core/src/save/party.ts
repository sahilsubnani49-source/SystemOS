import { PARTY_SIZE, type OwnedSpirit, type Save } from './schema';

// Managing the spirits a player owns: who fights (the team, `save.party`), who
// waits (the reserve, `save.box`), and who is let go.
//
// Every function returns a new save, or THE SAME save object when the move is
// not allowed, so a caller can tell a refusal by identity (`next === save`).
//
// One rule holds throughout: a player who owns any spirit always has one on the
// team. Wild encounters only happen with a spirit at your side, so an empty team
// would quietly switch off half the game.

type Slot = { list: 'party' | 'box'; index: number };

function find(save: Save, uid: string): Slot | null {
  const p = save.party.findIndex((s) => s.uid === uid);
  if (p >= 0) return { list: 'party', index: p };
  const b = save.box.findIndex((s) => s.uid === uid);
  return b >= 0 ? { list: 'box', index: b } : null;
}

/**
 * Swap any two spirits' places: team with reserve (switch who fights), or two
 * team members (change who acts first).
 */
export function swapSpirits(save: Save, uidA: string, uidB: string): Save {
  const a = find(save, uidA);
  const b = find(save, uidB);
  if (!a || !b || uidA === uidB) return save;
  const lists = { party: [...save.party], box: [...save.box] };
  const spiritA = lists[a.list][a.index] as OwnedSpirit;
  lists[a.list][a.index] = lists[b.list][b.index] as OwnedSpirit;
  lists[b.list][b.index] = spiritA;
  return { ...save, party: lists.party, box: lists.box };
}

/** Reserve to team, when the team has a free place. */
export function spiritToTeam(save: Save, uid: string): Save {
  const slot = find(save, uid);
  if (slot?.list !== 'box' || save.party.length >= PARTY_SIZE) return save;
  const spirit = save.box[slot.index] as OwnedSpirit;
  return { ...save, party: [...save.party, spirit], box: save.box.filter((s) => s.uid !== uid) };
}

/** Team to reserve. Refused for the last spirit on the team. */
export function spiritToReserve(save: Save, uid: string): Save {
  const slot = find(save, uid);
  if (slot?.list !== 'party' || save.party.length <= 1) return save;
  const spirit = save.party[slot.index] as OwnedSpirit;
  return { ...save, party: save.party.filter((s) => s.uid !== uid), box: [...save.box, spirit] };
}

/** The last spirit a player owns cannot be released. */
export function canReleaseSpirit(save: Save): boolean {
  return save.party.length + save.box.length > 1;
}

/**
 * Let a spirit go, for good. If that empties the team, the first reserve steps
 * up. The Kotodex keeps its record: the spirit was caught, even if it has left.
 */
export function releaseSpirit(save: Save, uid: string): Save {
  if (!find(save, uid) || !canReleaseSpirit(save)) return save;
  let party = save.party.filter((s) => s.uid !== uid);
  let box = save.box.filter((s) => s.uid !== uid);
  if (party.length === 0 && box.length > 0) {
    party = [box[0] as OwnedSpirit];
    box = box.slice(1);
  }
  return { ...save, party, box };
}
