import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Colors,
  FontSize,
  Fonts,
  Spacing,
  Radius,
  Shadow,
  Typography,
  withAlpha,
} from '../../core/theme';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useQuestStore } from '../stores/useQuestStore';
import { useInventoryStore } from '../stores/useInventoryStore';
import { useTaskLogStore } from '../stores/useTaskLogStore';
import { XPBar } from '../components/XPBar';
import { RankBadge } from '../components/RankBadge';
import { CornerCard } from '../components/CornerCard';
import { NewTaskModal } from '../components/NewTaskModal';
import { formatMinutesLabel } from '../hooks/useElapsed';
import { Rank } from '../../core/constants';
import { RootStackParamList } from '../../core/navigation';

/** The Hunter Log: level card, inventory shortcut, and the grid of logged tasks. */
export function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { player, loading: playerLoading } = usePlayerStore();
  const quests = useQuestStore((s) => s.quests);
  const itemCount = useInventoryStore((s) => s.items.length);

  const categories = useTaskLogStore((s) => s.categories);
  const streakDays = useTaskLogStore((s) => s.streakDays);
  const tasksLoading = useTaskLogStore((s) => s.loading);
  const loadTasks = useTaskLogStore((s) => s.load);
  const addCategory = useTaskLogStore((s) => s.addCategory);

  const [newTaskOpen, setNewTaskOpen] = useState(false);

  // Totals change on the detail screen, so re-read them whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  const questsDone = quests.filter((q) => q.isCompleted).length;
  const dailyQuestLabel =
    quests.length > 0 ? `Daily Quest: ${questsDone}/${quests.length} done` : 'No quests today';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header — eyebrow + title stack, name and RANK on a row below so the
            top-right corner stays clear of the on-device overlay. */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>SYSTEM</Text>
          <Text style={styles.title}>HUNTER LOG</Text>
          <View style={styles.identityRow}>
            <Text
              style={styles.playerName}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
            >
              {player?.name ?? '—'}
            </Text>
            <RankBadge rank={(player?.rank?.charAt(0) ?? 'E') as Rank} />
          </View>
        </View>

        {/* Level card */}
        {player && (
          <XPBar
            level={player.level}
            experience={player.experience}
            experienceToNextLevel={player.experienceToNextLevel}
            streakDays={streakDays}
            footerRight={dailyQuestLabel}
          />
        )}
        {playerLoading && !player && <ActivityIndicator color={Colors.primary} />}

        {/* Inventory shortcut */}
        <Pressable
          style={({ pressed }) => [styles.inventoryBtn, pressed && styles.pressed]}
          onPress={() => navigation.navigate('Inventory')}
        >
          <Text style={styles.inventoryIcon}>🎒</Text>
          <View style={styles.inventoryInfo}>
            <Text style={styles.inventoryTitle}>INVENTORY</Text>
            <Text style={styles.inventorySub}>
              {itemCount} reward{itemCount !== 1 ? 's' : ''} stored
            </Text>
          </View>
          <Text style={styles.inventoryChevron}>›</Text>
        </Pressable>

        {/* Tasks logged */}
        <Text style={styles.sectionTitle}>TASKS LOGGED</Text>
        {tasksLoading && categories.length === 0 && <ActivityIndicator color={Colors.primary} />}
        <View style={styles.grid}>
          {categories.map((c) => {
            const card = (
              <CornerCard style={styles.taskCard} size={11} bracketOpacity={0.75}>
                <View style={styles.taskIconWrap}>
                  <Text style={styles.taskIcon}>{c.icon}</Text>
                </View>
                <Text style={styles.taskName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.taskTime}>{formatMinutesLabel(c.totalMinutes)}</Text>
                {c.synthetic && <Text style={styles.taskSource}>FROM TIMER</Text>}
              </CornerCard>
            );

            // The Focus row is a view over time_logs with no category behind it —
            // TaskDetail would offer to log hand-entered time against nothing.
            if (c.synthetic) {
              return (
                <View key={c.id} style={styles.cell}>
                  {card}
                </View>
              );
            }

            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
                onPress={() => navigation.navigate('TaskDetail', { categoryId: c.id })}
              >
                {card}
              </Pressable>
            );
          })}

          <Pressable
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
            onPress={() => setNewTaskOpen(true)}
          >
            <View style={[styles.taskCard, styles.newCard]}>
              <Text style={styles.newPlus}>+</Text>
              <Text style={styles.newLabel}>NEW TASK</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <NewTaskModal
        visible={newTaskOpen}
        onCreate={addCategory}
        onClose={() => setNewTaskOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    alignItems: 'flex-start',
    gap: Spacing.sm,
    // Keep-out gutter for the on-device overlay in the top-right corner.
    paddingRight: 52,
  },
  eyebrow: {
    ...Typography.label,
    color: Colors.accent,
    letterSpacing: 2,
  },
  title: {
    ...Typography.title,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    alignSelf: 'stretch',
  },
  playerName: {
    flexShrink: 1,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  inventoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.33),
    padding: Spacing.md,
    ...Shadow.card,
  },
  inventoryIcon: {
    fontSize: 20,
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryTitle: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
  inventorySub: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  inventoryChevron: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
  },
  sectionTitle: {
    ...Typography.label,
    marginBottom: -Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm + 4,
  },
  cell: {
    // Two columns: half the row minus half the gap.
    width: '48%',
  },
  taskCard: {
    minHeight: 132,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  taskIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: withAlpha(Colors.primary, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIcon: {
    fontSize: 20,
  },
  taskName: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  taskTime: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
    color: Colors.accent,
  },
  taskSource: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  newCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: withAlpha(Colors.textSecondary, 0.4),
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  newPlus: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xxl,
    color: Colors.textSecondary,
  },
  newLabel: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
