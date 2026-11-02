import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { wallTime, type PlanItem, type WallTime } from '@yotei/core';
import { C, S } from '../theme';
import { whenLabel } from '../format';
import type { PlanLook } from '../state/context';

export function Button({
  label, onPress, tone = 'accent', disabled, testID, style, small,
}: {
  label: string;
  onPress: () => void;
  tone?: 'accent' | 'plain' | 'danger';
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg = tone === 'accent' ? C.accent : 'transparent';
  const fg = tone === 'accent' ? C.bg : tone === 'danger' ? C.danger : C.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: bg, borderColor: tone === 'accent' ? C.accent : tone === 'danger' ? C.danger : C.line },
        (pressed || disabled) && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[styles.btnText, small && { fontSize: 13 }, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, color = C.dim, right }: { children: React.ReactNode; color?: string; right?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color }]}>{children}</Text>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

export function Card({ children, style, accent }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; accent?: string }) {
  return <View style={[styles.card, accent ? { borderColor: accent } : null, style]}>{children}</View>;
}

export function ProgressBar({ done, total, color = C.accent }: { done: number; total: number; color?: string }) {
  return (
    <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: done }}>
      <View style={[styles.fill, { width: `${total ? (done / total) * 100 : 0}%`, backgroundColor: color }]} />
    </View>
  );
}

/** A plan's colour dot and name, for items when several plans are shown together. */
export function PlanTag({ look }: { look: PlanLook | undefined }) {
  if (!look) return null;
  return (
    <View style={styles.tag}>
      <View style={[styles.dot, { backgroundColor: look.color }]} />
      <Text style={styles.tagText} numberOfLines={1}>{look.title}</Text>
    </View>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <Text style={styles.empty}>{children}</Text>;
}

/**
 * One task: a checkbox, the task, its notes, and when. `variant="slot"` puts the clock
 * time in a left column (a schedule); "when" shows the date instead.
 */
export function ItemRow({
  item, now, look, onToggle, highlight, variant = 'when', showTag = true, extra, testID,
}: {
  item: PlanItem;
  now: WallTime;
  look?: PlanLook;
  onToggle: () => void;
  highlight?: 'now' | 'missed';
  variant?: 'slot' | 'when' | 'plain';
  showTag?: boolean;
  /** Extra meta text, e.g. "until Sun 8 Nov". */
  extra?: string;
  testID?: string;
}) {
  const done = item.doneAt !== null;
  const edge = highlight === 'now' ? C.now : highlight === 'missed' ? C.danger : (look?.color ?? C.line);
  const meta = [
    variant === 'when' ? whenLabel(item, now) : null,
    extra ?? null,
    item.timing || null,
  ].filter(Boolean).join('  ·  ');
  return (
    <Pressable
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={item.text}
      onPress={onToggle}
      style={({ pressed }) => [styles.row, { borderLeftColor: edge }, pressed && { opacity: 0.75 }]}
    >
      {variant === 'slot' ? (
        <View style={styles.timeCol}>
          <Text style={[styles.time, highlight === 'now' && { color: C.now }]}>{wallTime(item.start)}</Text>
          <Text style={styles.timeEnd}>{wallTime(item.end)}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.text, done && styles.textDone]}>{item.text}</Text>
        {item.notes ? (
          <Text style={styles.notes} numberOfLines={3}>{item.notes}</Text>
        ) : null}
        {meta ? <Text style={[styles.meta, highlight === 'missed' && { color: C.danger }]}>{meta}</Text> : null}
        {showTag ? <PlanTag look={look} /> : null}
      </View>
      <View style={[styles.box, done && styles.boxDone]}>{done ? <Text style={styles.tick}>✓</Text> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: S.lg, alignItems: 'center' },
  btnSmall: { paddingVertical: 8, paddingHorizontal: S.md },
  btnText: { fontSize: 15, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: S.xl, marginBottom: S.sm },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  sectionRight: { color: C.faint, fontSize: 12 },
  card: { backgroundColor: C.surface, borderRadius: 14, padding: S.lg, borderWidth: 1, borderColor: C.line, gap: S.sm },
  bar: { height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  tagText: { color: C.faint, fontSize: 11, flexShrink: 1 },
  row: {
    flexDirection: 'row',
    gap: S.md,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
    paddingVertical: S.md,
    paddingHorizontal: S.md,
    alignItems: 'flex-start',
  },
  timeCol: { width: 46, alignItems: 'flex-start' },
  time: { color: C.text, fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  timeEnd: { color: C.faint, fontSize: 12, fontVariant: ['tabular-nums'] },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: C.dim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxDone: { backgroundColor: C.accent, borderColor: C.accent },
  tick: { color: C.bg, fontWeight: '900', fontSize: 14, lineHeight: 17 },
  text: { color: C.text, fontSize: 15, lineHeight: 21 },
  textDone: { color: C.dim, textDecorationLine: 'line-through' },
  notes: { color: C.dim, fontSize: 13, lineHeight: 18 },
  meta: { color: C.dim, fontSize: 12 },
  empty: { color: C.dim, fontSize: 14, paddingVertical: S.xs },
});
