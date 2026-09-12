import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Spacing, withAlpha } from '../../core/theme';
import { CornerCard } from './CornerCard';

interface Props {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  /** Consecutive logging days — rendered as an outline tag beside the level. */
  streakDays?: number;
  /** Right-hand footer line, e.g. "Daily Quest: 2/3 logged". */
  footerRight?: string;
}

// No native gradient module is installed (and adding one means rebuilding the dev
// client), so the fill is faked with a handful of flex slices whose colors are
// interpolated between the two ends. Twelve is enough to read as continuous at 8px.
const GRADIENT_STEPS = 12;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgb(${ch(ar, br)}, ${ch(ag, bg)}, ${ch(ab, bb)})`;
}

const SLICE_COLORS = Array.from({ length: GRADIENT_STEPS }, (_, i) =>
  mix(Colors.primaryDim, Colors.accent, i / (GRADIENT_STEPS - 1)),
);

/** The Hunter's level card: level, streak tag, gradient XP bar, and two footer labels. */
export function XPBar({
  level,
  experience,
  experienceToNextLevel,
  streakDays,
  footerRight,
}: Props) {
  const progress = Math.min(experience / Math.max(experienceToNextLevel, 1), 1);

  return (
    <CornerCard style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.level}>LV. {level}</Text>
        {streakDays !== undefined && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>
              {streakDays} DAY{streakDays === 1 ? '' : 'S'} STREAK
            </Text>
          </View>
        )}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]}>
          {SLICE_COLORS.map((color, i) => (
            <View key={i} style={[styles.slice, { backgroundColor: color }]} />
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.footer}>
          {experience} / {experienceToNextLevel} XP
        </Text>
        {footerRight && <Text style={styles.footer}>{footerRight}</Text>}
      </View>
    </CornerCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  level: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xxl,
    letterSpacing: 1,
  },
  tag: {
    borderWidth: 1,
    borderColor: withAlpha(Colors.textSecondary, 0.5),
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  track: {
    height: 8,
    backgroundColor: '#0E0E15',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    flexDirection: 'row',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  slice: {
    flex: 1,
    height: '100%',
  },
  footer: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
});
