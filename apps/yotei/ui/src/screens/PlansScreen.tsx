import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { wallDate } from '@yotei/core';
import { useYotei, useYoteiApi } from '../state/context';
import { Button, Empty } from '../components/ui';
import { dayLabel, lastDay } from '../format';
import { C, S } from '../theme';

/** Every imported plan: switch, archive, delete, or read the original planner. */
export function PlansScreen() {
  const api = useYoteiApi();
  const plans = useYotei((s) => s.plans);
  const activeId = useYotei((s) => s.activeId);
  const now = useYotei((s) => s.now);
  const year = now.slice(0, 4);
  const [confirming, setConfirming] = React.useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.h1}>Plans</Text>
      {plans.length === 0 ? <Empty>No plans yet.</Empty> : null}
      {plans.map((p) => (
        <View key={p.id} style={[styles.card, p.id === activeId && styles.active, p.archived && { opacity: 0.6 }]}>
          <Pressable onPress={() => void api.getState().selectPlan(p.id)} accessibilityRole="button">
            <Text style={styles.title}>{p.title}{p.archived ? '  (archived)' : ''}</Text>
            <Text style={styles.meta}>
              {dayLabel(wallDate(p.start), year)} – {dayLabel(lastDay(p.end), year)}  ·  “{p.boundaryQuote}”
            </Text>
          </Pressable>
          <View style={styles.row}>
            <Button label="Source" tone="plain" onPress={() => api.getState().viewSource(p.id)} style={styles.small} />
            <Button
              label={p.archived ? 'Unarchive' : 'Archive'}
              tone="plain"
              onPress={() => void api.getState().archivePlan(p.id, !p.archived)}
              style={styles.small}
            />
            {confirming === p.id ? (
              <Button label="Really delete" tone="danger" onPress={() => void api.getState().deletePlan(p.id)} style={styles.small} />
            ) : (
              <Button label="Delete" tone="danger" onPress={() => setConfirming(p.id)} style={styles.small} />
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/** The planner exactly as imported: the source of truth, always one tap away. */
export function SourceScreen() {
  const api = useYoteiApi();
  const plan = useYotei((s) => s.plans.find((p) => p.id === s.sourcePlanId));
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Button label="‹ Back to plans" tone="plain" onPress={() => api.getState().go('plans')} />
      <Text style={styles.h1}>{plan?.title ?? 'Planner'}</Text>
      <Text selectable style={styles.source}>{plan?.sourceMd ?? ''}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120, gap: S.md },
  h1: { color: C.text, fontSize: 22, fontWeight: '700' },
  card: { backgroundColor: C.surface, borderRadius: 10, padding: S.md, gap: S.sm, borderWidth: 1, borderColor: C.line },
  active: { borderColor: C.accent },
  title: { color: C.text, fontSize: 16, fontWeight: '600' },
  meta: { color: C.dim, fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap' },
  small: { paddingVertical: 8, paddingHorizontal: S.md },
  source: { color: C.text, fontSize: 13, lineHeight: 19, fontFamily: 'monospace' },
});
