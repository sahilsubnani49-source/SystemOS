import React from 'react';
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, RankColors, withAlpha } from '../../core/theme';
import { Quest } from '../../domain/models/Quest';
import { useCountdownSeconds, formatDuration, EFFORT_SECONDS } from '../hooks/useElapsed';

// Difficulty → human estimate of effort. The engine encodes this; we surface it.
const EFFORT: Record<string, string> = {
  E: '~15 min',
  D: '~30 min',
  C: '~1 hour',
  B: 'Half-day',
  A: 'Full day',
  S: 'Multi-day',
};

interface Props {
  quest: Quest | null;
  onClose: () => void;
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  completing?: boolean;
}

export function QuestDetailModal({ quest, onClose, onAccept, onComplete, completing = false }: Props) {
  // Hooks must run unconditionally — compute the countdown even when quest is null.
  const remaining = useCountdownSeconds(
    quest && !quest.isCompleted ? quest.acceptedAt : null,
    quest ? EFFORT_SECONDS[quest.difficulty] ?? 3600 : 0,
  );
  if (!quest) return null;
  const accent = RankColors[quest.difficulty] ?? Colors.primary;
  const isActive = !quest.isCompleted && !!quest.acceptedAt;
  const overdue = isActive && remaining === 0;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.panel, { borderColor: withAlpha(accent, 0.5) }, Shadow.glow(accent)]}>
          {/* System window header */}
          <View style={[styles.headerBar, { borderBottomColor: withAlpha(accent, 0.35) }]}>
            <Text style={styles.headerText}>[ QUEST DETAIL ]</Text>
            <Text style={[styles.rankTag, { color: accent }]}>{quest.difficulty}-RANK</Text>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{quest.title}</Text>

            <View style={styles.chips}>
              <Chip label={quest.category} />
              <Chip label={EFFORT[quest.difficulty] ?? '—'} />
              {quest.isCompleted && <Chip label="CLEARED" color={Colors.success} />}
            </View>

            {isActive && (
              <View
                style={[
                  styles.timerBox,
                  { borderColor: withAlpha(overdue ? Colors.error : accent, 0.4) },
                ]}
              >
                <Text style={styles.timerLabel}>{overdue ? "TIME'S UP" : 'TIME REMAINING'}</Text>
                <Text style={[styles.timerValue, { color: overdue ? Colors.error : accent }]}>
                  ⏱ {formatDuration(remaining)}
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>OBJECTIVE</Text>
            <Text style={styles.description}>
              {quest.description?.trim()
                ? quest.description
                : 'No further briefing provided. Carry out the task named above.'}
            </Text>

            <View style={styles.divider} />

            <View style={styles.rewardRow}>
              <Reward label="XP" value={`+${quest.xpReward}`} color={Colors.accent} />
              <Reward label="GOLD" value={`+${quest.goldReward}`} color={Colors.warning} />
            </View>
          </ScrollView>

          {!quest.isCompleted &&
            (quest.acceptedAt
              ? onComplete && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.completeBtn,
                      { backgroundColor: accent },
                      (pressed || completing) && styles.btnPressed,
                    ]}
                    onPress={() => onComplete(quest.id)}
                    disabled={completing}
                  >
                    <Text style={styles.completeText}>
                      {completing ? 'COMPLETING…' : 'COMPLETE QUEST'}
                    </Text>
                  </Pressable>
                )
              : onAccept && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.acceptBtn,
                      { borderColor: accent },
                      pressed && styles.btnPressed,
                    ]}
                    onPress={() => onAccept(quest.id)}
                  >
                    <Text style={[styles.acceptText, { color: accent }]}>ACCEPT QUEST</Text>
                  </Pressable>
                ))}

          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && styles.btnPressed]}
            onPress={onClose}
          >
            <Text style={styles.closeText}>CLOSE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <View style={[styles.chip, color ? { borderColor: withAlpha(color, 0.5) } : null]}>
      <Text style={[styles.chipText, color ? { color } : null]}>{label}</Text>
    </View>
  );
}

function Reward({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.reward}>
      <Text style={[styles.rewardValue, { color }]}>{value}</Text>
      <Text style={styles.rewardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: withAlpha('#000000', 0.82),
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  panel: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    borderWidth: 1,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    backgroundColor: Colors.surface,
  },
  headerText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
  },
  rankTag: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1.5,
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    marginTop: Spacing.md,
  },
  description: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.md,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  reward: {
    alignItems: 'flex-start',
  },
  rewardValue: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
  },
  rewardLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    marginTop: 2,
  },
  timerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  timerLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
  },
  timerValue: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
    fontVariant: ['tabular-nums'],
  },
  completeBtn: {
    margin: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  completeText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1.5,
  },
  acceptBtn: {
    margin: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  acceptText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1.5,
  },
  btnPressed: {
    opacity: 0.7,
  },
  closeBtn: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  closeText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1.5,
  },
});
