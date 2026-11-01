import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { C, F } from '../theme';

/** Bordered pixel panel: the game's window frame. */
export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function PText({ children, style, ja }: { children: React.ReactNode; style?: StyleProp<TextStyle>; ja?: boolean }) {
  return <Text style={[ja ? styles.ja : styles.pixel, style]}>{children}</Text>;
}

export function PButton({
  label, sub, onPress, disabled, tone = 'gold', style, testID,
}: {
  label: string;
  sub?: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'gold' | 'red' | 'jade' | 'violet' | 'dim';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const color = { gold: C.gold, red: C.red, jade: C.jade, violet: C.violet, dim: C.panelEdge }[tone];
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { borderColor: color, opacity: disabled ? 0.4 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
        style,
      ]}
    >
      <Text style={[styles.buttonLabel, { color: tone === 'dim' ? C.paper : color }]}>{label}</Text>
      {sub ? <Text style={styles.buttonSub}>{sub}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: C.panel,
    borderColor: C.panelEdge,
    borderWidth: 3,
    borderRadius: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 3 },
  },
  pixel: { fontFamily: F.pixel, color: C.paper, fontSize: 10, lineHeight: 16 },
  ja: { fontFamily: F.ja, color: C.paper, fontSize: 16, lineHeight: 24 },
  button: {
    backgroundColor: '#15131F',
    borderWidth: 3,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonLabel: { fontFamily: F.pixel, fontSize: 10, lineHeight: 14 },
  buttonSub: { fontFamily: F.ja, color: C.dim, fontSize: 12, marginTop: 2 },
});
