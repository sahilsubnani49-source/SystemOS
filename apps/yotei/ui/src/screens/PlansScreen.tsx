import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { progress, wallDate, type PlanItem } from '@yotei/core';
import { useYotei, useYoteiApi } from '../state/context';
import { Button, Card, Empty, ProgressBar } from '../components/ui';
import { dayLabel, lastDay } from '../format';
import { C, MONO, S, planColor } from '../theme';

/** Every plan: its progress, its source JSON, archive and delete. */
export function PlansScreen() {
  const api = useYoteiApi();
  const plans = useYotei((s) => s.plans);
  const items = useYotei((s) => s.items);
  const now = useYotei((s) => s.now);
  const year = now.slice(0, 4);
  const [confirming, setConfirming] = useState<string | null>(null);

  const byPlan = useMemo(() => {
    const m = new Map<string, PlanItem[]>();
    for (const it of items) {
      const list = m.get(it.planId);
      if (list) list.push(it);
      else m.set(it.planId, [it]);
    }
    return m;
  }, [items]);

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="plans-screen">
      <View style={styles.headRow}>
        <Text style={styles.h1}>Plans</Text>
        <Button label="+ Add" small onPress={() => api.getState().go('add')} />
      </View>
      {plans.length === 0 ? <Empty>No plans yet.</Empty> : null}
      {plans.map((p) => {
        const { done, total } = progress(byPlan.get(p.id) ?? []);
        const color = planColor(p.id);
        const phase = now < p.start ? 'Starts' : now >= p.end ? 'Ended' : 'Running';
        return (
          <Card key={p.id} style={[{ marginTop: S.md }, p.archived && { opacity: 0.55 }]}>
            <View style={styles.titleRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.title} numberOfLines={2}>{p.title}</Text>
            </View>
            <Text style={styles.meta}>
              {p.archived ? 'Archived' : phase}  ·  {dayLabel(wallDate(p.start), year)} – {dayLabel(lastDay(p.end), year)}  ·  {p.limit}
            </Text>
            <View style={styles.progressRow}>
              <View style={{ flex: 1 }}>
                <ProgressBar done={done} total={total} color={color} />
              </View>
              <Text style={styles.pct}>
                {done}/{total}
              </Text>
            </View>
            <View style={styles.row}>
              <Button label="Source" tone="plain" small onPress={() => api.getState().viewSource(p.id)} />
              <Button
                label={p.archived ? 'Unarchive' : 'Archive'}
                tone="plain"
                small
                onPress={() => void api.getState().archivePlan(p.id, !p.archived)}
              />
              {confirming === p.id ? (
                <>
                  <Button label="Delete for good" tone="danger" small onPress={() => void api.getState().deletePlan(p.id)} />
                  <Button label="Keep" tone="plain" small onPress={() => setConfirming(null)} />
                </>
              ) : (
                <Button label="Delete" tone="danger" small onPress={() => setConfirming(p.id)} />
              )}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

/** The plan exactly as imported, to read, copy, or hand back to an AI for changes. */
export function SourceScreen() {
  const api = useYoteiApi();
  const plan = useYotei((s) => s.plans.find((p) => p.id === s.sourcePlanId));
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await Clipboard.setStringAsync(plan?.source ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      api.setState({ error: `Could not copy: ${e instanceof Error ? e.message : String(e)}` });
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.row}>
        <Button label="‹ Plans" tone="plain" small onPress={() => api.getState().go('plans')} />
        <Button label={copied ? 'Copied ✓' : 'Copy'} small onPress={() => void copy()} />
      </View>
      <Text style={[styles.h1, { marginTop: S.md }]}>{plan?.title ?? 'Plan'}</Text>
      <Text style={styles.meta}>To change a plan, copy this, ask an AI to edit it, and add it again.</Text>
      <Text selectable style={styles.source}>{plan?.source ?? ''}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: C.text, fontSize: 26, fontWeight: '700' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  title: { color: C.text, fontSize: 17, fontWeight: '700', flex: 1 },
  meta: { color: C.dim, fontSize: 12, lineHeight: 17 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  pct: { color: C.dim, fontSize: 12, fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row', gap: S.sm, flexWrap: 'wrap', marginTop: S.xs },
  source: {
    color: C.text,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: MONO,
    backgroundColor: C.surface,
    borderRadius: 10,
    padding: S.md,
    marginTop: S.md,
  },
});
