import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  Colors,
  FontSize,
  Fonts,
  Radius,
  Spacing,
  Shadow,
  RankColors,
  withAlpha,
} from '../../core/theme';
import { Quest } from '../../domain/models/Quest';
import { useCountdownSeconds, formatDuration, EFFORT_SECONDS } from '../hooks/useElapsed';

interface Props {
  quest: Quest;
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  onPress?: (quest: Quest) => void;
  /** Show the Accept → timer → Complete controls (active quests only). */
  showActions?: boolean;
  /** Campaign title shown as a small chip when multiple campaigns are active. */
  campaignLabel?: string;
}

export function QuestCard({
  quest,
  onAccept,
  onComplete,
  onPress,
  showActions = false,
  campaignLabel,
}: Props) {
  const diffColor = RankColors[quest.difficulty] ?? Colors.textSecondary;
  const remaining = useCountdownSeconds(
    quest.isCompleted ? null : quest.acceptedAt,
    EFFORT_SECONDS[quest.difficulty] ?? 3600,
  );
  const isActive = !quest.isCompleted && !!quest.acceptedAt;
  const overdue = isActive && remaining === 0;

  return (
    <View style={[styles.card, quest.isCompleted && styles.cardDone]}>
      <Pressable
        style={({ pressed }) => [styles.left, pressed && onPress && styles.leftPressed]}
        onPress={onPress ? () => onPress(quest) : undefined}
      >
        <View style={[styles.dot, quest.isCompleted ? styles.dotDone : styles.dotPending]} />
        <View style={styles.info}>
          <Text style={[styles.title, quest.isCompleted && styles.titleDone]} numberOfLines={2}>
            {quest.title}
          </Text>
          <View style={styles.meta}>
            <Text style={styles.category}>{quest.category}</Text>
            <Text style={[styles.difficulty, { color: diffColor }]}>{quest.difficulty}-Rank</Text>
            {campaignLabel ? (
              <Text style={styles.campaignChip} numberOfLines={1}>
                {campaignLabel}
              </Text>
            ) : null}
            {onPress && <Text style={styles.detailsHint}>· details ›</Text>}
          </View>
        </View>
      </Pressable>

      <View style={styles.right}>
        {isActive ? (
          <Text style={[styles.timer, overdue && styles.timerOverdue]}>
            {overdue ? '⏱ 00:00' : `⏱ ${formatDuration(remaining)}`}
          </Text>
        ) : (
          <Text style={styles.xp}>+{quest.xpReward} XP</Text>
        )}

        {showActions &&
          !quest.isCompleted &&
          (quest.acceptedAt ? (
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={() => onComplete?.(quest.id)}
            >
              <Text style={styles.btnText}>Complete</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.acceptBtn, pressed && styles.btnPressed]}
              onPress={() => onAccept?.(quest.id)}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Shadow.card,
  },
  cardDone: {
    borderColor: withAlpha(Colors.primary, 0.27),
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  leftPressed: {
    opacity: 0.6,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  dotPending: {
    borderColor: Colors.textSecondary,
    backgroundColor: 'transparent',
  },
  dotDone: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    lineHeight: 18,
  },
  titleDone: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  meta: {
    flexDirection: 'row',
    // Row children don't shrink in RN — without wrapping, the pixel-font meta
    // items overflow the card's right edge.
    flexWrap: 'wrap',
    columnGap: Spacing.sm,
    rowGap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  category: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  difficulty: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  detailsHint: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  campaignChip: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    maxWidth: 120,
    flexShrink: 1,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
    flexShrink: 0,
    marginLeft: Spacing.sm,
  },
  xp: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
  },
  timer: {
    color: Colors.warning,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    fontVariant: ['tabular-nums'],
  },
  timerOverdue: {
    color: Colors.error,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  acceptBtn: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  acceptText: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  btnPressed: {
    opacity: 0.6,
  },
  btnText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
});
