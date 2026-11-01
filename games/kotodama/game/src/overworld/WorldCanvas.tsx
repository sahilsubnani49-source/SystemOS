import React, { useEffect, useMemo, useState } from 'react';
import { Canvas, Circle, Group, Image, RadialGradient, Rect, RoundedRect, useClock, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withTiming, Easing, type SharedValue } from 'react-native-reanimated';
import { getMap, visibleNpcs, type NpcDef, type Save } from '@kotodama/core';
import { characterImage, horseImage, mapImage, spriteImage } from '../art/atlas';
import { PIXEL_SAMPLING, SpriteImage } from '../ui/Sprite';
import { Weather } from '../fx/Weather';

export const TILES_ACROSS = 9;

interface Props {
  save: Save;
  stepId: number;
  stepMs: number;
  width: number;
  height: number;
}

/** Camera offset that centres the player but never shows past the map's edge. */
function cameraAxis(pos: number, tile: number, view: number, mapTiles: number): number {
  'worklet';
  const mapPx = mapTiles * tile;
  if (mapPx <= view) return (view - mapPx) / 2;
  const want = view / 2 - (pos + 0.5) * tile;
  return Math.min(0, Math.max(view - mapPx, want));
}

export function WorldCanvas({ save, stepId, stepMs, width, height }: Props) {
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

  const npcs = visibleNpcs(map, save.flags).slice().sort((a, b) => a.y - b.y);
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
        {npcs.map((n) => (
          <NpcSprite key={n.id} npc={n} tile={tile} pending={!!n.battle && !save.flags[n.battle.winFlag]} />
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

function NpcSprite({ npc, tile, pending }: { npc: NpcDef; tile: number; pending: boolean }) {
  return (
    <>
      <RoundedRect x={npc.x * tile + tile * 0.2} y={npc.y * tile + tile * 0.78} width={tile * 0.6} height={tile * 0.18} r={tile * 0.09} color="rgba(0,0,0,0.28)" />
      <SpriteImage image={spriteImage(npc.sprite, npc.facing, 0)} x={npc.x * tile} y={npc.y * tile - tile * 0.25} size={tile} />
      {pending ? <Alert x={npc.x * tile + tile / 2} y={npc.y * tile - tile * 0.5} tile={tile} /> : null}
    </>
  );
}

/** Bobbing "!" over NPCs who will fight you. */
function Alert({ x, y, tile }: { x: number; y: number; tile: number }) {
  const clock = useClock();
  const bob: SharedValue<{ translateY: number }[]> = useDerivedValue(() => [{ translateY: Math.sin(clock.value / 180) * 2 }]);
  const s = tile * 0.12;
  return (
    <Group transform={bob}>
      <Circle cx={x} cy={y} r={tile * 0.22} color="#E8B04B" />
      <Rect x={x - s / 2} y={y - s * 1.3} width={s} height={s * 1.6} color="#120C18" />
      <Rect x={x - s / 2} y={y + s * 0.6} width={s} height={s * 0.6} color="#120C18" />
    </Group>
  );
}
