import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { currentView, minutesBetween, progress, wallDate } from '@yotei/core';
import { useYotei, useYoteiApi } from '../state/context';
import { ItemRow, Empty, SectionTitle } from '../components/ui';
import { dayLabel, lastDay, untilLabel } from '../format';
import { C, S } from '../theme';

/** What the planner says to do now: this week (or today, for hour plans). */
export function NowScreen() {
  const api = useYoteiApi();
  const plans = useYotei((s) => s.plans);
  const activeId = useYotei((s) => s.activeId);
  const items = useYotei((s) => s.items);
  const now = useYotei((s) => s.now);
  const timezone = useYotei((s) => s.timezone);
  const plan = plans.find((p) => p.id === activeId) ?? null;

  const view = useMemo(() => (plan ? currentView(plan, items, now) : null), [plan, items, now]);

  if (!plan || !view) {
    return (
      <View style={styles.center}>
        <Text style={styles.h1}>No plan yet</Text>
        <Empty>Import a planner to see what it asks of you this week.</Empty>
      </View>
    );
  }

  const year = now.slice(0, 4);
  const w = view.window;
  const windowName = w.kind === 'day' ? `Day ${w.index} of ${w.total}` : `Week ${w.index} of ${w.total}`;
  const windowDates =
    w.kind === 'day'
      ? dayLabel(wallDate(w.start), year)
      : `${dayLabel(wallDate(w.start), year)} - ${dayLabel(lastDay(w.end), year)}`;
  const { done, total } = progress(items);
  const toggle = (id: string) => () => void api.getState().toggleDone(id);
  const laterTitle = w.kind === 'day' ? 'LATER TODAY' : 'THIS WEEK';

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="now-screen">
      <Text style={styles.h1} numberOfLines={2}>{plan.title}</Text>
      <Text style={styles.sub}>
        {windowName}  ·  {windowDates}
      </Text>
      <Text style={styles.tz}>
        {timezone}  ·  {done}/{total} done  ·  limit: “{plan.boundaryQuote}”
      </Text>
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${total ? (done / total) * 100 : 0}%` }]} />
      </View>

      {view.phase === 'before' ? (
        <Text style={styles.banner}>Starts {dayLabel(wallDate(plan.start), year)} (in {untilLabel(minutesBetween(now, plan.start))}).</Text>
      ) : view.phase === 'finished' ? (
        <Text style={styles.banner}>This plan ended {dayLabel(lastDay(plan.end), year)}.</Text>
      ) : (
        <Text style={styles.next}>Next change in {untilLabel(minutesBetween(now, view.nextChange))}</Text>
      )}

      {view.phase === 'active' ? (
        <>
          <SectionTitle color={C.now}>NOW</SectionTitle>
          {view.current.length === 0 ? <Empty>Nothing in the planner for right now.</Empty> : null}
          <View style={styles.list}>
            {view.current.map((it) => (
              <ItemRow key={it.id} item={it} now={now} onToggle={toggle(it.id)} highlight="now" testID={`item-${it.text}`} />
            ))}
          </View>
        </>
      ) : null}

      <SectionTitle>{laterTitle}</SectionTitle>
      {view.later.length === 0 ? <Empty>Nothing else in the planner for this {w.kind}.</Empty> : null}
      <View style={styles.list}>
        {view.later.map((it) => (
          <ItemRow key={it.id} item={it} now={now} onToggle={toggle(it.id)} testID={`item-${it.text}`} />
        ))}
      </View>

      {view.overdue.length > 0 ? (
        <>
          <SectionTitle color={C.danger}>OVERDUE ({view.overdue.length})</SectionTitle>
          <View style={styles.list}>
            {view.overdue.map((it) => (
              <ItemRow key={it.id} item={it} now={now} onToggle={toggle(it.id)} highlight="overdue" testID={`item-${it.text}`} />
            ))}
          </View>
        </>
      ) : null}

      {view.upNext.length > 0 ? (
        <>
          <SectionTitle>UP NEXT</SectionTitle>
          <View style={styles.list}>
            {view.upNext.map((it) => (
              <ItemRow key={it.id} item={it} now={now} onToggle={toggle(it.id)} testID={`item-${it.text}`} />
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120, gap: S.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.sm },
  h1: { color: C.text, fontSize: 22, fontWeight: '700' },
  sub: { color: C.text, fontSize: 15, marginTop: 2 },
  tz: { color: C.dim, fontSize: 12 },
  bar: { height: 4, backgroundColor: C.surface2, borderRadius: 2, overflow: 'hidden', marginTop: S.sm },
  fill: { height: '100%', backgroundColor: C.accent },
  banner: { color: C.warn, fontSize: 14, marginTop: S.md },
  next: { color: C.dim, fontSize: 12, marginTop: S.sm },
  list: { gap: S.sm },
});
