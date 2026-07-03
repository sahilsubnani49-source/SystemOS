import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';

interface Props {
  visible: boolean;
  /** Date string of an enforced penalty, or null when there is none to announce. */
  penaltyDate: string | null;
  onDismiss: () => void;
}

/**
 * The System's greeting window, shown once per app open while quests are pending —
 * styled after the Solo Leveling notification panel. When a penalty was enforced
 * overnight, it is announced here in red before the daily assignment.
 */
export function SystemNoticeModal({ visible, penaltyDate, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          <Text style={styles.alertIcon}>!</Text>
          <Text style={styles.header}>NOTIFICATION</Text>

          {penaltyDate && (
            <View style={styles.penaltyBox}>
              <Text style={styles.penaltyTitle}>[PENALTY]</Text>
              <Text style={styles.penaltyBody}>
                Daily quests were left incomplete. All rewards have been confiscated.
              </Text>
            </View>
          )}

          <Text style={styles.body}>
            The System has assigned you a quest.{'\n\n'}Complete it, or face the consequences.
          </Text>

          <Pressable style={styles.button} onPress={onDismiss}>
            <Text style={styles.buttonText}>ACCEPT</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
  alertIcon: {
    fontFamily: Fonts.pixel,
    fontSize: 28,
    color: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: Radius.full,
    width: 56,
    height: 56,
    textAlign: 'center',
    lineHeight: 52,
  },
  header: {
    fontFamily: Fonts.pixel,
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 2,
  },
  body: {
    fontFamily: Fonts.pixel,
    fontSize: 10,
    lineHeight: 18,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  penaltyBox: {
    backgroundColor: withAlpha(Colors.error, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.error, 0.4),
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'center',
  },
  penaltyTitle: {
    fontFamily: Fonts.pixel,
    fontSize: 11,
    color: Colors.error,
  },
  penaltyBody: {
    fontFamily: Fonts.pixel,
    fontSize: 8,
    lineHeight: 14,
    color: Colors.error,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    backgroundColor: withAlpha(Colors.accent, 0.1),
  },
  buttonText: {
    fontFamily: Fonts.pixel,
    fontSize: 12,
    color: Colors.accent,
  },
});
