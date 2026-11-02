import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NoTimeLimitError, addDays, deviceTimeZone, isValidDate, isValidTime, resolvePlan, wallDate } from '@yotei/core';
import { useYotei, useYoteiApi } from '../state/context';
import { Button, SectionTitle } from '../components/ui';
import { dayLabel, lastDay, whenLabel } from '../format';
import { C, S } from '../theme';

/**
 * The coverage report: what Yotei kept (each beside the planner words that date it),
 * what it dropped and why, and what it could not place. Nothing is saved until the
 * user confirms.
 */
export function ReviewScreen() {
  const api = useYoteiApi();
  const draft = useYotei((s) => s.draft);
  const deviceRejected = useYotei((s) => s.deviceRejected);
  const startDate = useYotei((s) => s.startDate);
  const startTime = useYotei((s) => s.startTime);
  const text = useYotei((s) => s.importText);
  const now = useYotei((s) => s.now);

  const preview = useMemo(() => {
    if (!draft || !isValidDate(startDate)) return null;
    try {
      let n = 0;
      return resolvePlan(draft, {
        startDate,
        startTime: isValidTime(startTime) ? startTime : '00:00',
        timezone: deviceTimeZone(),
        sourceMd: text,
        makeId: () => `preview-${n++}`,
        nowIso: '',
      });
    } catch (e) {
      return { error: e instanceof NoTimeLimitError ? e.message : e instanceof Error ? e.message : String(e) };
    }
  }, [draft, startDate, startTime, text]);

  if (!draft) return null;
  const planGivesStart = !!draft.startDate;
  const isHourPlan = draft.horizon?.unit === 'hour';
  const rejected = [...draft.rejected, ...deviceRejected];
  const year = now.slice(0, 4);

  return (
    <ScrollView contentContainerStyle={styles.wrap} testID="review-screen">
      <Text style={styles.h1}>{draft.title}</Text>
      <Text style={styles.limit}>Time limit, in the planner's words: “{draft.boundaryQuote}”</Text>

      <SectionTitle>START</SectionTitle>
      {planGivesStart ? (
        <Text style={styles.p}>The planner sets its own start: {dayLabel(draft.startDate as string, year)}.</Text>
      ) : (
        <>
          <Text style={styles.p}>The planner counts from day 1 but gives no calendar date. When do you start?</Text>
          <View style={styles.row}>
            <Button label="−1 day" tone="plain" onPress={() => api.getState().setStartDate(addDays(startDate, -1))} />
            <TextInput
              testID="start-date"
              value={startDate}
              onChangeText={(t) => api.getState().setStartDate(t)}
              style={styles.dateInput}
              autoCorrect={false}
            />
            <Button label="+1 day" tone="plain" onPress={() => api.getState().setStartDate(addDays(startDate, 1))} />
          </View>
          {isValidDate(startDate) ? <Text style={styles.hint}>{dayLabel(startDate, year)}</Text> : <Text style={styles.bad}>Use YYYY-MM-DD</Text>}
        </>
      )}
      {isHourPlan ? (
        <View style={styles.row}>
          <Text style={styles.p}>Hour 1 starts at</Text>
          <TextInput
            value={startTime}
            onChangeText={(t) => api.getState().setStartTime(t)}
            style={styles.dateInput}
            autoCorrect={false}
          />
        </View>
      ) : null}

      {preview && 'error' in preview ? <Text style={styles.bad}>{preview.error}</Text> : null}

      {preview && 'plan' in preview ? (
        <>
          <Text style={styles.summary}>
            {preview.items.length} tasks · {dayLabel(wallDate(preview.plan.start), year)} – {dayLabel(lastDay(preview.plan.end), year)}
          </Text>

          <SectionTitle color={C.accent}>KEPT ({preview.items.length})</SectionTitle>
          {preview.items.map((it) => (
            <View key={it.id} style={styles.kept}>
              <Text style={styles.itemText}>{it.text}</Text>
              <Text style={styles.meta}>
                {whenLabel(it, now)}  ·  from “{it.periodQuote}”
              </Text>
            </View>
          ))}

          <Problems
            title="NOT PLACED"
            hint="The planner's timing for these falls outside its own limit or can't be read."
            list={preview.problems}
          />
        </>
      ) : null}

      <Problems title="DROPPED" hint="Not word-for-word in the planner, so Yotei won't show them." list={rejected} />
      <Problems title="UNSCHEDULED" hint="In the planner, but it never says when." list={draft.unscheduled} />
      {draft.unassignedLines.length > 0 ? (
        <>
          <SectionTitle color={C.warn}>NOT PICKED UP ({draft.unassignedLines.length})</SectionTitle>
          <Text style={styles.hint}>Planner lines that look like tasks but weren't structured. Check them against your planner.</Text>
          {draft.unassignedLines.map((l, i) => (
            <Text key={i} style={styles.problem}>• {l}</Text>
          ))}
        </>
      ) : null}

      <View style={[styles.row, { marginTop: S.xl }]}>
        <Button label="Discard" tone="plain" onPress={() => api.getState().discardDraft()} style={{ flex: 1 }} />
        <Button
          label="Save plan"
          onPress={() => void api.getState().saveDraft()}
          disabled={!preview || 'error' in preview || preview.items.length === 0}
          testID="save-plan"
          style={{ flex: 2 }}
        />
      </View>
    </ScrollView>
  );
}

function Problems({ title, hint, list }: { title: string; hint: string; list: { quote: string; reason: string }[] }) {
  if (list.length === 0) return null;
  return (
    <>
      <SectionTitle color={C.danger}>
        {title} ({list.length})
      </SectionTitle>
      <Text style={styles.hint}>{hint}</Text>
      {list.map((r, i) => (
        <Text key={i} style={styles.problem}>
          • {r.quote}  <Text style={styles.reason}>({r.reason})</Text>
        </Text>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 120, gap: S.sm },
  h1: { color: C.text, fontSize: 22, fontWeight: '700' },
  limit: { color: C.accent, fontSize: 13 },
  p: { color: C.text, fontSize: 14, lineHeight: 20 },
  hint: { color: C.dim, fontSize: 12 },
  bad: { color: C.danger, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  dateInput: {
    // flexBasis 0 + minWidth 0: let the field shrink so both +/- buttons stay on screen.
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    backgroundColor: C.surface,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 8,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    fontSize: 15,
    textAlign: 'center',
  },
  summary: { color: C.text, fontSize: 15, fontWeight: '600', marginTop: S.md },
  kept: { backgroundColor: C.surface, borderRadius: 8, padding: S.md, gap: 3 },
  itemText: { color: C.text, fontSize: 14, lineHeight: 20 },
  meta: { color: C.dim, fontSize: 12 },
  problem: { color: C.text, fontSize: 13, lineHeight: 19 },
  reason: { color: C.dim },
});
