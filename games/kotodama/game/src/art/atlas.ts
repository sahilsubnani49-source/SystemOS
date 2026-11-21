import type { SkImage } from '@shopify/react-native-skia';
import { tileAt, type ParsedMap } from '@kotodama/core';
import { CHARACTERS, drawCharacter, drawHorse, drawSignboard, folkSpec, type Facing } from './characters';
import { drawSpirit } from './spirits';
import { drawProp, drawSignpost } from './props';
import { drawEmote } from './emotes';
import type { NpcTask } from '@kotodama/core';
import { paintTile, TILE } from './tiles';
import { PixelCanvas, toImage } from './pixel';

// Every visual is requested by a stable KEY ('samurai', 'kobi1', map id). Today the
// keys resolve to procedural pixel art; a CC0 sprite atlas can later answer the same
// keys without any screen code changing.

const cache = new Map<string, SkImage>();

function memo(key: string, make: () => SkImage): SkImage {
  let img = cache.get(key);
  if (!img) {
    img = make();
    cache.set(key, img);
  }
  return img;
}

export function characterImage(key: string, facing: Facing, frame: 0 | 1): SkImage {
  return memo(`char:${key}:${facing}:${frame}`, () => {
    const spec = CHARACTERS[key] ?? (key.startsWith('folk:') ? folkSpec(key) : CHARACTERS.villager);
    return toImage(drawCharacter(spec as NonNullable<typeof spec>, facing, frame));
  });
}

export function horseImage(facing: Facing, frame: 0 | 1): SkImage {
  return memo(`horse:${facing}:${frame}`, () => toImage(drawHorse(facing, frame)));
}

/** Spirit sprite keys look like 'kobi1' (family id + stage digit). */
export function spiritImage(spriteKey: string): SkImage {
  return memo(`spirit:${spriteKey}`, () => {
    const m = /^(.*?)(\d)$/.exec(spriteKey);
    return toImage(drawSpirit(m?.[1] ?? spriteKey, Number(m?.[2] ?? 0)));
  });
}

/** Any combatant/NPC sprite key: characters first, then spirits. */
export function spriteImage(key: string, facing: Facing = 'down', frame: 0 | 1 = 0): SkImage {
  if (key === 'board') return memo('board', () => toImage(drawSignboard()));
  if (key === 'signpost') return memo('signpost', () => toImage(drawSignpost()));
  // Story objects and animals in the folk-tale scenes: one pose, whatever the facing.
  if (key.startsWith('prop:')) return memo(key, () => toImage(drawProp(key.slice(5))));
  return key in CHARACTERS || key.startsWith('folk:') ? characterImage(key, facing, frame) : spiritImage(key);
}

/** The whole map, pre-rendered, for animation frame 0 or 1. */
export function mapImage(map: ParsedMap, frame: 0 | 1): SkImage {
  return memo(`map:${map.def.id}:${frame}`, () => {
    const c = new PixelCanvas(map.width * TILE, map.height * TILE);
    for (let ty = 0; ty < map.height; ty++)
      for (let tx = 0; tx < map.width; tx++) {
        const kind = tileAt(map, tx, ty);
        paintTile(c, kind, tx * TILE, ty * TILE, tx, ty, frame, (dx, dy) => tileAt(map, tx + dx, ty + dy));
      }
    return toImage(c);
  });
}

/** The bubble over a busy townsperson. */
export function emoteImage(task: NpcTask): SkImage {
  return memo(`emote:${task}`, () => toImage(drawEmote(task)));
}
