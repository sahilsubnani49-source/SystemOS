import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow } from '../../core/theme';

interface Props {
  level: number;
  experience: number;
  experienceToNextLevel: number;
}

export function XPBar({ level, experience, experienceToNextLevel }: Props) {
  const progress = Math.min(experience / experienceToNextLevel, 1);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.level}>LEVEL {level}</Text>
        <Text style={styles.xpText}>
          {experience} / {experienceToNextLevel} XP
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  level: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
    letterSpacing: 1,
  },
  xpText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  track: {
    height: 8,
    backgroundColor: '#0E0E15',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
});
