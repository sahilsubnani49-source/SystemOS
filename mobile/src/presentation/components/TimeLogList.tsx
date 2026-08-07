import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts, FontSize, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';
import { DescriptionSource, TimeLog } from '../../domain/models/TimeLog';
import { formatDuration } from '../hooks/useElapsed';

interface Props {
  logs: TimeLog[];
  /** goalId → campaign title, resolved by the screen from useGoalStore. */
  goalTitles: Record<string, string>;
  limit?: number;
}

/** A glyph rather than a word — at 8pt pixel type a label would eat the row. */
const SOURCE_GLYPH: Record<DescriptionSource, string> = {
  manual: '',
  campaign: '◆',
  ai: '✦',
};

/** Local HH:MM from an ISO timestamp. */
function clockTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Today's finished sessions. A plain map, not a FlatList — TrainingScreen is already
 * a ScrollView and nesting a VirtualizedList on the same axis warns at runtime.
 */
export function TimeLogList({ logs, goalTitles, limit = 5 }: Props) {
  if (logs.length === 0) return null;

  const shown = logs.slice(0, limit);
  const hidden = logs.length - shown.length;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>TODAY&apos;S LOG</Text>

      {shown.map((log) => {
        const goalTitle = log.goalId ? goalTitles[log.goalId] : null;
        const glyph = SOURCE_GLYPH[log.descriptionSource];
        return (
          <View key={log.id} style={styles.row}>
            <View style={styles.metaRow}>
              <Text style={styles.time}>{clockTime(log.startedAt)}</Text>
              <Text style={styles.duration}>{formatDuration(log.creditedSeconds)}</Text>
              <Text style={styles.xp}>+{log.xpAwarded} XP</Text>
              {glyph !== '' && <Text style={styles.glyph}>{glyph}</Text>}
            </View>
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {log.description}
            </Text>
            {goalTitle && (
              <Text style={styles.goal} numberOfLines={1}>
                {goalTitle}
              </Text>
            )}
          </View>
        );
      })}

      {hidden > 0 && <Text style={styles.more}>+{hidden} more</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  heading: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  row: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.2),
    padding: Spacing.md,
    gap: Spacing.xs,
    ...Shadow.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  time: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  duration: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
  },
  xp: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.accent,
  },
  glyph: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  description: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.textSecondary,
  },
  goal: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  more: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
