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
import { MAX_SESSION_MINUTES } from '../stores/useTaskLogStore';

interface Props {
  visible: boolean;
  taskName: string;
  /** Called with total whole minutes (> 0) and the trimmed note. */
  onLog: (minutes: number, note: string) => Promise<void>;
  onClose: () => void;
}

/** Log-time sheet for the Hunter Log: hours + minutes typed by hand, plus a note. */
export function LogTimeModal({ visible, taskName, onLog, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Remount on open for fresh form state, rather than effect-driven resets. */}
      <LogTimePanel
        key={visible ? 'open' : 'closed'}
        taskName={taskName}
        onLog={onLog}
        onClose={onClose}
      />
    </Modal>
  );
}

function toInt(text: string): number {
  const n = parseInt(text, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function LogTimePanel({ taskName, onLog, onClose }: Omit<Props, 'visible'>) {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('15');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const total = toInt(hours) * 60 + Math.min(toInt(minutes), 59);
  const tooLong = total > MAX_SESSION_MINUTES;
  const canSave = total > 0 && !tooLong && !submitting;

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onLog(total, note);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <Text style={styles.header}>[ LOG TIME ]</Text>
        <Text style={styles.taskName} numberOfLines={1}>
          {taskName}
        </Text>

        <View style={styles.fieldRow}>
          <View style={styles.field}>
            <Text style={styles.label}>HOURS</Text>
            <TextInput
              style={styles.input}
              value={hours}
              onChangeText={setHours}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>MINUTES</Text>
            <TextInput
              style={styles.input}
              value={minutes}
              onChangeText={setMinutes}
              keyboardType="number-pad"
              maxLength={2}
              selectTextOnFocus
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NOTE (OPTIONAL)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="What did you work on?"
            placeholderTextColor={Colors.textSecondary}
            maxLength={120}
          />
        </View>

        {total === 0 && <Text style={styles.hint}>Enter some time, Hunter.</Text>}
        {tooLong && (
          <Text style={styles.hint}>One session can be at most {MAX_SESSION_MINUTES / 60}h.</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            !canSave && styles.buttonDisabled,
            pressed && canSave && styles.pressed,
          ]}
          onPress={handleSave}
          disabled={!canSave}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Text style={styles.buttonText}>SAVE SESSION</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          onPress={onClose}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>CANCEL</Text>
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
    borderColor: Colors.accent,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.glow(Colors.accent),
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 2,
    textAlign: 'center',
  },
  taskName: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  field: {
    flex: 1,
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.3),
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  hint: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.warning,
  },
  button: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.accent,
  },
  cancelButton: {
    paddingVertical: Spacing.xs,
    alignItems: 'center',
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
