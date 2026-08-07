import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Fonts, FontSize, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';
import { TimeLog } from '../../domain/models/TimeLog';
import { MAX_DESCRIPTION_CHARS } from '../../data/services/CampaignTaskService';
import { computeFocusCredit, MIN_LOGGABLE_SECONDS } from '../stores/useTimeLogStore';
import { formatDuration } from '../hooks/useElapsed';
import { todayDateStr } from '../../core/dateUtils';

interface Props {
  visible: boolean;
  log: TimeLog | null;
  goalTitle: string | null;
  /** Credited seconds already banked on the log's date — drives the cap projection. */
  bankedSeconds: number;
  onConfirm: (description: string) => Promise<void>;
  onDiscard: () => Promise<void>;
  onClose: () => void;
}

/** Confirm sheet shown when a timer is stopped: review the duration, edit the line. */
export function TimerStopModal({ visible, log, ...rest }: Props) {
  if (!log) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={rest.onClose}>
      <TimerStopPanel key={visible ? 'open' : 'closed'} log={log} {...rest} />
    </Modal>
  );
}

function TimerStopPanel({
  log,
  goalTitle,
  bankedSeconds,
  onConfirm,
  onDiscard,
  onClose,
}: Omit<Props, 'visible'> & { log: TimeLog }) {
  // Frozen at mount on purpose. A number that keeps ticking inside a confirm sheet
  // means the value reviewed is not the value logged.
  const [elapsed] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(log.startedAt).getTime()) / 1000)),
  );
  const [description, setDescription] = useState(log.description);
  const [submitting, setSubmitting] = useState(false);

  const { creditedSeconds, xp, capped } = computeFocusCredit(elapsed, bankedSeconds);
  const tooShort = elapsed < MIN_LOGGABLE_SECONDS;
  const spansDays = log.date !== todayDateStr();

  const run = async (action: () => Promise<void>) => {
    setSubmitting(true);
    try {
      await action();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <Text style={styles.header}>[ SESSION COMPLETE ]</Text>

        <Text style={styles.clock}>{formatDuration(elapsed)}</Text>

        {goalTitle && (
          <View style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {goalTitle}
            </Text>
          </View>
        )}

        {tooShort ? (
          <Text style={styles.warn}>Under 5 min — nothing will be logged.</Text>
        ) : (
          <Text style={styles.xp}>
            +{xp} XP for {formatDuration(creditedSeconds)}
          </Text>
        )}

        {capped && !tooShort && <Text style={styles.warn}>Daily focus ceiling reached.</Text>}
        {spansDays && (
          <Text style={styles.note}>
            Spans into {todayDateStr()} — logged to {log.date}.
          </Text>
        )}

        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={MAX_DESCRIPTION_CHARS}
          placeholder="What did you do?"
          placeholderTextColor={Colors.textSecondary}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            submitting && styles.buttonDisabled,
            pressed && !submitting && styles.pressed,
          ]}
          onPress={() => run(() => onConfirm(description))}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.success} />
          ) : (
            <Text style={styles.buttonText}>LOG SESSION</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          onPress={() => run(onDiscard)}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>DISCARD</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.75),
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.success,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadow.glow(Colors.success),
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    color: Colors.success,
    letterSpacing: 2,
  },
  clock: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xxl,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.6),
    backgroundColor: withAlpha(Colors.primary, 0.12),
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    maxWidth: '100%',
  },
  chipText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  xp: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
    color: Colors.accent,
  },
  warn: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.warning,
    textAlign: 'center',
  },
  note: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.3),
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 18,
    minHeight: 72,
    padding: Spacing.sm,
    textAlignVertical: 'top',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.success,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: withAlpha(Colors.success, 0.12),
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    letterSpacing: 1,
    color: Colors.success,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
  },
  cancelText: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
