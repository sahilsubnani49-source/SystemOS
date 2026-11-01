import React, { useEffect } from 'react';
import { BlurMask, Circle, Group, Path, Rect, Skia, type SkPath } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import type { FxKind } from '@kotodama/core';

export interface FxShot {
  id: number;
  kind: FxKind;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export const FX_MS = 460;

const ELEMENT_COLORS: Partial<Record<FxKind, string[]>> = {
  fire: ['#FF6A2A', '#FFB347', '#FFE14B'],
  water: ['#3A86C8', '#7FC4F2', '#E8F8FF'],
  wind: ['#8ACA5A', '#D8F0B0', '#FFFFFF'],
  rock: ['#8A6A4A', '#B89A6A', '#5A4632'],
  shadow: ['#8E6CEF', '#3A2A5A', '#C86AFF'],
  light: ['#FFF4D8', '#FFE14B', '#F4A7C0'],
  smoke: ['#9A9AA4', '#C8C8D0', '#6A6A74'],
};

/** One shot of a battle effect; re-keyed per event so each plays from 0. */
export function BattleFx({ shot }: { shot: FxShot }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withTiming(1, { duration: FX_MS, easing: Easing.out(Easing.quad) });
  }, [shot.id, t]);

  switch (shot.kind) {
    case 'slash':
      return <Slash t={t} at={shot.to} heavy={false} />;
    case 'heavySlash':
      return <Slash t={t} at={shot.to} heavy />;
    case 'shuriken':
      return <Shuriken t={t} from={shot.from} to={shot.to} />;
    case 'kunai':
      return <Kunai t={t} from={shot.from} to={shot.to} />;
    case 'lightning':
      return <Lightning t={t} at={shot.to} />;
    case 'guard':
      return <Ring t={t} at={shot.to} color="#7FC4F2" />;
    default:
      return <Burst t={t} at={shot.to} colors={ELEMENT_COLORS[shot.kind] ?? ['#FFFFFF']} rise={shot.kind === 'fire' || shot.kind === 'smoke'} />;
  }
}

function arcPath(cx: number, cy: number, r: number, flip: boolean): SkPath {
  const b = Skia.PathBuilder.Make();
  const s = flip ? -1 : 1;
  b.moveTo(cx - r * s, cy - r);
  b.quadTo(cx + r * 0.2 * s, cy - r * 0.1, cx + r * s, cy + r);
  return b.build();
}

function Slash({ t, at, heavy }: { t: SharedValue<number>; at: { x: number; y: number }; heavy: boolean }) {
  const end = useDerivedValue(() => Math.min(1, t.value * 1.6));
  const start = useDerivedValue(() => Math.max(0, t.value * 1.6 - 0.6));
  const op = useDerivedValue(() => 1 - Math.max(0, t.value - 0.6) / 0.4);
  const r = heavy ? 70 : 56;
  return (
    <Group opacity={op}>
      <Path path={arcPath(at.x, at.y, r, false)} start={start} end={end} style="stroke" strokeWidth={heavy ? 14 : 9} strokeCap="round" color="#7FC4F2">
        <BlurMask blur={8} style="solid" />
      </Path>
      <Path path={arcPath(at.x, at.y, r, false)} start={start} end={end} style="stroke" strokeWidth={heavy ? 5 : 3} strokeCap="round" color="#FFFFFF" />
      {heavy ? (
        <Path path={arcPath(at.x, at.y + 6, r * 0.9, true)} start={start} end={end} style="stroke" strokeWidth={4} strokeCap="round" color="#FFFFFF" />
      ) : null}
    </Group>
  );
}

function star(cx: number, cy: number, r: number): SkPath {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    const rr = i % 2 === 0 ? r : r * 0.35;
    if (i === 0) b.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else b.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  return b.close().build();
}
const STAR = star(0, 0, 11);

function ShurikenStar({ t, from, to, delay }: { t: SharedValue<number>; from: { x: number; y: number }; to: { x: number; y: number }; delay: number }) {
  const transform = useDerivedValue(() => {
    const p = Math.max(0, Math.min(1, (t.value - delay) / (1 - delay)));
    const x = from.x + (to.x - from.x) * p;
    const y = from.y + (to.y - from.y) * p - Math.sin(p * Math.PI) * 30;
    return [{ translateX: x }, { translateY: y }, { rotate: p * 18 }];
  });
  const op = useDerivedValue(() => (t.value < delay ? 0 : t.value > 0.95 ? 0 : 1));
  return (
    <Group transform={transform} opacity={op}>
      <Path path={STAR} color="#C9D2DC" />
      <Circle cx={0} cy={0} r={3} color="#2A2740" />
    </Group>
  );
}

function Shuriken({ t, from, to }: { t: SharedValue<number>; from: { x: number; y: number }; to: { x: number; y: number } }) {
  return (
    <>
      {[0, 0.12, 0.24].map((d, i) => (
        <ShurikenStar key={i} t={t} from={{ x: from.x, y: from.y + (i - 1) * 14 }} to={{ x: to.x, y: to.y + (i - 1) * 12 }} delay={d} />
      ))}
    </>
  );
}

function Kunai({ t, from, to }: { t: SharedValue<number>; from: { x: number; y: number }; to: { x: number; y: number } }) {
  const x = useDerivedValue(() => from.x + (to.x - from.x) * t.value);
  const y = useDerivedValue(() => from.y + (to.y - from.y) * t.value);
  const transform = useDerivedValue(() => [{ translateX: x.value }, { translateY: y.value }, { rotate: Math.atan2(to.y - from.y, to.x - from.x) }]);
  return (
    <Group transform={transform}>
      <Rect x={-26} y={-1.5} width={26} height={3} color="rgba(255,255,255,0.45)" />
      <Rect x={0} y={-3} width={14} height={6} color="#C9D2DC" />
      <Rect x={-8} y={-2} width={8} height={4} color="#5A3A22" />
    </Group>
  );
}

function boltPath(x: number, y: number): SkPath {
  const b = Skia.PathBuilder.Make().moveTo(x - 6, 0);
  const steps = 7;
  for (let i = 1; i <= steps; i++) b.lineTo(x + (i % 2 ? 14 : -14) * (1 - i / steps), (y * i) / steps);
  return b.build();
}

function Lightning({ t, at }: { t: SharedValue<number>; at: { x: number; y: number } }) {
  const op = useDerivedValue(() => (Math.floor(t.value * 9) % 2 === 0 ? 1 : 0.25) * (1 - t.value * 0.6));
  const path = boltPath(at.x, at.y);
  return (
    <Group opacity={op}>
      <Path path={path} style="stroke" strokeWidth={10} color="#FFE14B">
        <BlurMask blur={10} style="solid" />
      </Path>
      <Path path={path} style="stroke" strokeWidth={3} color="#FFFFFF" />
      <Circle cx={at.x} cy={at.y} r={22} color="rgba(255,240,140,0.5)">
        <BlurMask blur={12} style="normal" />
      </Circle>
    </Group>
  );
}

function Ring({ t, at, color }: { t: SharedValue<number>; at: { x: number; y: number }; color: string }) {
  const r = useDerivedValue(() => 18 + t.value * 46);
  const op = useDerivedValue(() => 1 - t.value);
  return (
    <Group opacity={op}>
      <Circle cx={at.x} cy={at.y} r={r} style="stroke" strokeWidth={6} color={color}>
        <BlurMask blur={4} style="solid" />
      </Circle>
    </Group>
  );
}

function Particle({ t, at, angle, speed, color, size, rise }: { t: SharedValue<number>; at: { x: number; y: number }; angle: number; speed: number; color: string; size: number; rise: boolean }) {
  const cx = useDerivedValue(() => at.x + Math.cos(angle) * speed * t.value);
  const cy = useDerivedValue(() => at.y + Math.sin(angle) * speed * t.value - (rise ? t.value * 40 : 0));
  const r = useDerivedValue(() => size * (1 - t.value * 0.7));
  const op = useDerivedValue(() => 1 - t.value);
  return <Circle cx={cx} cy={cy} r={r} color={color} opacity={op} />;
}

const BURST = Array.from({ length: 16 }, (_, i) => ({
  angle: (Math.PI * 2 * i) / 16 + (i % 3) * 0.2,
  speed: 40 + ((i * 37) % 30),
  size: 4 + (i % 4),
}));

function Burst({ t, at, colors, rise }: { t: SharedValue<number>; at: { x: number; y: number }; colors: string[]; rise: boolean }) {
  return (
    <>
      {BURST.map((p, i) => (
        <Particle key={i} t={t} at={at} angle={p.angle} speed={p.speed} size={p.size} color={colors[i % colors.length] as string} rise={rise} />
      ))}
    </>
  );
}
