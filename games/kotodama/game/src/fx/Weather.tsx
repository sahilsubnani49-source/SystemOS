import React from 'react';
import { BlurMask, Circle, Group, Oval, useClock } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { Weather as WeatherKind } from '@kotodama/core';

// Particles are pure functions of the clock: no per-frame JS state, no setState,
// so 30 petals cost nothing on the React side.

function hash(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Petal({ i, clock, w, h }: { i: number; clock: SharedValue<number>; w: number; h: number }) {
  const speed = 0.02 + hash(i, 1) * 0.03;
  const x0 = hash(i, 2) * w;
  const sway = 12 + hash(i, 3) * 24;
  const size = 3 + hash(i, 4) * 3;
  const offset = hash(i, 5) * 100000;
  const transform = useDerivedValue(() => {
    const t = (clock.value + offset) * speed;
    const y = (t % (h + 40)) - 20;
    const x = (x0 + Math.sin(t / 40) * sway + t * 0.15) % (w + 20);
    return [{ translateX: x }, { translateY: y }, { rotate: t / 60 }];
  });
  return (
    <Group transform={transform}>
      <Oval x={-size} y={-size / 2} width={size * 2} height={size} color={i % 3 === 0 ? '#FFD0DE' : '#F4A7C0'} />
    </Group>
  );
}

function Firefly({ i, clock, w, h }: { i: number; clock: SharedValue<number>; w: number; h: number }) {
  const x0 = hash(i, 2) * w;
  const y0 = hash(i, 6) * h;
  const offset = hash(i, 5) * 10000;
  const cx = useDerivedValue(() => x0 + Math.sin((clock.value + offset) / 1300) * 30);
  const cy = useDerivedValue(() => y0 + Math.cos((clock.value + offset) / 1700) * 24);
  const opacity = useDerivedValue(() => 0.3 + 0.7 * Math.abs(Math.sin((clock.value + offset) / 600)));
  return (
    <Group opacity={opacity}>
      <Circle cx={cx} cy={cy} r={5} color="#FFF27A">
        <BlurMask blur={5} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={1.6} color="#FFFFE0" />
    </Group>
  );
}

function Flake({ i, clock, w, h }: { i: number; clock: SharedValue<number>; w: number; h: number }) {
  const speed = 0.025 + hash(i, 1) * 0.03;
  const x0 = hash(i, 2) * w;
  const offset = hash(i, 5) * 100000;
  const cy = useDerivedValue(() => ((clock.value + offset) * speed) % (h + 10));
  const cx = useDerivedValue(() => x0 + Math.sin((clock.value + offset) / 900) * 10);
  return <Circle cx={cx} cy={cy} r={1.5 + hash(i, 3) * 1.5} color="#F4F8FF" />;
}

/** Full-screen weather layer for a Skia <Canvas> of size w×h. */
export function Weather({ kind, w, h, count = 28 }: { kind: WeatherKind; w: number; h: number; count?: number }) {
  const clock = useClock();
  if (kind === 'none' || kind === 'rain') return null;
  const items = Array.from({ length: kind === 'fireflies' ? Math.round(count / 2) : count }, (_, i) => i);
  return (
    <Group>
      {items.map((i) =>
        kind === 'sakura' ? (
          <Petal key={i} i={i} clock={clock} w={w} h={h} />
        ) : kind === 'fireflies' ? (
          <Firefly key={i} i={i} clock={clock} w={w} h={h} />
        ) : (
          <Flake key={i} i={i} clock={clock} w={w} h={h} />
        ),
      )}
    </Group>
  );
}
