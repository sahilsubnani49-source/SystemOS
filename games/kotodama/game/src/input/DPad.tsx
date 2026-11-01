import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Facing } from '@kotodama/core';
import { C, F } from '../theme';

const KEY_DIR: Record<string, Facing> = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right',
};

/**
 * Hold-to-walk: while a direction is held, `onStep` fires immediately and then
 * every `stepMs`. Works with touch (the pad) and, on web, the keyboard
 * (arrows/WASD to move, Z/Enter/Space = A, X/Esc = B).
 */
export function useHeldDirection(onStep: (d: Facing) => void, stepMs: number, onA: () => void, onB: () => void) {
  const held = useRef<Facing | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepRef = useRef(onStep);
  stepRef.current = onStep;
  const msRef = useRef(stepMs);
  msRef.current = stepMs;

  const stop = () => {
    held.current = null;
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  const start = (d: Facing) => {
    if (held.current === d) return;
    stop();
    held.current = d;
    stepRef.current(d);
    timer.current = setInterval(() => held.current && stepRef.current(held.current), msRef.current);
  };

  const aRef = useRef(onA);
  aRef.current = onA;
  const bRef = useRef(onB);
  bRef.current = onB;

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return stop;
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.tagName === 'INPUT') return;
      const d = KEY_DIR[e.key];
      if (d) {
        e.preventDefault();
        start(d);
      } else if (!e.repeat && (e.key === 'z' || e.key === 'Z' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        aRef.current();
      } else if (!e.repeat && (e.key === 'x' || e.key === 'X' || e.key === 'Escape')) {
        bRef.current();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (KEY_DIR[e.key] && held.current === KEY_DIR[e.key]) stop();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      stop();
    };
    // start/stop only touch refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { start, stop };
}

function Arrow({ dir, glyph, start, stop }: { dir: Facing; glyph: string; start: (d: Facing) => void; stop: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`move ${dir}`}
      onPressIn={() => start(dir)}
      onPressOut={stop}
      style={({ pressed }) => [styles.arrow, styles[dir], pressed && styles.pressed]}
    >
      <Text style={styles.glyph}>{glyph}</Text>
    </Pressable>
  );
}

export function DPad({ start, stop }: { start: (d: Facing) => void; stop: () => void }) {
  return (
    <View style={styles.pad}>
      <Arrow dir="up" glyph="▲" start={start} stop={stop} />
      <Arrow dir="left" glyph="◀" start={start} stop={stop} />
      <Arrow dir="right" glyph="▶" start={start} stop={stop} />
      <Arrow dir="down" glyph="▼" start={start} stop={stop} />
      <View style={styles.hub} />
    </View>
  );
}

export function RoundButton({ label, sub, onPress, color = C.red, size = 64 }: { label: string; sub?: string; onPress: () => void; color?: string; size?: number }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={sub ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}
    >
      <Text style={styles.roundLabel}>{label}</Text>
      {sub ? <Text style={styles.roundSub}>{sub}</Text> : null}
    </Pressable>
  );
}

const SIZE = 52;
const styles = StyleSheet.create({
  pad: { width: SIZE * 3, height: SIZE * 3 },
  arrow: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    backgroundColor: 'rgba(20,18,32,0.82)',
    borderColor: C.panelEdge,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  up: { left: SIZE, top: 0 },
  down: { left: SIZE, top: SIZE * 2 },
  left: { left: 0, top: SIZE },
  right: { left: SIZE * 2, top: SIZE },
  hub: { position: 'absolute', left: SIZE + 8, top: SIZE + 8, width: SIZE - 16, height: SIZE - 16, borderRadius: 6, backgroundColor: 'rgba(20,18,32,0.82)' },
  pressed: { backgroundColor: 'rgba(232,176,75,0.35)' },
  glyph: { color: C.paper, fontSize: 18 },
  round: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(0,0,0,0.35)' },
  roundLabel: { fontFamily: F.pixel, color: C.white, fontSize: 14 },
  roundSub: { fontFamily: F.ja, color: C.white, fontSize: 10, marginTop: 1 },
});
