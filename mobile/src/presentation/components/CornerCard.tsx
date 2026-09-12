import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../core/theme';

interface Props {
  style?: ViewStyle | ViewStyle[];
  /** Bracket arm length in px. */
  size?: number;
  color?: string;
  /** Bracket opacity — the design dims them on the small task cards. */
  bracketOpacity?: number;
}

/**
 * A surface card with the Solo Leveling "system window" corner brackets: an L in
 * the top-left and its mirror in the bottom-right. Pure Views — no SVG dependency.
 */
export function CornerCard({
  children,
  style,
  size = 12,
  color = Colors.accent,
  bracketOpacity = 1,
}: PropsWithChildren<Props>) {
  const arm = { width: size, height: size, borderColor: color, opacity: bracketOpacity };
  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={[styles.bracket, styles.topLeft, arm]} />
      <View pointerEvents="none" style={[styles.bracket, styles.bottomRight, arm]} />
      {children}
    </View>
  );
}

const INSET = 6;

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.card,
  },
  bracket: {
    position: 'absolute',
  },
  topLeft: {
    top: INSET,
    left: INSET,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bottomRight: {
    bottom: INSET,
    right: INSET,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
});
