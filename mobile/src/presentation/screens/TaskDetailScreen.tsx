import React, { useCallback, useLayoutEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, Fonts, Radius, Shadow, Spacing, withAlpha } from '../../core/theme';
import { RootStackParamList } from '../../core/navigation';
import { useTaskLogStore, DAILY_TASK_HOURS_CAP } from '../stores/useTaskLogStore';
import { LogTimeModal } from '../components/LogTimeModal';
import { LevelUpText } from '../components/LevelUpText';
import { formatMinutesLabel } from '../hooks/useElapsed';
import { todayDateStr } from '../../core/dateUtils';

/** "Today", "Yesterday", or "Aug 3" from a local YYYY-MM-DD string. */
function sessionDateLabel(date: string, today: string): string {
  if (date === today) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type DetailRoute = RouteProp<RootStackParamList, 'TaskDetail'>;

/** One Hunter Log category: its total, recent sessions, and the Log Time action. */
export function TaskDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { categoryId } = useRoute<DetailRoute>().params;

  const category = useTaskLogStore((s) => s.categories.find((c) => c.id === categoryId));
  const sessions = useTaskLogStore((s) => s.sessionsByCategory[categoryId]) ?? [];
  const loadSessions = useTaskLogStore((s) => s.loadSessions);
  const logSession = useTaskLogStore((s) => s.logSession);

  const [logOpen, setLogOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [burst, setBurst] = useState({ token: 0, label: '' });
  const today = todayDateStr();

  useLayoutEffect(() => {
    navigation.setOptions({ title: (category?.name ?? 'TASK').toUpperCase() });
  }, [navigation, category?.name]);

  useFocusEffect(
    useCallback(() => {
      loadSessions(categoryId);
    }, [loadSessions, categoryId]),
  );

  const handleLog = async (minutes: number, text: string) => {
    const res = await logSession({ categoryId, minutes, note: text });
    if (res.xp > 0) {
      setBurst((b) => ({
        token: b.token + 1,
        label: res.leveledUp ? 'LEVEL UP!' : `+${res.xp} XP`,
      }));
    }
    setNote(res.capped ? `Capped at ${DAILY_TASK_HOURS_CAP}h/day` : null);
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
        <Text style={styles.empty}>[Task not found.]</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <View pointerEvents="none" style={[styles.bracket, styles.bracketTL]} />
            <View pointerEvents="none" style={[styles.bracket, styles.bracketBR]} />
            <Text style={styles.icon}>{category.icon}</Text>
          </View>
          <Text style={styles.name}>{category.name}</Text>
          <Text style={styles.total}>{formatMinutesLabel(category.totalMinutes)}</Text>
          <View style={styles.tag}>
            <Text style={styles.tagText}>TOTAL TIME LOGGED</Text>
          </View>
          {/* Without this the total silently exceeds the sessions listed below —
              gym hours live in the Army tab and have no session row here. */}
          {category.sourceMinutes > 0 && (
            <Text style={styles.merged}>
              includes {formatMinutesLabel(category.sourceMinutes)} from the Army tab
            </Text>
          )}
          {note && <Text style={styles.note}>{note}</Text>}
        </View>

        {/* Recent sessions */}
        <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
        {sessions.length === 0 ? (
          <Text style={styles.empty}>[No sessions logged yet.]</Text>
        ) : (
          <View style={styles.list}>
            {sessions.map((s, i) => (
              <View key={s.id} style={[styles.row, i === sessions.length - 1 && styles.rowLast]}>
                <View style={styles.rowMain}>
                  <Text style={styles.rowDate}>{sessionDateLabel(s.date, today)}</Text>
                  {s.note !== '' && (
                    <Text style={styles.rowNote} numberOfLines={2}>
                      {s.note}
                    </Text>
                  )}
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowDuration}>{formatMinutesLabel(s.minutes)}</Text>
                  {s.xpAwarded > 0 && <Text style={styles.rowXp}>+{s.xpAwarded} XP</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.logBtn, pressed && styles.pressed]}
          onPress={() => {
            setNote(null);
            setLogOpen(true);
          }}
        >
          <Text style={styles.logBtnText}>+ LOG TIME</Text>
        </Pressable>
      </View>

      <LogTimeModal
        visible={logOpen}
        taskName={category.name}
        onLog={handleLog}
        onClose={() => setLogOpen(false)}
      />
      <LevelUpText token={burst.token} label={burst.label} />
    </SafeAreaView>
  );
}

const ICON_SIZE = 84;

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 96,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: Radius.full,
    backgroundColor: withAlpha(Colors.primary, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bracket: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: Colors.accent,
  },
  bracketTL: {
    top: -4,
    left: -4,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bracketBR: {
    bottom: -4,
    right: -4,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  icon: {
    fontSize: 36,
  },
  name: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  total: {
    fontFamily: Fonts.pixel,
    fontSize: 28,
    color: Colors.accent,
  },
  tag: {
    borderWidth: 1,
    borderColor: withAlpha(Colors.textSecondary, 0.4),
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  tagText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  note: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.warning,
    textAlign: 'center',
  },
  merged: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowMain: {
    flex: 1,
    gap: Spacing.xs,
  },
  rowDate: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  rowNote: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  rowDuration: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  rowXp: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.accent,
  },
  empty: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 16,
    paddingVertical: Spacing.lg,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.raised,
  },
  logBtnText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1.5,
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.8,
  },
});
