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
import { Goal } from '../../domain/models/Goal';
import { MAX_DESCRIPTION_CHARS } from '../../data/services/CampaignTaskService';
import { StartTimerInput } from '../stores/useTimeLogStore';

interface Props {
  visible: boolean;
  /** Active campaigns — capped at 3 by MAX_CAMPAIGNS, so plain chips suffice. */
  goals: Goal[];
  onStart: (input: StartTimerInput) => Promise<void>;
  onClose: () => void;
}

function chipLabel(title: string): string {
  return title.length > 14 ? `${title.slice(0, 13)}…` : title;
}

/**
 * Start sheet for the focus timer: tag a campaign, or describe the task yourself.
 * Tagging is enough on its own — the System supplies the line from the campaign and
 * the quest the Hunter accepted today.
 */
export function TimerStartModal({ visible, goals, onStart, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Remount on open for fresh form state, rather than effect-driven resets. */}
      <TimerStartPanel
        key={visible ? 'open' : 'closed'}
        goals={goals}
        onStart={onStart}
        onClose={onClose}
      />
    </Modal>
  );
}

function TimerStartPanel({ goals, onStart, onClose }: Omit<Props, 'visible'>) {
  const [goalId, setGoalId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // A tagged campaign supplies its own description, so text is only mandatory
  // when the Hunter is logging untracked work.
  const canStart = goalId !== null || description.trim().length > 0;

  const handleStart = async () => {
    setSubmitting(true);
    try {
      await onStart({ description, goalId });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.panel}>
        <Text style={styles.header}>[ ENGAGE TIMER ]</Text>

        <Text style={styles.sectionLabel}>CAMPAIGN</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              goalId === null && styles.chipActive,
              pressed && styles.pressed,
            ]}
            onPress={() => setGoalId(null)}
          >
            <Text style={[styles.chipText, goalId === null && styles.chipTextActive]}>NONE</Text>
          </Pressable>

          {goals.map((g) => {
            const active = goalId === g.id;
            return (
              <Pressable
                key={g.id}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => setGoalId(g.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {chipLabel(g.title)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>TASK</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={MAX_DESCRIPTION_CHARS}
          placeholder={goalId ? 'Optional — the System will fill this in' : 'What are you doing?'}
          placeholderTextColor={Colors.textSecondary}
        />

        {!canStart && <Text style={styles.hint}>Tag a campaign or describe the task.</Text>}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            (!canStart || submitting) && styles.buttonDisabled,
            pressed && canStart && !submitting && styles.pressed,
          ]}
          onPress={handleStart}
          disabled={!canStart || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Text style={styles.buttonText}>START</Text>
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
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: withAlpha(Colors.textSecondary, 0.4),
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: withAlpha(Colors.primary, 0.15),
  },
  chipText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textPrimary,
  },
  input: {
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
