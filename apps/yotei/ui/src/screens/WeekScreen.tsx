import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDays, wallDate, weekAgenda } from '@yotei/core';
import { useActiveItems, usePlanLooks, useYotei, useYoteiApi } from '../state/context';
import { Empty, ItemRow, ProgressBar, SectionTitle } from '../components/ui';
import { dayLabel, lastDay, relativeDay } from '../format';
import { C, S } from '../theme';

/** The next seven days, day by day, with week- and month-long tasks listed once on top. */
export function WeekScreen() {
  const api = useYoteiApi();
  const now = useYotei((s) => s.now);
  const items = useActiveItems();
  const looks = usePlanLooks();
  const today = wallDate(now);
  const week = useMemo(() => weekAgenda(items, today), [items, today]);

  const toggle = (id: string) => () => void api.getState().toggleDone(id);
  const all = [...week.ongoing, ...week.days.flatMap((d) => [...d.timed, ...d.tasks])];
  const done = all.filter((i) => i.doneAt !== null).length;
  const year = today.slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="week-screen">
      <Text style={styles.kicker}>NEXT 7 DAYS</Text>
      <Text style={styles.h1}>
        {dayLabel(today, year)} – {dayLabel(addDays(today, 6), year)}
      </Text>
      <Text style={styles.sub}>{all.length > 0 ? `${done} of ${all.length} done` : 'Nothing planned this week'}</Text>
      {all.length > 0 ? (
        <View style={{ marginTop: S.sm }}>
          <ProgressBar done={done} total={all.length} />
        </View>
      ) : null}

      {week.ongoing.length > 0 ? (
        <>
          <SectionTitle right={`${week.ongoing.length}`}>THIS WEEK</SectionTitle>
          <View style={styles.list}>
            {week.ongoing.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                now={now}
                look={looks.get(it.planId)}
                onToggle={toggle(it.id)}
                variant="plain"
                extra={`${dayLabel(wallDate(it.start), year)} – ${dayLabel(lastDay(it.end), year)}`}
              />
            ))}
          </View>
        </>
      ) : null}

      {week.days.map((d) => {
        const list = [...d.timed, ...d.tasks];
        const isToday = d.date === today;
        return (
          <View key={d.date}>
            <SectionTitle color={isToday ? C.accent : C.dim} right={list.length ? `${list.length}` : undefined}>
              {relativeDay(d.date, today).toUpperCase()}
              {isToday || d.date === addDays(today, 1) ? `  ·  ${dayLabel(d.date, year).toUpperCase()}` : ''}
            </SectionTitle>
            {list.length === 0 ? <Empty>Free</Empty> : null}
            <View style={styles.list}>
              {d.timed.map((it) => (
                <ItemRow key={it.id} item={it} now={now} look={looks.get(it.planId)} onToggle={toggle(it.id)} variant="slot" />
              ))}
              {d.tasks.map((it) => (
                <ItemRow key={it.id} item={it} now={now} look={looks.get(it.planId)} onToggle={toggle(it.id)} variant="plain" />
              ))}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120 },
  kicker: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  h1: { color: C.text, fontSize: 24, fontWeight: '700', marginTop: 2 },
  sub: { color: C.dim, fontSize: 13, marginTop: 4 },
  list: { gap: S.sm },
});
