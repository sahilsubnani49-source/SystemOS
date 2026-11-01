import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Rect,
  SweepGradient,
  useClock,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow } from '../../core/theme';

const W = 300;
const H = 150;
const CX = W / 2;
const CY = 84;

/**
 * The Stats-tab entrance to Kotodama: a torii gate framing a swirling vortex.
 * Pure Skia, animated from the clock on the UI thread, so it costs no re-renders.
 */
export function GatePortal({ onPress }: { onPress: () => void }) {
  const clock = useClock();
  const spin = useDerivedValue(() => [{ rotate: clock.value / 900 }]);
  const spinBack = useDerivedValue(() => [{ rotate: -clock.value / 1400 }]);
  const pulse = useDerivedValue(() => 46 + Math.sin(clock.value / 500) * 4);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Enter the Gate of Words: open the Kotodama Japanese game"
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.canvasWrap}>
        <Canvas style={{ width: W, height: H }}>
          <Circle cx={CX} cy={CY} r={pulse} color="rgba(127,61,255,0.45)">
            <BlurMask blur={18} style="normal" />
          </Circle>
          <Group origin={vec(CX, CY)} transform={spin}>
            <Circle cx={CX} cy={CY} r={40}>
              <SweepGradient
                c={vec(CX, CY)}
                colors={['#2A0A5A', '#7F3DFF', '#00E5FF', '#F4A7C0', '#2A0A5A']}
              />
            </Circle>
          </Group>
          <Group origin={vec(CX, CY)} transform={spinBack} opacity={0.7}>
            <Circle cx={CX} cy={CY} r={26}>
              <SweepGradient
                c={vec(CX, CY)}
                colors={['#0B0B12', '#5F00FF', '#0B0B12', '#00E5FF', '#0B0B12']}
              />
            </Circle>
          </Group>
          <Circle cx={CX} cy={CY} r={10} color="#0B0B12" />
          {/* torii */}
          <Group color="#C8302A">
            <Rect x={CX - 78} y={22} width={156} height={10} />
            <Rect x={CX - 66} y={40} width={132} height={7} />
            <Rect x={CX - 56} y={30} width={11} height={110} />
            <Rect x={CX + 45} y={30} width={11} height={110} />
          </Group>
          <Rect x={CX - 82} y={18} width={164} height={5} color="#2A1A1A" />
        </Canvas>
      </View>
      <Text style={styles.title}>GATE OF WORDS</Text>
      {/* System font: Press Start 2P has no Japanese glyphs. */}
      <Text style={styles.ja}>言葉の門</Text>
      <Text style={styles.sub}>Enter KOTODAMA · learn hiragana to N3 · study time earns XP</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(127,61,255,0.5)',
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadow.card,
  },
  canvasWrap: { width: W, height: H, alignItems: 'center' },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 2,
  },
  ja: { color: '#F4A7C0', fontSize: 18, fontWeight: '700' },
  sub: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
});
