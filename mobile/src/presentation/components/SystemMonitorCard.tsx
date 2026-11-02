import React, { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Shadow, Spacing } from '../../core/theme';
import { MONITOR_DURATIONS, useMonitorStore } from '../stores/useMonitorStore';
import { DiagnosticsModal } from './DiagnosticsModal';
import { useSystemDialog } from './SystemDialog';

function remaining(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  return h < 48 ? `${h}h ${mins % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

/**
 * Settings → SYSTEM MONITOR. Records technical-health logs (API calls, errors,
 * crashes, timeline/timer/sync events, Kotodama) only during a window the Hunter
 * opens here, then lets them read or export what was recorded.
 */
export function SystemMonitorCard() {
  const activeUntil = useMonitorStore((s) => s.activeUntil);
  const counts = useMonitorStore((s) => s.counts);
  const busy = useMonitorStore((s) => s.busy);
  const systemAlert = useSystemDialog();
  const [logsOpen, setLogsOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Refresh the countdown and event count while recording (cheap: one COUNT query).
  useEffect(() => {
    void useMonitorStore.getState().refresh();
    if (activeUntil === null) return;
    const t = setInterval(() => {
      setNow(Date.now());
      void useMonitorStore.getState().refresh();
    }, 15_000);
    return () => clearInterval(t);
  }, [activeUntil]);

  const recording = activeUntil !== null && activeUntil > now;
  const total = counts.debug + counts.info + counts.warn + counts.error;

  const handleExport = async () => {
    const text = await useMonitorStore.getState().exportText();
    await Share.share({ message: text, title: 'SystemOS logs' }).catch(() => {});
  };

  const handleClear = () =>
    systemAlert('[Warning]', 'Delete every recorded log? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void useMonitorStore.getState().clear(),
      },
    ]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>System Monitor</Text>
      <Text style={styles.sectionDesc}>
        Records technical logs (API calls, errors, crashes, timers, Kotodama) only for the time you
        allow. Never tokens, passwords or your own text. Logs stay on this device until you export
        them.
      </Text>

      <Text style={[styles.status, recording ? styles.statusOn : null]}>
        {recording ? `● RECORDING · ${remaining((activeUntil ?? now) - now)} left` : '○ OFF'}
        {`  ·  ${total} event${total === 1 ? '' : 's'}`}
        {counts.error > 0 ? `  ·  ${counts.error} error${counts.error === 1 ? '' : 's'}` : ''}
      </Text>

      {recording ? (
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnStop, (pressed || busy) && styles.dim]}
          onPress={() => void useMonitorStore.getState().stop()}
          disabled={busy}
          accessibilityRole="button"
        >
          <Text style={styles.btnText}>STOP RECORDING</Text>
        </Pressable>
      ) : (
        <View style={styles.row}>
          {MONITOR_DURATIONS.map((d) => (
            <Pressable
              key={d.label}
              style={({ pressed }) => [styles.chip, (pressed || busy) && styles.dim]}
              onPress={() => void useMonitorStore.getState().start(d.ms)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel={`Record logs for ${d.label}`}
            >
              <Text style={styles.chipText}>{d.label}</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.row}>
        <Pressable
          style={styles.linkBtn}
          onPress={() => setLogsOpen(true)}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>VIEW LOGS</Text>
        </Pressable>
        <Pressable
          style={[styles.linkBtn, total === 0 && styles.dim]}
          onPress={handleExport}
          disabled={total === 0}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>EXPORT</Text>
        </Pressable>
        <Pressable
          style={[styles.linkBtn, total === 0 && styles.dim]}
          onPress={handleClear}
          disabled={total === 0}
          accessibilityRole="button"
        >
          <Text style={[styles.linkText, { color: Colors.error }]}>CLEAR</Text>
        </Pressable>
      </View>

      <DiagnosticsModal
        visible={logsOpen}
        onClose={() => {
          setLogsOpen(false);
          void useMonitorStore.getState().refresh();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 0.5,
  },
  sectionDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  status: { color: Colors.textSecondary, fontFamily: Fonts.pixel, fontSize: FontSize.xs },
  statusOn: { color: Colors.success ?? Colors.primary },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderColor: Colors.primary,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipText: { color: Colors.primary, fontFamily: Fonts.pixel, fontSize: FontSize.xs },
  btn: { borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  btnStop: { backgroundColor: Colors.error },
  btnText: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  linkBtn: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  linkText: { color: Colors.primary, fontFamily: Fonts.pixel, fontSize: FontSize.xs },
  dim: { opacity: 0.5 },
});
