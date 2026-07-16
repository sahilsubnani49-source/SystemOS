import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Colors,
  FontSize,
  Fonts,
  Radius,
  Spacing,
  Shadow,
  Typography,
  withAlpha,
} from '../../core/theme';
import { useGoalStore } from '../stores/useGoalStore';
import { useQuestStore } from '../stores/useQuestStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { RewardModal } from '../components/RewardModal';
import { PlanReviewCard } from '../components/PlanReviewCard';
import { useSystemDialog } from '../components/SystemDialog';
import { Goal } from '../../domain/models/Goal';
import { Quest } from '../../domain/models/Quest';
import { daysBetween, todayDateStr } from '../../core/dateUtils';

const DAYS_PER_KEY = 21;
const MAX_CAMPAIGNS = 3;

export function CampaignScreen() {
  const {
    activeGoals,
    creating,
    planning,
    draftPlan,
    error,
    createGoal,
    generateDraftPlan,
    clearError,
    abandonCampaign,
  } = useGoalStore();
  const {
    dungeons,
    lockedDungeons,
    reportDungeon,
    load: loadQuests,
    lastReward,
    clearLastReward,
  } = useQuestStore();
  const player = usePlayerStore((s) => s.player);
  const systemAlert = useSystemDialog();

  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [durationText, setDurationText] = useState('30');
  const [showForm, setShowForm] = useState(false);
  const [architectUnreachable, setArchitectUnreachable] = useState(false);

  const resetForm = () => {
    setGoal('');
    setContext('');
    setDurationText('30');
    setArchitectUnreachable(false);
  };

  const validateForm = (): number | null => {
    const durationDays = parseInt(durationText, 10);
    if (!goal.trim()) {
      systemAlert('[System]', 'State your goal, Hunter.');
      return null;
    }
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 120) {
      systemAlert('[System]', 'Choose a timeline between 1 and 120 days.');
      return null;
    }
    return durationDays;
  };

  // Phase 1: ask the Architect for a reviewable strategy first.
  const handleConsult = async () => {
    const durationDays = validateForm();
    if (durationDays === null) return;
    clearError();
    setArchitectUnreachable(false);
    try {
      await generateDraftPlan({ goal: goal.trim(), context: context.trim(), durationDays });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.startsWith('The Architect is unreachable')) setArchitectUnreachable(true);
    }
  };

  // Phase 2 success: quests forged from the approved draft.
  const handleForged = async () => {
    await loadQuests();
    setShowForm(false);
    resetForm();
    systemAlert(
      '[New Campaign Initiated.]',
      'Your path is forged. Check the Quests tab for today.',
    );
  };

  const handleCreate = async () => {
    const durationDays = parseInt(durationText, 10);
    if (!goal.trim()) {
      systemAlert('[System]', 'State your goal, Hunter.');
      return;
    }
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 120) {
      systemAlert('[System]', 'Choose a timeline between 1 and 120 days.');
      return;
    }
    clearError();
    try {
      await createGoal({ goal: goal.trim(), context: context.trim(), durationDays });
      await loadQuests();
      setShowForm(false);
      resetForm();
      systemAlert(
        '[New Campaign Initiated.]',
        'Your path is forged. Check the Quests tab for today.',
      );
    } catch {
      // error surfaced via store state
    }
  };

  const handleEnterDungeon = (questId: string, title: string, instructions: string) => {
    systemAlert(`[Gate] ${title}`, `${instructions}\n\nDid you clear this Gate?`, [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Failed', style: 'destructive', onPress: () => reportDungeon(questId, false, null) },
      { text: 'Passed', onPress: () => reportDungeon(questId, true, null) },
    ]);
  };

  const handleAbandon = (g: Goal) => {
    systemAlert(
      '[Warning]',
      `Abandon "${g.title}"? This deletes its quests. Your level, XP, stats, rank, keys, and inventory are kept.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            await abandonCampaign(g.id);
            await loadQuests();
            systemAlert('[System]', 'Campaign abandoned.');
          },
        },
      ],
    );
  };

  const canAddMore = activeGoals.length < MAX_CAMPAIGNS;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Campaigns</Text>

        {/* Shared stat strip — Rank + Keys are a single pool across campaigns. */}
        <View style={styles.statStrip}>
          <Stat label="Rank" value={player?.rank ?? 'E-Rank'} />
          <Stat label="Keys" value={String(player?.keys ?? 0)} />
          <Stat label="Active" value={`${activeGoals.length}/${MAX_CAMPAIGNS}`} />
        </View>

        {activeGoals.length === 0 && !showForm && (
          <Text style={styles.intro}>
            No active campaigns. Declare a goal and a timeline below — the Quest Master will forge a
            full campaign of daily quests and Dungeon Gates to test your progress.
          </Text>
        )}

        {activeGoals.map((g) => (
          <CampaignCard
            key={g.id}
            goal={g}
            available={dungeons.filter((d) => d.goalId === g.id)}
            locked={lockedDungeons.filter((d) => d.goalId === g.id)}
            onEnterDungeon={handleEnterDungeon}
            onAbandon={() => handleAbandon(g)}
          />
        ))}

        {/* New Campaign affordance */}
        {canAddMore ? (
          <>
            {!showForm && (
              <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(true)}>
                <Text style={styles.newBtnText}>+ New Campaign</Text>
              </TouchableOpacity>
            )}

            {showForm && draftPlan && <PlanReviewCard onForged={handleForged} />}

            {showForm && !draftPlan && (
              <View style={styles.formWrap}>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Goal</Text>
                  <TextInput
                    style={styles.input}
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="e.g. Run a 5k without stopping"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Timeline (days)</Text>
                  <TextInput
                    style={styles.input}
                    value={durationText}
                    onChangeText={setDurationText}
                    keyboardType="number-pad"
                    placeholder="30"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Context (optional)</Text>
                  <Text style={styles.sectionDesc}>
                    Anything that shapes your quests — your starting point, constraints, schedule.
                  </Text>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    value={context}
                    onChangeText={setContext}
                    multiline
                    numberOfLines={4}
                    placeholder="e.g. I'm a software engineer who sits all day and hasn't run in years."
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                {error && <Text style={styles.error}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.btn, (planning || creating) && styles.btnDisabled]}
                  onPress={handleConsult}
                  disabled={planning || creating}
                >
                  {planning ? (
                    <View style={styles.btnRow}>
                      <ActivityIndicator color={Colors.textPrimary} />
                      <Text style={styles.btnText}> Drafting strategy…</Text>
                    </View>
                  ) : (
                    <Text style={styles.btnText}>CONSULT THE ARCHITECT</Text>
                  )}
                </TouchableOpacity>

                {architectUnreachable && (
                  <TouchableOpacity
                    style={[styles.forgeAnywayBtn, (creating || planning) && styles.btnDisabled]}
                    onPress={handleCreate}
                    disabled={creating || planning}
                  >
                    {creating ? (
                      <View style={styles.btnRow}>
                        <ActivityIndicator color={Colors.accent} />
                        <Text style={styles.forgeAnywayText}> Forging campaign…</Text>
                      </View>
                    ) : (
                      <Text style={styles.forgeAnywayText}>FORGE WITHOUT REVIEW</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    clearError();
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={creating || planning}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.maxCard}>
            <Text style={styles.maxTitle}>Maximum campaigns reached</Text>
            <Text style={styles.maxDesc}>
              You're running the maximum of {MAX_CAMPAIGNS} campaigns. Abandon one to forge another.
            </Text>
          </View>
        )}
      </ScrollView>
      <RewardModal item={lastReward} onClose={clearLastReward} />
    </SafeAreaView>
  );
}

// ---- Campaign card ---------------------------------------------------------

interface CampaignCardProps {
  goal: Goal;
  available: Quest[];
  locked: Quest[];
  onEnterDungeon: (questId: string, title: string, instructions: string) => void;
  onAbandon: () => void;
}

function CampaignCard({ goal, available, locked, onEnterDungeon, onAbandon }: CampaignCardProps) {
  const today = todayDateStr();
  const dayNumber = Math.min(
    goal.durationDays,
    Math.max(1, daysBetween(goal.startDate, today) + 1),
  );
  const progressToKey = goal.daysCompleted % DAYS_PER_KEY;

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroLabel}>CAMPAIGN</Text>
      <Text style={styles.heroGoal}>{goal.title}</Text>
      <Text style={styles.heroDay}>
        Day {dayNumber} of {goal.durationDays}
      </Text>

      <Text style={styles.cardStat}>Days Cleared: {goal.daysCompleted}</Text>
      <Text style={styles.keyProgress}>
        {progressToKey}/{DAYS_PER_KEY} days toward your next Dungeon Key
      </Text>

      {goal.plan ? (
        <Text style={styles.planText} numberOfLines={4}>
          {goal.plan}
        </Text>
      ) : null}

      {available.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Dungeons Open</Text>
          {available.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={styles.dungeonCard}
              onPress={() =>
                onEnterDungeon(d.id, d.title, d.dungeonChallenge?.instructions ?? d.description)
              }
            >
              <Text style={styles.dungeonTitle}>⚔️ {d.title}</Text>
              <Text style={styles.dungeonDesc} numberOfLines={2}>
                {d.dungeonChallenge?.successCriteria ?? d.description}
              </Text>
              <Text style={styles.dungeonCta}>Tap to enter the Gate →</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {locked.map((d) => (
        <View key={d.id} style={styles.lockedCard}>
          <Text style={styles.lockedText}>🔒 Gate sealed — unlocks soon</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.abandonBtn} onPress={onAbandon}>
        <Text style={styles.abandonText}>Abandon</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  container: { padding: Spacing.lg, gap: Spacing.md },
  title: { ...Typography.title },
  intro: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  statStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.27),
    ...Shadow.card,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.27),
    ...Shadow.card,
  },
  heroLabel: { ...Typography.label },
  heroGoal: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
    lineHeight: 22,
  },
  heroDay: { color: Colors.accent, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  cardStat: { color: Colors.textSecondary, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { color: Colors.primary, fontFamily: Fonts.pixel, fontSize: FontSize.lg },
  statLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  keyProgress: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  formWrap: { gap: Spacing.md },
  sectionTitle: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  sectionDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  planText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  inputMultiline: { minHeight: 100, textAlignVertical: 'top', lineHeight: 18 },
  error: {
    color: Colors.error,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  forgeAnywayBtn: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: withAlpha(Colors.accent, 0.08),
  },
  forgeAnywayText: { color: Colors.accent, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  cancelBtn: { padding: Spacing.sm, alignItems: 'center' },
  cancelBtnText: { color: Colors.textSecondary, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  newBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  newBtnText: { color: Colors.primary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  maxCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    ...Shadow.card,
  },
  maxTitle: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  maxDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  dungeonCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: withAlpha(Colors.error, 0.33),
    ...Shadow.card,
  },
  dungeonTitle: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  dungeonDesc: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  dungeonCta: { color: Colors.error, fontFamily: Fonts.pixel, fontSize: FontSize.xs, marginTop: 2 },
  lockedCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  lockedText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },
  abandonBtn: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  abandonText: { color: Colors.error, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
});
