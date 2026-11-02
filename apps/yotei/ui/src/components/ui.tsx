import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { PlanItem, WallTime } from '@yotei/core';
import { C, S } from '../theme';
import { whenLabel } from '../format';

export function Button({
  label, onPress, tone = 'accent', disabled, testID, style,
}: {
  label: string;
  onPress: () => void;
  tone?: 'accent' | 'plain' | 'danger';
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = tone === 'accent' ? C.accent : 'transparent';
  const fg = tone === 'accent' ? C.bg : tone === 'danger' ? C.danger : C.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: tone === 'accent' ? C.accent : tone === 'danger' ? C.danger : C.line },
        (pressed || disabled) && { opacity: 0.55 },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, color = C.dim }: { children: React.ReactNode; color?: string }) {
  return <Text style={[styles.section, { color }]}>{children}</Text>;
}

/** One planner item: its own words, a checkbox, and when the planner put it. */
export function ItemRow({
  item, now, onToggle, highlight, testID,
}: {
  item: PlanItem;
  now: WallTime;
  onToggle: () => void;
  highlight?: 'now' | 'overdue';
  testID?: string;
}) {
  const done = item.doneAt !== null;
  const edge = highlight === 'now' ? C.now : highlight === 'overdue' ? C.danger : C.line;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={item.text}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, { borderLeftColor: edge }, pressed && { opacity: 0.75 }]}
    >
      <View style={[styles.box, done && styles.boxDone]}>{done ? <Text style={styles.tick}>✓</Text> : null}</View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.text, done && styles.textDone]}>{item.text}</Text>
        <Text style={styles.meta}>
          {whenLabel(item, now)}
          {item.periodQuote ? `  ·  “${item.periodQuote}”` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

const styles = StyleSheet.create({
  btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: S.lg, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '600' },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, marginTop: S.lg, marginBottom: S.xs },
  row: {
    flexDirection: 'row',
    gap: S.md,
    backgroundColor: C.surface,
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: S.md,
    alignItems: 'flex-start',
  },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.dim,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxDone: { backgroundColor: C.accent, borderColor: C.accent },
  tick: { color: C.bg, fontWeight: '900', fontSize: 13, lineHeight: 16 },
  text: { color: C.text, fontSize: 15, lineHeight: 21 },
  textDone: { color: C.dim, textDecorationLine: 'line-through' },
  meta: { color: C.dim, fontSize: 12 },
  empty: { color: C.dim, fontSize: 14, paddingVertical: S.sm },
});
