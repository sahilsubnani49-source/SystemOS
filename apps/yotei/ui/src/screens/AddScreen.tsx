import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  PLAN_PROMPT,
  addDays,
  deviceTimeZone,
  isValidDate,
  parsePlanJson,
  resolvePlan,
  wallDate,
  weekday,
  type Issue,
} from '@yotei/core';
import { useYotei, useYoteiApi } from '../state/context';
import { Button, Card, SectionTitle } from '../components/ui';
import { dayLabel, lastDay, whenLabel } from '../format';
import { pickPlanFile } from '../pickFile';
import { C, MONO, S } from '../theme';

const PREVIEW_ITEMS = 8;

/** Copy the prompt into any AI, paste its JSON back, check it, pick a start, save. */
export function AddScreen() {
  const api = useYoteiApi();
  const text = useYotei((s) => s.draftText);
  const name = useYotei((s) => s.draftName);
  const startDate = useYotei((s) => s.startDate);
  const now = useYotei((s) => s.now);
  const [showPrompt, setShowPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parsePlanJson(text), [text]);
  const preview = useMemo(() => {
    if (!parsed.spec || (!parsed.spec.start && !isValidDate(startDate))) return null;
    try {
      let n = 0;
      return resolvePlan(parsed.spec, {
        startDate,
        timezone: deviceTimeZone(),
        source: text,
        makeId: () => `preview-${n++}`,
        nowIso: '',
      });
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [parsed, startDate, text]);

  const fail = (what: string, e: unknown) => api.setState({ error: `${what}: ${e instanceof Error ? e.message : String(e)}` });

  const copyPrompt = async () => {
    try {
      await Clipboard.setStringAsync(PLAN_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      fail('Could not copy', e);
    }
  };
  const sharePrompt = () => void Share.share({ message: PLAN_PROMPT }).catch((e) => fail('Could not share', e));
  const paste = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip.trim()) api.getState().setDraftText(clip, null);
      else api.setState({ error: 'The clipboard is empty. Copy the AI’s reply first.' });
    } catch (e) {
      fail('Could not paste', e);
    }
  };
  const pick = async () => {
    try {
      const file = await pickPlanFile();
      if (file) api.getState().setDraftText(file.text, file.name);
    } catch (e) {
      fail('Could not open that file', e);
    }
  };
  const save = async () => {
    setSaving(true);
    await api.getState().savePlan();
    setSaving(false);
  };

  const today = wallDate(now);
  const year = today.slice(0, 4);
  const nextMonday = addDays(today, ((8 - weekday(today)) % 7) || 7);
  const ok = preview && !('error' in preview) ? preview : null;
  const skipped: Issue[] = [...parsed.skipped, ...(ok?.skipped ?? [])];

  return (
    <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled" testID="add-screen">
      <Text style={styles.h1}>Add a plan</Text>
      <Text style={styles.p}>
        Yotei reads plans written as JSON. Ask any AI to write one, paste the reply here, and Yotei puts every task on
        your calendar.
      </Text>

      <Step n={1} title="Ask any AI">
        <Text style={styles.p}>
          Copy the prompt, fill in your goal, and send it to ChatGPT, Claude, Gemini, or any assistant you like.
        </Text>
        <View style={styles.row}>
          <Button label={copied ? 'Copied ✓' : 'Copy prompt'} onPress={copyPrompt} testID="copy-prompt" style={{ flex: 1 }} />
          <Button label="Share…" tone="plain" onPress={sharePrompt} style={{ flex: 1 }} />
        </View>
        <Pressable onPress={() => setShowPrompt(!showPrompt)} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.link}>{showPrompt ? '▾ Hide the prompt' : '▸ Show the prompt and format'}</Text>
        </Pressable>
        {showPrompt ? (
          <Text selectable style={styles.code}>{PLAN_PROMPT}</Text>
        ) : null}
      </Step>

      <Step n={2} title="Paste the reply">
        <View style={styles.row}>
          <Button label="Paste" tone="plain" small onPress={paste} testID="paste" style={{ flex: 1 }} />
          <Button label="Open .json" tone="plain" small onPress={pick} testID="pick-file" style={{ flex: 1 }} />
          {text ? (
            <Button label="Clear" tone="plain" small onPress={() => api.getState().setDraftText('')} style={{ flex: 1 }} />
          ) : null}
        </View>
        {name ? <Text style={styles.file}>📄 {name}</Text> : null}
        <TextInput
          testID="plan-input"
          value={text}
          onChangeText={(t) => api.getState().setDraftText(t, name)}
          multiline
          placeholder={'Paste the whole reply. Yotei finds the JSON in it.\n\n{\n  "title": "…",\n  "duration": { "weeks": 12 },\n  "tasks": [ … ]\n}'}
          placeholderTextColor={C.faint}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          spellCheck={false}
          textAlignVertical="top"
        />
        <Status text={text} parsed={parsed} />
      </Step>

      {parsed.spec ? (
        <Step n={3} title="When does it start?">
          {parsed.spec.start ? (
            <Text style={styles.p}>The plan starts {dayLabel(parsed.spec.start, year)}, as it says.</Text>
          ) : (
            <>
              <View style={styles.row}>
                {[
                  ['Today', today],
                  ['Tomorrow', addDays(today, 1)],
                  ['Next Mon', nextMonday],
                ].map(([label, date]) => (
                  <Chip key={label} label={label as string} on={startDate === date} onPress={() => api.getState().setStartDate(date as string)} />
                ))}
              </View>
              <TextInput
                testID="start-date"
                value={startDate}
                onChangeText={(t) => api.getState().setStartDate(t.trim())}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={C.faint}
                style={[styles.dateInput, !isValidDate(startDate) && { borderColor: C.danger }]}
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
              />
              {!isValidDate(startDate) ? <Text style={styles.err}>Write the date as YYYY-MM-DD.</Text> : null}
            </>
          )}
        </Step>
      ) : null}

      {preview && 'error' in preview ? <Text style={styles.err}>{preview.error}</Text> : null}

      {ok ? (
        <>
          <Card style={{ marginTop: S.lg }}>
            <Text style={styles.previewTitle}>{ok.plan.title}</Text>
            <Text style={styles.p}>
              {dayLabel(wallDate(ok.plan.start), year)} – {dayLabel(lastDay(ok.plan.end), year)}  ·  {ok.plan.limit}  ·{' '}
              {ok.items.length.toLocaleString()} dated task{ok.items.length === 1 ? '' : 's'}
            </Text>
            <View style={{ gap: 6, marginTop: S.xs }}>
              {ok.items.slice(0, PREVIEW_ITEMS).map((it) => (
                <View key={it.id} style={styles.previewRow}>
                  <Text style={styles.previewWhen}>{whenLabel(it, now)}</Text>
                  <Text style={styles.previewText} numberOfLines={2}>{it.text}</Text>
                </View>
              ))}
              {ok.items.length > PREVIEW_ITEMS ? (
                <Text style={styles.faint}>…and {(ok.items.length - PREVIEW_ITEMS).toLocaleString()} more</Text>
              ) : null}
            </View>
          </Card>
          <Button
            label={saving ? 'Saving…' : skipped.length ? `Save plan (skip ${skipped.length})` : 'Save plan'}
            onPress={() => void save()}
            disabled={saving || ok.items.length === 0}
            testID="save-plan"
            style={{ marginTop: S.lg }}
          />
        </>
      ) : null}

      {skipped.length > 0 ? (
        <IssueList title={`SKIPPED (${skipped.length})`} color={C.warn} issues={skipped} />
      ) : null}
      {parsed.warnings.length > 0 ? <IssueList title="IGNORED FIELDS" color={C.dim} issues={parsed.warnings} /> : null}
    </ScrollView>
  );
}

function Status({ text, parsed }: { text: string; parsed: ReturnType<typeof parsePlanJson> }) {
  if (!text.trim()) return null;
  if (parsed.spec) {
    return (
      <Text style={styles.okText}>
        ✓ Valid plan  ·  {parsed.spec.tasks.length} task{parsed.spec.tasks.length === 1 ? '' : 's'}
      </Text>
    );
  }
  return (
    <View style={{ gap: 4 }}>
      {parsed.errors.map((e, i) => (
        <Text key={i} style={styles.err}>
          {e.path ? <Text style={styles.path}>{e.path}: </Text> : null}
          {e.message}
        </Text>
      ))}
    </View>
  );
}

function IssueList({ title, color, issues }: { title: string; color: string; issues: Issue[] }) {
  return (
    <>
      <SectionTitle color={color}>{title}</SectionTitle>
      <View style={{ gap: 6 }}>
        {issues.slice(0, 50).map((s, i) => (
          <Text key={i} style={styles.issue}>
            <Text style={styles.path}>{s.path}  </Text>
            {s.message}
          </Text>
        ))}
      </View>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card style={{ marginTop: S.lg }}>
      <View style={styles.stepHead}>
        <View style={styles.stepNum}>
          <Text style={styles.stepNumText}>{n}</Text>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[styles.chip, on && { borderColor: C.accent, backgroundColor: C.surface2 }]}
    >
      <Text style={[styles.chipText, on && { color: C.accent }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: S.lg, paddingBottom: 140 },
  h1: { color: C.text, fontSize: 26, fontWeight: '700' },
  p: { color: C.dim, fontSize: 14, lineHeight: 20, marginTop: 4 },
  row: { flexDirection: 'row', gap: S.sm, alignItems: 'center', flexWrap: 'wrap' },
  link: { color: C.accent, fontSize: 13, fontWeight: '600', marginTop: S.xs },
  code: {
    color: C.text,
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 16,
    backgroundColor: C.bg,
    borderRadius: 8,
    padding: S.md,
  },
  file: { color: C.text, fontSize: 13 },
  input: {
    minHeight: 200,
    maxHeight: 360,
    backgroundColor: C.bg,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 10,
    color: C.text,
    padding: S.md,
    fontSize: 12,
    fontFamily: MONO,
  },
  okText: { color: C.accent, fontSize: 14, fontWeight: '600' },
  err: { color: C.danger, fontSize: 13, lineHeight: 18 },
  path: { fontFamily: MONO, color: C.dim, fontSize: 12 },
  issue: { color: C.text, fontSize: 13, lineHeight: 18 },
  stepHead: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: C.bg, fontWeight: '800', fontSize: 13 },
  stepTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  chip: { borderWidth: 1, borderColor: C.line, borderRadius: 18, paddingVertical: 7, paddingHorizontal: S.md },
  chipText: { color: C.text, fontSize: 13, fontWeight: '600' },
  dateInput: {
    backgroundColor: C.bg,
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 10,
    color: C.text,
    paddingHorizontal: S.md,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: MONO,
  },
  previewTitle: { color: C.text, fontSize: 18, fontWeight: '700' },
  previewRow: { flexDirection: 'row', gap: S.md },
  previewWhen: { color: C.dim, fontSize: 12, width: 120 },
  previewText: { color: C.text, fontSize: 13, flex: 1 },
  faint: { color: C.faint, fontSize: 12 },
});
