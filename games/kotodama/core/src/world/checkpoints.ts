import { CURRICULUM } from '../content/curriculum';
import type { Facing } from './types';
import { getMap } from './maps';

// Where a defeated party wakes up: beside the healer of the arc it fell in, never
// back at the very first dojo. Progress (flags, levels, spirits) is never lost.

export interface Checkpoint {
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  /** Who finds you, and what they say. */
  speaker: string;
  text: string;
}

const BY_ARC: Record<1 | 2 | 3 | 4 | 5 | 6, Checkpoint> = {
  1: { mapId: 'hayate_dojo', x: 6, y: 4, facing: 'up', speaker: 'Master Kaito',
    text: 'You were carried back to the dojo. Rest. Every mistake you made is now a kana you will remember.' },
  2: { mapId: 'frost_harbor', x: 11, y: 7, facing: 'up', speaker: 'Runa',
    text: 'I dragged you back to the harbor fire. The runes will still be there tomorrow; so will the words you missed.' },
  3: { mapId: 'teahouse', x: 6, y: 6, facing: 'up', speaker: 'Tea Master',
    text: 'Drink. A brush stroke done in haste must be done again. The kanji you missed are waiting for a calmer hand.' },
  4: { mapId: 'monastery', x: 6, y: 4, facing: 'up', speaker: 'Abbot',
    text: 'The monks found you on the mountain path. Sit with us a while. A fall is also a lesson.' },
  5: { mapId: 'rune_coast', x: 8, y: 7, facing: 'left', speaker: 'Shieldmaiden',
    text: 'You fought well and fell well. Up. The Rune Coast does not wait for the timid.' },
  6: { mapId: 'honsai_gate', x: 5, y: 9, facing: 'up', speaker: 'Koe',
    text: 'I carried you back to the gate. Say a word for me, any word. Good: Wapul has not taken your voice.' },
};

/** Honsai's later districts each have a healer of their own: no long walk back to Koe. */
const HONSAI_HEALERS: Record<string, Checkpoint> = {
  honsai4: { mapId: 'honsai_bridges', x: 6, y: 2, facing: 'up', speaker: 'Hashi',
    text: 'Fished you out of the river. Again. The bridges will wait; so will the て-forms you missed.' },
  honsai5: { mapId: 'honsai_hill', x: 6, y: 8, facing: 'up', speaker: 'Nurse Iyashi',
    text: 'You fainted in the corridor. A failed test is only a lesson that has not finished yet.' },
  honsai6: { mapId: 'honsai_harbour', x: 8, y: 10, facing: 'left', speaker: 'Nami',
    text: 'The sailors carried you in. Soup first, then back to the docks.' },
  honsai7: { mapId: 'honsai_kokoro', x: 5, y: 10, facing: 'up', speaker: 'Iyasu',
    text: 'You fell among the flowers. A bruise, a scratch, a hurt feeling: all three heal.' },
  honsai8: { mapId: 'honsai_valley', x: 7, y: 13, facing: 'left', speaker: 'Hinata',
    text: 'The shepherds found you in the long grass. Tea first, then the valley again.' },
  honsai9: { mapId: 'honsai_matsuri', x: 5, y: 10, facing: 'left', speaker: 'Ame',
    text: 'You fainted by the goldfish stall. Have a candied apple. The festival will wait for you.' },
  honsai10: { mapId: 'honsai_court', x: 5, y: 11, facing: 'left', speaker: 'Gen',
    text: 'You collapsed mid-bow. It happens to the best courtiers. Rest a moment.' },
  honsai_library: { mapId: 'honsai_court', x: 5, y: 11, facing: 'left', speaker: 'Gen',
    text: 'The librarian sent for me: you fell asleep on a dictionary. Back to the shelves when you are ready.' },
  honsai11: { mapId: 'honsai_kawaraban', x: 5, y: 12, facing: 'left', speaker: 'Yuzu',
    text: 'Someone carried you in from the street. A hot bath, then back to the noise.' },
  honsai12: { mapId: 'honsai_tower', x: 5, y: 11, facing: 'left', speaker: 'Koe',
    text: 'I caught you before the silence did. Say something. Anything. Good.' },
};

/** The Well of Old Tales sits under Sakura Village: you wake at its mouth, not at the dojo. */
const WELL: Checkpoint = { mapId: 'sakura_village', x: 14, y: 15, facing: 'down', speaker: 'Grandmother Fumi',
  text: 'I pulled you out of the well myself. Rest, then go back down; the tales will keep.' };

export function checkpointFor(mapId: string): Checkpoint {
  const area = getMap(mapId).def.area;
  if (area.startsWith('well')) return WELL;
  const local = HONSAI_HEALERS[area];
  if (local) return local;
  const arc = CURRICULUM[area]?.arc ?? 1;
  return BY_ARC[arc];
}

export const ALL_CHECKPOINTS: readonly Checkpoint[] = [...Object.values(BY_ARC), WELL, ...Object.values(HONSAI_HEALERS)];
