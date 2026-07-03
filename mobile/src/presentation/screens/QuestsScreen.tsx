import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, Typography, withAlpha } from '../../core/theme';
import { useQuestStore } from '../stores/useQuestStore';
import { useGoalStore } from '../stores/useGoalStore';
import { QuestCard } from '../components/QuestCard';
import { QuestDetailModal } from '../components/QuestDetailModal';
import { RewardModal } from '../components/RewardModal';
import { LevelUpText } from '../components/LevelUpText';
import { Quest } from '../../domain/models/Quest';

export function QuestsScreen() {
  const { quests, dungeons, loading, error, lastReward, acceptQuest, completeQuest, clearLastReward } =
    useQuestStore();
  const advanceTimeline = useGoalStore((s) => s.advanceTimeline);
  const activeGoals = useGoalStore((s) => s.activeGoals);
  const [completing, setCompleting] = useState<string | null>(null);
  const [selected, setSelected] = useState<Quest | null>(null);
  const [burst, setBurst] = useState({ token: 0, label: '' });

  // On every focus, advance the timeline (no-op if same day) and reload today's
  // quests. This catches a day rollover even when the app stayed open in the
  // background — otherwise the board would keep showing the previous day's quests.
  useFocusEffect(
    useCallback(() => {
      advanceTimeline();
    }, [advanceTimeline]),
  );

  const fireBurst = (leveledUp: boolean, xp: number) =>
    setBurst((b) => ({ token: b.token + 1, label: leveledUp ? 'LEVEL UP!' : `+${xp} XP` }));

  const handleAccept = async (questId: string) => {
    await acceptQuest(questId);
    // If the modal is open on this quest, refresh its snapshot so it shows the timer.
    const updated = useQuestStore.getState().quests.find((q) => q.id === questId) ?? null;
    setSelected((cur) => (cur && cur.id === questId ? updated : cur));
  };

  const handleComplete = async (questId: string) => {
    setCompleting(questId);
    const res = await completeQuest(questId);
    setCompleting(null);
    fireBurst(res.leveledUp, res.xp);
  };

  const handleCompleteFromModal = async (questId: string) => {
    setSelected(null); // close first so the LEVEL UP text floats over the board
    await handleComplete(questId);
  };

  const active = quests.filter((q) => !q.isCompleted);
  const done = quests.filter((q) => q.isCompleted);
  const allDone = active.length === 0 && quests.length > 0;
  const noCampaign = quests.length === 0 && !loading;

  // Group active quests under the campaign they belong to; quests whose campaign
  // is gone (or was never set) fall into a trailing "Side Quests" bucket.
  const campaignIds = new Set(activeGoals.map((g) => g.id));
  const sections = activeGoals
    .map((g) => ({ key: g.id, title: g.title, quests: active.filter((q) => q.goalId === g.id) }))
    .filter((s) => s.quests.length > 0);
  const orphans = active.filter((q) => !q.goalId || !campaignIds.has(q.goalId));
  if (orphans.length > 0) sections.push({ key: 'side', title: 'Side Quests', quests: orphans });

  const campaignTitles = new Map(activeGoals.map((g) => [g.id, g.title]));
  const labelFor = (q: Quest) => campaignTitles.get(q.goalId ?? '');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Today's Quests</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading && <ActivityIndicator color={Colors.primary} style={styles.loader} />}

        {dungeons.length > 0 && (
          <View style={styles.dungeonBanner}>
            <Text style={styles.dungeonBannerText}>
              ⚔️ A Dungeon Gate is open. Enter it from the 🎯 Campaign tab.
            </Text>
          </View>
        )}

        {noCampaign && (
          <View style={styles.allDoneBox}>
            <Text style={styles.allDoneText}>[No active campaign.]</Text>
            <Text style={styles.allDoneSub}>
              Open the 🎯 Campaign tab to declare a goal and forge your quests.
            </Text>
          </View>
        )}

        {allDone && (
          <View style={styles.allDoneBox}>
            <Text style={styles.allDoneText}>[All quests completed.]</Text>
            <Text style={styles.allDoneSub}>Rest, Hunter. Tomorrow brings new challenges.</Text>
          </View>
        )}

        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <Text style={styles.campaignHeader}>🎯 {section.title.toUpperCase()}</Text>
            {section.quests.map((q) => (
              <QuestCard
                key={q.id}
                quest={q}
                showActions
                onAccept={handleAccept}
                onComplete={completing === q.id ? undefined : handleComplete}
                onPress={setSelected}
              />
            ))}
          </View>
        ))}

        {done.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Completed</Text>
            {done.map((q) => (
              <QuestCard key={q.id} quest={q} campaignLabel={labelFor(q)} onPress={setSelected} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Screen-level burst — shown when no reward modal covers it (the 30% XP-only case). */}
      <LevelUpText token={burst.token} label={burst.label} />

      <QuestDetailModal
        quest={selected}
        onClose={() => setSelected(null)}
        onAccept={handleAccept}
        onComplete={handleCompleteFromModal}
        completing={completing === selected?.id}
      />

      {/* When a reward drops, the burst renders INSIDE the modal so it floats above it. */}
      <RewardModal item={lastReward} onClose={clearLastReward} burst={burst} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  error: {
    color: Colors.warning,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  campaignHeader: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 2,
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    marginTop: Spacing.md,
  },
  allDoneBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: Spacing.lg,
    ...Shadow.card,
  },
  allDoneText: {
    color: Colors.primary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1,
  },
  allDoneSub: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 16,
  },
  warning: {
    color: Colors.warning,
  },
  dungeonBanner: {
    backgroundColor: withAlpha(Colors.error, 0.1),
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.error, 0.33),
    marginBottom: Spacing.sm,
  },
  dungeonBannerText: {
    color: Colors.error,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
});
