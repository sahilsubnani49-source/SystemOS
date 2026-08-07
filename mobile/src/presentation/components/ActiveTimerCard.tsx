import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontSize, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';
import { TimeLog } from '../../domain/models/TimeLog';
import { formatDuration, useElapsedSeconds } from '../hooks/useElapsed';

interface Props {
  log: TimeLog;
  /** Resolved by the screen from useGoalStore — null when the log is untagged. */
  goalTitle: string | null;
  stopping: boolean;
  onStop: () => void;
  /** Long-press on STOP: skip the confirm sheet and log as-is. */
  onStopImmediate: () => void;
  onCancel: () => void;
}

/** PressStart2P is very wide — a full campaign title would blow out the chip. */
function chipLabel(title: string): string {
  return title.length > 14 ? `${title.slice(0, 13)}…` : title;
}

/**
 * The live focus timer. Occupies the same slot and outer dimensions as the idle
 * FOCUS LOG card, so starting a timer causes no layout jump.
 */
export function ActiveTimerCard({
  log,
  goalTitle,
  stopping,
  onStop,
  onStopImmediate,
  onCancel,
}: Props) {
  // Derived from the persisted startedAt, so this stays correct across re-renders,
  // backgrounding, and a full app restart.
  const elapsed = useElapsedSeconds(log.startedAt);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>FOCUS LOG · RUNNING</Text>
      <Text style={styles.clock}>{formatDuration(elapsed)}</Text>

      <View style={styles.chipRow}>
        {goalTitle ? (
          <View style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {chipLabel(goalTitle)}
            </Text>
          </View>
        ) : (
          <View style={[styles.chip, styles.chipMuted]}>
            <Text style={[styles.chipText, styles.chipTextMuted]}>UNTAGGED</Text>
          </View>
        )}
      </View>

      <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
        {log.description}
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.stopBtn,
          stopping && styles.disabled,
          pressed && !stopping && styles.pressed,
        ]}
        onPress={onStop}
        onLongPress={onStopImmediate}
        disabled={stopping}
      >
        {stopping ? (
          <ActivityIndicator color={Colors.success} />
        ) : (
          <Text style={styles.stopBtnText}>STOP</Text>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
        onPress={onCancel}
        disabled={stopping}
      >
        <Text style={styles.cancelText}>DISCARD</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: withAlpha(Colors.success, 0.5),
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    ...Shadow.glow(Colors.success),
  },
  label: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.success,
  },
  clock: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xxl,
    color: Colors.accent,
    marginVertical: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.6),
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  chipMuted: {
    borderColor: withAlpha(Colors.textSecondary, 0.4),
    backgroundColor: 'transparent',
  },
  chipText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  chipTextMuted: {
    color: Colors.textSecondary,
  },
  description: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  stopBtn: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Radius.md,
    backgroundColor: withAlpha(Colors.success, 0.12),
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minWidth: 160,
    alignItems: 'center',
  },
  stopBtnText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    color: Colors.success,
  },
  cancelBtn: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  cancelText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});
