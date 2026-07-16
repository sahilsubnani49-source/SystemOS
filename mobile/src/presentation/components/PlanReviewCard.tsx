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
import { Colors, FontSize, Fonts, Radius, Spacing, Shadow, withAlpha } from '../../core/theme';
import { useGoalStore } from '../stores/useGoalStore';

interface Props {
  /** Called after the campaign is successfully forged from the approved draft. */
  onForged: () => void;
}

/**
 * Phase-2 of campaign creation: the Architect's drafted strategy, presented for the
 * Hunter to approve, revise, edit by hand, or discard. Reads the goal store directly
 * (screens in this app already do) — the parent only supplies the post-forge hook.
 */
export function PlanReviewCard({ onForged }: Props) {
  const {
    draftPlan,
    creating,
    planning,
    error,
    approveDraftPlan,
    regenerateDraftPlan,
    setDraftPlanText,
    discardDraftPlan,
  } = useGoalStore();

  const [editing, setEditing] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!draftPlan) return null;

  // Any in-flight LLM call locks every button — the forge in particular can run minutes.
  const busy = creating || planning;

  const handleApprove = async () => {
    try {
      await approveDraftPlan();
      onForged();
    } catch {
      // error surfaced via store state — draft is kept
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    try {
      await regenerateDraftPlan(feedback.trim());
      setFeedback('');
      setShowFeedback(false);
    } catch {
      // error surfaced via store state
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.header}>[ CAMPAIGN STRATEGY ]</Text>
      <Text style={styles.sub}>
        {draftPlan.goal} · {draftPlan.durationDays} days
      </Text>

      {editing ? (
        <>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={draftPlan.plan}
            onChangeText={setDraftPlanText}
            multiline
            editable={!busy}
            placeholder="Day-by-day blueprint…"
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={styles.editHelp}>
            Keep the day-by-day blueprint — the System forges quests from it.
          </Text>
        </>
      ) : (
        <ScrollView style={styles.planScroll} nestedScrollEnabled showsVerticalScrollIndicator>
          <Text style={styles.planText}>{draftPlan.plan}</Text>
        </ScrollView>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {/* APPROVE & FORGE (primary) */}
      <TouchableOpacity
        style={[styles.primaryBtn, busy && styles.btnDisabled]}
        onPress={handleApprove}
        disabled={busy}
      >
        {creating ? (
          <View style={styles.btnRow}>
            <ActivityIndicator color={Colors.textPrimary} />
            <Text style={styles.primaryBtnText}> Forging quests…</Text>
          </View>
        ) : (
          <Text style={styles.primaryBtnText}>APPROVE & FORGE</Text>
        )}
      </TouchableOpacity>

      {/* REGENERATE (secondary) — toggles a feedback field */}
      <TouchableOpacity
        style={[styles.secondaryBtn, busy && styles.btnDisabled]}
        onPress={() => setShowFeedback((v) => !v)}
        disabled={busy}
      >
        <Text style={styles.secondaryBtnText}>
          {showFeedback ? 'CLOSE FEEDBACK' : 'REGENERATE'}
        </Text>
      </TouchableOpacity>

      {showFeedback && (
        <View style={styles.feedbackWrap}>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            editable={!busy}
            placeholder="What should the Architect change?"
            placeholderTextColor={Colors.textSecondary}
          />
          <TouchableOpacity
            style={[styles.secondaryBtn, busy && styles.btnDisabled]}
            onPress={handleSubmitFeedback}
            disabled={busy}
          >
            {planning ? (
              <View style={styles.btnRow}>
                <ActivityIndicator color={Colors.accent} />
                <Text style={styles.secondaryBtnText}> Revising…</Text>
              </View>
            ) : (
              <Text style={styles.secondaryBtnText}>SUBMIT FEEDBACK</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* EDIT (toggle) */}
      <TouchableOpacity
        style={[styles.secondaryBtn, busy && styles.btnDisabled]}
        onPress={() => setEditing((v) => !v)}
        disabled={busy}
      >
        <Text style={styles.secondaryBtnText}>{editing ? 'DONE EDITING' : 'EDIT'}</Text>
      </TouchableOpacity>

      {/* DISCARD (destructive) */}
      <TouchableOpacity style={styles.discardBtn} onPress={discardDraftPlan} disabled={busy}>
        <Text style={styles.discardText}>DISCARD</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.4),
    ...Shadow.card,
  },
  header: {
    color: Colors.accent,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    letterSpacing: 1,
  },
  sub: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
  },
  planScroll: {
    maxHeight: 320,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
  },
  planText: {
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
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
  inputMultiline: { minHeight: 160, maxHeight: 320, textAlignVertical: 'top', lineHeight: 16 },
  editHelp: {
    color: Colors.textSecondary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
  },
  error: {
    color: Colors.error,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    lineHeight: 16,
    textAlign: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.textPrimary, fontFamily: Fonts.pixel, fontSize: FontSize.md },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: withAlpha(Colors.accent, 0.08),
  },
  secondaryBtnText: { color: Colors.accent, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
  feedbackWrap: { gap: Spacing.sm },
  discardBtn: { padding: Spacing.sm, alignItems: 'center' },
  discardText: { color: Colors.error, fontFamily: Fonts.pixel, fontSize: FontSize.sm },
});
