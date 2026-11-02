import React, { useEffect } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize, Fonts, Radius, Spacing } from '../../core/theme';
import { useMonitorStore } from '../stores/useMonitorStore';
import type { DiagnosticEvent, DiagnosticLevel } from '../../domain/models/DiagnosticEvent';

const FILTERS: { label: string; level: DiagnosticLevel }[] = [
  { label: 'ALL', level: 'debug' },
  { label: 'WARN+', level: 'warn' },
  { label: 'ERROR', level: 'error' },
];

const LEVEL_COLOR: Record<DiagnosticLevel, string> = {
  debug: Colors.textSecondary,
  info: Colors.primary,
  warn: '#FFB347',
  error: Colors.error,
};

function EventRow({ e }: { e: DiagnosticEvent }) {
  const time = new Date(e.at).toLocaleTimeString();
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={[styles.level, { color: LEVEL_COLOR[e.level] }]}>{e.level.toUpperCase()}</Text>
        <Text style={styles.meta}>
          {time} · {e.category}
        </Text>
      </View>
      <Text style={styles.message}>{e.message}</Text>
      {e.data && Object.keys(e.data).length > 0 ? (
        <Text style={styles.data}>{JSON.stringify(e.data)}</Text>
      ) : null}
    </View>
  );
}

/** The newest System Monitor events, filterable by severity. */
export function DiagnosticsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const events = useMonitorStore((s) => s.events);
  const filter = useMonitorStore((s) => s.filter);

  useEffect(() => {
    if (visible) void useMonitorStore.getState().loadEvents();
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>SYSTEM LOGS</Text>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={12}>
            <Text style={styles.close}>CLOSE</Text>
          </Pressable>
        </View>
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.level}
              onPress={() => void useMonitorStore.getState().setFilter(f.level)}
              style={[styles.chip, filter === f.level && styles.chipOn]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, filter === f.level && styles.chipTextOn]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <FlatList
          data={events}
          keyExtractor={(e, i) => String(e.id ?? i)}
          renderItem={({ item }) => <EventRow e={item} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No events recorded.</Text>}
          ListFooterComponent={
            events.length >= 200 ? (
              <Text style={styles.empty}>Newest 200 shown. EXPORT has more.</Text>
            ) : null
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  title: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  close: { color: Colors.primary, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  filters: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg },
  chip: {
    borderColor: Colors.surfaceBorder,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  chipText: { color: Colors.textSecondary, fontFamily: Fonts.pixel, fontSize: FontSize.xs },
  chipTextOn: { color: Colors.primary },
  list: { padding: Spacing.lg, gap: Spacing.sm },
  row: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm, gap: 4 },
  rowHead: { flexDirection: 'row', justifyContent: 'space-between' },
  level: { fontFamily: Fonts.pixel, fontSize: FontSize.xs },
  meta: { color: Colors.textSecondary, fontFamily: Fonts.pixel, fontSize: FontSize.xs },
  message: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 14,
  },
  // Monospace-ish system font: JSON in a pixel face is unreadable.
  data: { color: Colors.textSecondary, fontSize: 11, lineHeight: 15 },
  empty: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});
