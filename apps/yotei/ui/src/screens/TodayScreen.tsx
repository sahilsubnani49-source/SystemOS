import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { dayAgenda, minutesBetween, missed, pickFocus, wall, wallDate, type Focus } from '@yotei/core';
import { useActiveItems, usePlanLooks, useYotei, useYoteiApi, type PlanLook } from '../state/context';
import { Button, Card, Empty, ItemRow, PlanTag, ProgressBar, SectionTitle } from '../components/ui';
import { dayLabel, lastDay, longDate, relativeDay, timeRange, untilLabel, weekdayLong } from '../format';
import { C, S } from '../theme';

/** What to do today: the one thing right now, the day's schedule, and what was missed. */
export function TodayScreen() {
  const api = useYoteiApi();
  const now = useYotei((s) => s.now);
  const timezone = useYotei((s) => s.timezone);
  const items = useActiveItems();
  const looks = usePlanLooks();
  const today = wallDate(now);

  const day = useMemo(() => dayAgenda(items, today), [items, today]);
  const focus = useMemo(() => pickFocus(day, now), [day, now]);
  // Missed from before today; today's ended slots stay in the schedule, marked.
  const late = useMemo(() => missed(items.filter((i) => i.end <= wall(today)), now), [items, today, now]);
  // Items arrive sorted by start, so the first one after today is the next thing coming.
  const upcoming = useMemo(() => items.find((i) => wallDate(i.start) > today), [items, today]);

  if (items.length === 0) return <NoPlans onAdd={() => api.getState().go('add')} />;

  const toggle = (id: string) => () => void api.getState().toggleDone(id);
  const dayItems = [...day.timed, ...day.tasks];
  const doneToday = dayItems.filter((i) => i.doneAt !== null).length;
  const nothingToday = dayItems.length === 0 && day.ongoing.length === 0;
  const year = today.slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="today-screen">
      <Text style={styles.kicker}>{weekdayLong(today).toUpperCase()}</Text>
      <Text style={styles.h1}>{longDate(today)}</Text>
      <Text style={styles.sub}>
        {dayItems.length > 0 ? `${doneToday} of ${dayItems.length} done today` : 'Nothing scheduled today'}  ·  {timezone}
      </Text>
      {dayItems.length > 0 ? (
        <View style={{ marginTop: S.sm }}>
          <ProgressBar done={doneToday} total={dayItems.length} />
        </View>
      ) : null}

      {focus ? <FocusCard focus={focus} now={now} look={looks.get(focus.item.planId)} onToggle={toggle(focus.item.id)} /> : null}

      {day.timed.length > 0 ? (
        <>
          <SectionTitle right={`${day.timed.length}`}>SCHEDULE</SectionTitle>
          <View style={styles.list}>
            {day.timed.map((it) => {
              const running = it.start <= now && now < it.end;
              const over = it.end <= now && it.doneAt === null;
              return (
                <ItemRow
                  key={it.id}
                  item={it}
                  now={now}
                  look={looks.get(it.planId)}
                  onToggle={toggle(it.id)}
                  variant="slot"
                  highlight={running ? 'now' : over ? 'missed' : undefined}
                  extra={running ? `ends in ${untilLabel(minutesBetween(now, it.end))}` : over ? 'missed' : undefined}
                  testID={`item-${it.text}`}
                />
              );
            })}
          </View>
        </>
      ) : null}

      {day.tasks.length > 0 ? (
        <>
          <SectionTitle right={`${day.tasks.length}`}>TO DO TODAY</SectionTitle>
          <View style={styles.list}>
            {day.tasks.map((it) => (
              <ItemRow key={it.id} item={it} now={now} look={looks.get(it.planId)} onToggle={toggle(it.id)} variant="plain" testID={`item-${it.text}`} />
            ))}
          </View>
        </>
      ) : null}

      {day.ongoing.length > 0 ? (
        <>
          <SectionTitle right={`${day.ongoing.length}`}>ONGOING</SectionTitle>
          <View style={styles.list}>
            {day.ongoing.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                now={now}
                look={looks.get(it.planId)}
                onToggle={toggle(it.id)}
                variant="plain"
                extra={`until ${dayLabel(lastDay(it.end), year)}`}
                testID={`item-${it.text}`}
              />
            ))}
          </View>
        </>
      ) : null}

      {nothingToday ? (
        <Card style={{ marginTop: S.xl }}>
          <Text style={styles.cardTitle}>A free day</Text>
          <Empty>
            {upcoming
              ? `Next up ${relativeDay(wallDate(upcoming.start), today)}: ${upcoming.text}`
              : 'Your plans have nothing left to schedule.'}
          </Empty>
        </Card>
      ) : null}

      {late.length > 0 ? (
        <>
          <SectionTitle color={C.danger} right={`${late.reduce((n, g) => n + g.count, 0)}`}>MISSED</SectionTitle>
          <View style={styles.list}>
            {late.slice(0, 20).map((g) => (
              <ItemRow
                key={`${g.planId}-${g.text}`}
                item={g.last}
                now={now}
                look={looks.get(g.planId)}
                onToggle={toggle(g.last.id)}
                highlight="missed"
                extra={g.count > 1 ? `missed ${g.count}×, latest shown` : undefined}
              />
            ))}
          </View>
          {late.length > 20 ? <Empty>…and {late.length - 20} more.</Empty> : null}
        </>
      ) : null}
    </ScrollView>
  );
}

const FOCUS_LABEL: Record<Focus['kind'], string> = { now: 'RIGHT NOW', next: 'UP NEXT', todo: 'NEXT TO DO' };

function FocusCard({ focus, now, look, onToggle }: { focus: Focus; now: string; look?: PlanLook; onToggle: () => void }) {
  const { item, kind } = focus;
  const color = kind === 'now' ? C.now : kind === 'next' ? C.accent : C.warn;
  const when = item.timed
    ? kind === 'now'
      ? `${timeRange(item)}  ·  ends in ${untilLabel(minutesBetween(now, item.end))}`
      : `${timeRange(item)}  ·  starts in ${untilLabel(minutesBetween(now, item.start))}`
    : item.timing || 'Today';
  return (
    <Card accent={color} style={{ marginTop: S.lg }}>
      <Text style={[styles.focusKicker, { color }]}>{FOCUS_LABEL[kind]}</Text>
      <Text style={styles.focusText}>{item.text}</Text>
      {item.notes ? <Text style={styles.focusNotes}>{item.notes}</Text> : null}
      <Text style={styles.focusWhen}>{when}</Text>
      <PlanTag look={look} />
      <Pressable onPress={onToggle} accessibilityRole="button" style={[styles.focusBtn, { borderColor: color }]}>
        <Text style={[styles.focusBtnText, { color }]}>{item.doneAt ? 'Done ✓  (tap to undo)' : 'Mark done'}</Text>
      </Pressable>
    </Card>
  );
}

function NoPlans({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={styles.big}>予定</Text>
      <Text style={styles.h1}>No plans yet</Text>
      <Text style={styles.centerText}>
        Ask any AI for a plan in Yotei's JSON format, paste it in, and Yotei shows you what to do today, this week and
        this year.
      </Text>
      <Button label="Add a plan" onPress={onAdd} testID="empty-add" style={{ alignSelf: 'stretch' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120 },
  kicker: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  h1: { color: C.text, fontSize: 26, fontWeight: '700', marginTop: 2 },
  sub: { color: C.dim, fontSize: 13, marginTop: 4 },
  list: { gap: S.sm },
  cardTitle: { color: C.text, fontSize: 16, fontWeight: '600' },
  focusKicker: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  focusText: { color: C.text, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  focusNotes: { color: C.dim, fontSize: 14, lineHeight: 20 },
  focusWhen: { color: C.text, fontSize: 14 },
  focusBtn: { marginTop: S.sm, borderWidth: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  focusBtnText: { fontSize: 15, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: S.xl, gap: S.md },
  big: { color: C.accent, fontSize: 44, fontWeight: '700' },
  centerText: { color: C.dim, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: S.sm },
});
