import { CURRICULUM } from '../content/curriculum';
import { ALL_MAPS } from '../world/maps';
import type { Facing } from '../world/types';
import type { OwnedSpirit, Save } from './schema';

// TESTER TOOL: jump a save straight to the start of a later arc, as if every
// earlier arc had been played. Marks the earlier arcs' story as done, raises the
// hero and team to the level that arc expects, and places the hero in its first
// town. Side areas (the Well of Old Tales, the Terakoya) are left unplayed.
// Nothing learned is touched: the SRS table stays as it is.

export interface ArcStart {
  arc: 2 | 3 | 4 | 5 | 6;
  label: string;
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  /** Hero level on arrival; team spirits arrive one level lower. */
  level: number;
}

export const ARC_STARTS: readonly ArcStart[] = [
  { arc: 2, label: 'Arc 2: Frost Harbor', mapId: 'frost_harbor', x: 10, y: 7, facing: 'down', level: 18 },
  { arc: 3, label: 'Arc 3: Castle Capital', mapId: 'castle_town', x: 10, y: 7, facing: 'down', level: 32 },
  { arc: 4, label: 'Arc 4: Tengu Mountains', mapId: 'mountain_foothills', x: 10, y: 7, facing: 'down', level: 46 },
  { arc: 5, label: 'Arc 5: Rune Coast', mapId: 'rune_coast', x: 8, y: 7, facing: 'down', level: 59 },
  { arc: 6, label: 'Arc 6: Honsai', mapId: 'honsai_gate', x: 10, y: 11, facing: 'up', level: 66 },
];

const isSideArea = (area: string) => area.startsWith('well') || area.startsWith('lesson') || area.startsWith('jlpt');

/** Every story flag the main maps of arcs before `arc` set when played through. */
export function storyFlagsBefore(arc: number): string[] {
  const flags = new Set<string>();
  for (const m of ALL_MAPS) {
    if (isSideArea(m.area) || (CURRICULUM[m.area]?.arc ?? 1) >= arc) continue;
    for (const n of m.npcs) {
      if (n.battle?.winFlag && !n.battle.repeatable) flags.add(n.battle.winFlag);
      if (n.setsFlag) flags.add(n.setsFlag);
    }
  }
  return [...flags];
}

export function skipToArc(save: Save, start: ArcStart, uid: () => string): Save {
  const flags = { ...save.flags };
  for (const f of storyFlagsBefore(start.arc)) flags[f] = true;
  const spiritLevel = start.level - 1;
  const raise = (s: OwnedSpirit): OwnedSpirit => (s.level >= spiritLevel ? s : { ...s, level: spiritLevel, xp: 0 });
  // A team of two, whatever the save had: keep what is there, fill the empty places.
  const party = save.party.map(raise);
  for (const familyId of ['akari', 'kobi']) {
    if (party.length < 2 && !party.some((p) => p.familyId === familyId)) party.push({ uid: uid(), familyId, level: spiritLevel, xp: 0 });
  }
  const caught = [...new Set([...save.dex.caught, ...party.map((p) => p.familyId)])];
  return {
    ...save,
    flags,
    heroLevel: Math.max(save.heroLevel, start.level),
    heroXp: save.heroLevel >= start.level ? save.heroXp : 0,
    party,
    box: save.box.map(raise),
    dex: { seen: [...new Set([...save.dex.seen, ...caught])], caught },
    // Hayate (the horse) comes with the first arc's story.
    horse: flags.got_horse ? { ...save.horse, owned: true } : save.horse,
    mapId: start.mapId,
    x: start.x,
    y: start.y,
    facing: start.facing,
  };
}
