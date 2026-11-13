import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { wallDate, yearAgenda, type MonthAgenda } from '@yotei/core';
import { useActiveItems, usePlanLooks, useYotei, type PlanLook } from '../state/context';
import { Card, ProgressBar } from '../components/ui';
import { monthLabel } from '../format';
import { C, S } from '../theme';

const PREVIEW = 5;

/** The next twelve months at a glance: how much is planned, the phases, the main tasks. */
export function YearScreen() {
  const now = useYotei((s) => s.now);
  const items = useActiveItems();
  const looks = usePlanLooks();
  const today = wallDate(now);
  const months = useMemo(() => yearAgenda(items, today), [items, today]);
  const total = months.reduce((n, m) => n + m.total, 0);

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="year-screen">
      <Text style={styles.kicker}>NEXT 12 MONTHS</Text>
      <Text style={styles.h1}>
        {monthLabel(months[0]!.month)} – {monthLabel(months[11]!.month)}
      </Text>
      <Text style={styles.sub}>{total > 0 ? `${total.toLocaleString()} dated tasks ahead` : 'Nothing planned this year'}</Text>
      <View style={styles.list}>
        {months.map((m, i) => (
          <MonthCard key={m.month} month={m} current={i === 0} looks={looks} />
        ))}
      </View>
    </ScrollView>
  );
}

function MonthCard({ month, current, looks }: { month: MonthAgenda; current: boolean; looks: Map<string, PlanLook> }) {
  const [open, setOpen] = useState(false);
  if (month.total === 0) {
    return (
      <View style={styles.emptyMonth}>
        <Text style={styles.emptyMonthText}>{monthLabel(month.month)}</Text>
        <Text style={styles.emptyMonthText}>Nothing planned</Text>
      </View>
    );
  }
  const shown = open ? month.groups : month.groups.slice(0, PREVIEW);
  return (
    <Card accent={current ? C.accent : undefined}>
      <View style={styles.head}>
        <Text style={styles.month}>{monthLabel(month.month)}</Text>
        <Text style={styles.count}>
          {month.done}/{month.total} done
        </Text>
      </View>
      <ProgressBar done={month.done} total={month.total} />
      {month.phases.length > 0 ? (
        <View style={styles.phases}>
          {month.phases.map((p) => (
            <Text key={p} style={styles.phase}>{p}</Text>
          ))}
        </View>
      ) : null}
      <View style={{ gap: 6, marginTop: S.xs }}>
        {shown.map((g) => (
          <View key={`${g.planId}-${g.text}`} style={styles.group}>
            <View style={[styles.dot, { backgroundColor: looks.get(g.planId)?.color ?? C.dim }]} />
            <Text style={[styles.groupText, g.done === g.count && styles.groupDone]} numberOfLines={2}>
              {g.text}
              {g.count > 1 ? <Text style={styles.times}>  ×{g.count}</Text> : null}
              {g.first.timing ? <Text style={styles.times}>  ·  {g.first.timing}</Text> : null}
            </Text>
          </View>
        ))}
      </View>
      {month.groups.length > PREVIEW ? (
        <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.more}>{open ? 'Show less' : `+ ${month.groups.length - PREVIEW} more`}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120 },
  kicker: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  h1: { color: C.text, fontSize: 22, fontWeight: '700', marginTop: 2 },
  sub: { color: C.dim, fontSize: 13, marginTop: 4 },
  list: { gap: S.md, marginTop: S.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  month: { color: C.text, fontSize: 17, fontWeight: '700' },
  count: { color: C.dim, fontSize: 12 },
  phases: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  phase: {
    color: C.text,
    fontSize: 11,
    backgroundColor: C.surface2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  group: { flexDirection: 'row', gap: S.sm, alignItems: 'flex-start' },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  groupText: { color: C.text, fontSize: 14, lineHeight: 20, flex: 1 },
  groupDone: { color: C.dim, textDecorationLine: 'line-through' },
  times: { color: C.faint, fontSize: 12 },
  more: { color: C.accent, fontSize: 13, fontWeight: '600', marginTop: S.xs },
  emptyMonth: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    borderStyle: 'dashed',
  },
  emptyMonthText: { color: C.faint, fontSize: 13 },
});
