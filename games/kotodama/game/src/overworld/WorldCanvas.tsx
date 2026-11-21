import React, { useEffect, useMemo, useState } from 'react';
import { Canvas, Circle, Group, Image, RadialGradient, Rect, RoundedRect, useClock, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withTiming, Easing, type SharedValue } from 'react-native-reanimated';
import { getMap, visibleNpcs, type NpcActor, type NpcDef, type NpcWorld, type Save } from '@kotodama/core';
import { characterImage, emoteImage, horseImage, mapImage, spriteImage } from '../art/atlas';
import { PIXEL_SAMPLING, SpriteImage } from '../ui/Sprite';
import { Weather } from '../fx/Weather';

export const TILES_ACROSS = 9;

interface Props {
  save: Save;
  stepId: number;
  stepMs: number;
  width: number;
  height: number;
  /** Live townspeople (the movement engine); null until the first tick. */
  people: NpcWorld | null;
}

/** How long an NPC takes to glide one tile: a stroll, slower than the player. */
const NPC_STEP_MS = 380;

/** Camera offset that centres the player but never shows past the map's edge. */
function cameraAxis(pos: number, tile: number, view: number, mapTiles: number): number {
  'worklet';
  const mapPx = mapTiles * tile;
  if (mapPx <= view) return (view - mapPx) / 2;
  const want = view / 2 - (pos + 0.5) * tile;
  return Math.min(0, Math.max(view - mapPx, want));
}

export function WorldCanvas({ save, stepId, stepMs, width, height, people }: Props) {
  const map = getMap(save.mapId);
  const tile = Math.floor(width / TILES_ACROSS);
  const heroKey = save.hero;

  // Logical position jumps a whole tile; the drawn position glides there.
  const px = useSharedValue(save.x);
  const py = useSharedValue(save.y);
  const [lastMap, setLastMap] = useState(save.mapId);
  const [walkFrame, setWalkFrame] = useState<0 | 1>(0);

  useEffect(() => {
    const teleport = lastMap !== save.mapId || Math.abs(px.value - save.x) + Math.abs(py.value - save.y) > 1.01;
    if (teleport) {
      px.value = save.x;
      py.value = save.y;
      setLastMap(save.mapId);
      return;
    }
    const cfg = { duration: stepMs, easing: Easing.linear };
    px.value = withTiming(save.x, cfg);
    py.value = withTiming(save.y, cfg);
    setWalkFrame(1);
    const t = setTimeout(() => setWalkFrame(0), stepMs * 0.6);
    return () => clearTimeout(t);
    // stepId is the trigger: the same x/y can repeat after walking back and forth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId, save.mapId, save.x, save.y]);

  // Water shimmer / grass sway: swap between two pre-rendered map frames.
  const [tileFrame, setTileFrame] = useState<0 | 1>(0);
  useEffect(() => {
    const t = setInterval(() => setTileFrame((f) => (f ? 0 : 1)), 650);
    return () => clearInterval(t);
  }, []);
  const images = useMemo(() => [mapImage(map, 0), mapImage(map, 1)] as const, [map]);

  const camera = useDerivedValue(() => [
    { translateX: cameraAxis(px.value, tile, width, map.width) },
    { translateY: cameraAxis(py.value, tile, height, map.height) },
  ]);
  const playerX = useDerivedValue(() => px.value * tile);
  const playerY = useDerivedValue(() => py.value * tile - tile * 0.25);
  const riderY = useDerivedValue(() => playerY.value - tile * 0.45);
  const screenX = useDerivedValue(() => cameraAxis(px.value, tile, width, map.width) + (px.value + 0.5) * tile);
  const screenY = useDerivedValue(() => cameraAxis(py.value, tile, height, map.height) + (py.value + 0.5) * tile);
  const torch = useDerivedValue(() => vec(screenX.value, screenY.value));
  const shadow = useDerivedValue(() => [{ translateX: playerX.value }, { translateY: py.value * tile }]);

  const live = people && people.mapId === save.mapId ? people.actors : undefined;
  // Back to front by where each person stands NOW, so walkers pass behind and in front.
  const npcs = visibleNpcs(map, save.flags)
    .map((n) => ({ npc: n, actor: live?.[n.id] }))
    .sort((a, b) => (a.actor?.y ?? a.npc.y) - (b.actor?.y ?? b.npc.y));
  const riding = save.horse.riding;
  const darkness = map.def.darkness ?? 0;

  return (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color="#0B0B12" />
      <Group transform={camera}>
        <Image
          image={images[tileFrame]}
          x={0}
          y={0}
          width={map.width * tile}
          height={map.height * tile}
          sampling={PIXEL_SAMPLING}
        />
        {npcs.map(({ npc, actor }) => (
          <NpcSprite key={`${save.mapId}:${npc.id}`} npc={npc} actor={actor} tile={tile} pending={!!npc.battle && !save.flags[npc.battle.winFlag]} />
        ))}
        {/* shadow under the player */}
        <Group transform={shadow}>
          <RoundedRect x={tile * 0.2} y={tile * 0.78} width={tile * 0.6} height={tile * 0.18} r={tile * 0.09} color="rgba(0,0,0,0.28)" />
        </Group>
        {riding ? (
          <>
            <SpriteImage image={horseImage(save.facing, walkFrame)} x={playerX} y={playerY} size={tile} />
            <SpriteImage image={characterImage(heroKey, save.facing, 0)} x={playerX} y={riderY} size={tile} />
          </>
        ) : (
          <SpriteImage image={characterImage(heroKey, save.facing, walkFrame)} x={playerX} y={playerY} size={tile} />
        )}
      </Group>

      {darkness > 0 ? (
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={torch}
            r={tile * 4.2}
            colors={['rgba(8,6,20,0)', `rgba(8,6,20,${darkness * 0.6})`, `rgba(8,6,20,${Math.min(0.92, darkness + 0.45)})`]}
            positions={[0, 0.55, 1]}
          />
        </Rect>
      ) : null}
      <Weather kind={map.def.weather} w={width} h={height} />
    </Canvas>
  );
}

function NpcSprite({ npc, actor, tile, pending }: { npc: NpcDef; actor?: NpcActor; tile: number; pending: boolean }) {
  const x = actor?.x ?? npc.x;
  const y = actor?.y ?? npc.y;
  const facing = actor?.facing ?? npc.facing;
  const sx = useSharedValue(x);
  const sy = useSharedValue(y);
  const [frame, setFrame] = useState<0 | 1>(0);

  // Glide one tile per step, legs moving; anything further is a jump (a new map).
  useEffect(() => {
    if (Math.abs(sx.value - x) + Math.abs(sy.value - y) > 1.01) {
      sx.value = x;
      sy.value = y;
      return;
    }
    const cfg = { duration: NPC_STEP_MS, easing: Easing.linear };
    sx.value = withTiming(x, cfg);
    sy.value = withTiming(y, cfg);
    setFrame(1);
    const t = setTimeout(() => setFrame(0), NPC_STEP_MS * 0.6);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [x, y]);

  // At work the body keeps moving: a sweep, a cast of the line, a bow.
  const busy = actor?.state === 'task' && !!actor.task;
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setFrame((f) => (f ? 0 : 1)), 480);
    return () => {
      clearInterval(t);
      setFrame(0);
    };
  }, [busy]);

  const drawX = useDerivedValue(() => sx.value * tile);
  const drawY = useDerivedValue(() => sy.value * tile - tile * 0.25);
  const shadow = useDerivedValue(() => [{ translateX: sx.value * tile }, { translateY: sy.value * tile }]);
  const bubbleX = useDerivedValue(() => sx.value * tile + tile * 0.3);
  const bubbleY = useDerivedValue(() => sy.value * tile - tile * 0.95);
  const alertX = useDerivedValue(() => sx.value * tile + tile / 2);
  const alertY = useDerivedValue(() => sy.value * tile - tile * 0.5);

  return (
    <>
      <Group transform={shadow}>
        <RoundedRect x={tile * 0.2} y={tile * 0.78} width={tile * 0.6} height={tile * 0.18} r={tile * 0.09} color="rgba(0,0,0,0.28)" />
      </Group>
      <SpriteImage image={spriteImage(npc.sprite, facing, frame)} x={drawX} y={drawY} size={tile} />
      {busy && actor?.task ? <SpriteImage image={emoteImage(actor.task)} x={bubbleX} y={bubbleY} size={tile * 0.5} /> : null}
      {pending ? <Alert x={alertX} y={alertY} tile={tile} /> : null}
    </>
  );
}

/** Bobbing "!" over NPCs who will fight you. */
function Alert({ x, y, tile }: { x: SharedValue<number>; y: SharedValue<number>; tile: number }) {
  const clock = useClock();
  const bob = useDerivedValue(() => [
    { translateX: x.value },
    { translateY: y.value + Math.sin(clock.value / 180) * 2 },
  ]);
  const s = tile * 0.12;
  return (
    <Group transform={bob}>
      <Circle cx={0} cy={0} r={tile * 0.22} color="#E8B04B" />
      <Rect x={-s / 2} y={-s * 1.3} width={s} height={s * 1.6} color="#120C18" />
      <Rect x={-s / 2} y={s * 0.6} width={s} height={s * 0.6} color="#120C18" />
    </Group>
  );
}
