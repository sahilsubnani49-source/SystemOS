import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Spacing, RankColors, withAlpha } from '../../core/theme';
import { Rank } from '../../core/constants';

interface Props {
  rank: Rank;
}

export function RankBadge({ rank }: Props) {
  const color = RankColors[rank];
  return (
    <View style={[styles.badge, { borderColor: withAlpha(color, 0.33) }]}>
      <Text style={[styles.text, { color }]}>RANK: {rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
});
