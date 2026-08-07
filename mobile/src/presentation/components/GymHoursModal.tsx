import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';

interface Props {
  visible: boolean;
  /** Hours still loggable today (cap minus what's already logged). */
  remainingHours: number;
  onLog: (hours: number) => Promise<void>;
  onClose: () => void;
}

const STEP = 0.5;

/** Round to the nearest 0.5 for clean gym-hour granularity. */
function toHalf(n: number): number {
  return Math.round(n / STEP) * STEP;
}

/**
 * Gym attendance logger — Solo Leveling notification panel styling. Logs passive
 * hours in 0.5h increments, clamped to the day's remaining cap.
 */
export function GymHoursModal({ visible, remainingHours, onLog, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Keying on open/closed remounts the panel each time the modal opens, giving
          fresh picker state without effect-driven resets. */}
      <GymHoursPanel
        key={visible ? 'open' : 'closed'}
        remainingHours={remainingHours}
        onLog={onLog}
        onClose={onClose}
      />
    </Modal>
  );
}

function GymHoursPanel({ remainingHours, onLog, onClose }: Omit<Props, 'visible'>) {
  const capReached = remainingHours <= 0;
  const [hours, setHours] = useState(STEP);
  const [submitting, setSubmitting] = useState(false);

  const dec = () => setHours((h) => Math.max(STEP, toHalf(h - STEP)));
  const inc = () => setHours((h) => Math.min(toHalf(remainingHours), toHalf(h + STEP)));

  const handleLog = async () => {
    setSubmitting(true);
    try {
      await onLog(hours);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const logDisabled = submitting || capReached;

  return (
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <Text style={styles.header}>[ GYM SESSION ]</Text>

        {capReached ? (
          <Text style={styles.limitText}>[Daily limit reached.]</Text>
        ) : (
          <>
            <View style={styles.stepperRow}>
              <Pressable
                style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                onPress={dec}
                disabled={hours <= STEP}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </Pressable>
              <Text style={styles.hoursValue}>{hours}h</Text>
              <Pressable
                style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
                onPress={inc}
                disabled={hours >= toHalf(remainingHours)}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </Pressable>
            </View>
            <Text style={styles.remaining}>{remainingHours}h remaining today</Text>
          </>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            logDisabled && styles.buttonDisabled,
            pressed && !logDisabled && styles.pressed,
          ]}
          onPress={handleLog}
          disabled={logDisabled}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Text style={styles.buttonText}>LOG</Text>
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
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.glow(Colors.accent),
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontFamily: Fonts.pixel,
    fontSize: 20,
    color: Colors.accent,
  },
  hoursValue: {
    fontFamily: Fonts.pixel,
    fontSize: 24,
    color: Colors.textPrimary,
    minWidth: 90,
    textAlign: 'center',
  },
  remaining: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    lineHeight: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  limitText: {
    fontFamily: Fonts.pixel,
    fontSize: 11,
    lineHeight: 18,
    color: Colors.warning,
    textAlign: 'center',
    marginVertical: Spacing.sm,
  },
  button: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: withAlpha(Colors.accent, 0.1),
    minWidth: 140,
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
    paddingHorizontal: Spacing.lg,
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
