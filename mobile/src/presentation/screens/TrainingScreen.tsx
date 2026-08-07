import React, { useEffect, useState } from 'react';
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
  Spacing,
  FontSize,
  Radius,
  Shadow,
  Typography,
  withAlpha,
  Fonts,
} from '../../core/theme';
import { useTrainingStore, DAILY_GYM_HOURS_CAP } from '../stores/useTrainingStore';
import { useTimeLogStore, DAILY_FOCUS_HOURS_CAP } from '../stores/useTimeLogStore';
import { useGoalStore } from '../stores/useGoalStore';
import { LevelUpText } from '../components/LevelUpText';
import { GymHoursModal } from '../components/GymHoursModal';
import { ProteinCalcModal } from '../components/ProteinCalcModal';
import { ActiveTimerCard } from '../components/ActiveTimerCard';
import { TimerStartModal } from '../components/TimerStartModal';
import { TimerStopModal } from '../components/TimerStopModal';
import { TimeLogList } from '../components/TimeLogList';
import { useSystemDialog } from '../components/SystemDialog';
import { EXERCISE_CATALOG, nextMilestone } from '../../data/services/TrainingProgressionService';
import { todayDateStr } from '../../core/dateUtils';

/** Short human date (e.g. "Jul 2") for the "as of" nutrition sub-line. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TrainingScreen() {
  const { exercises, setupDone, loading, load, completeSetup, completeExercise } =
    useTrainingStore();

  const [burst, setBurst] = useState({ token: 0, label: '' });
  const fireBurst = (leveledUp: boolean, xp: number) =>
    setBurst((b) => ({ token: b.token + 1, label: leveledUp ? 'LEVEL UP!' : `+${xp} XP` }));

  useEffect(() => {
    load();
  }, [load]);

  if (loading && exercises.length === 0 && !setupDone) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {setupDone ? (
        <DailyTraining
          exercises={exercises}
          loading={loading}
          onComplete={completeExercise}
          fireBurst={fireBurst}
        />
      ) : (
        <Assessment onBegin={completeSetup} />
      )}

      <LevelUpText token={burst.token} label={burst.label} />
    </SafeAreaView>
  );
}

/* -------------------------------------------------------------------------- */
/* Assessment (first-run setup)                                               */
/* -------------------------------------------------------------------------- */

function Assessment({
  onBegin,
}: {
  onBegin: (
    entries: { name: string; baseline: number }[],
    weightKg: number,
    heightCm: number,
  ) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(EXERCISE_CATALOG.map((e) => [e.name, String(e.defaultBaseline)])),
  );
  const [weightText, setWeightText] = useState('');
  const [heightText, setHeightText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleBegin = async () => {
    setSubmitting(true);
    const entries = EXERCISE_CATALOG.map((e) => {
      const n = parseInt(values[e.name], 10);
      return { name: e.name, baseline: Number.isInteger(n) && n > 0 ? n : e.defaultBaseline };
    });
    const wRaw = parseInt(weightText, 10);
    const w = Number.isInteger(wRaw) && wRaw > 0 ? wRaw : 70;
    const hRaw = parseInt(heightText, 10);
    const h = Number.isInteger(hRaw) && hRaw > 0 ? hRaw : 170;
    await onBegin(entries, w, h);
    // store flips setupDone → screen re-renders into the daily view.
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pixelTitle}>THE ASSESSMENT</Text>
      <Text style={styles.intro}>The System will measure your limits.</Text>

      {EXERCISE_CATALOG.map((entry) => (
        <View key={entry.name} style={styles.field}>
          <Text style={styles.fieldLabel}>
            {entry.name} ({entry.mode === 'seconds' ? 'seconds' : 'reps'})
          </Text>
          <TextInput
            style={styles.input}
            value={values[entry.name]}
            onChangeText={(t) => setValues((v) => ({ ...v, [entry.name]: t }))}
            keyboardType="number-pad"
            placeholder={String(entry.defaultBaseline)}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      ))}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Body weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={weightText}
          onChangeText={setWeightText}
          keyboardType="number-pad"
          placeholder="70"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={heightText}
          onChangeText={setHeightText}
          keyboardType="number-pad"
          placeholder="170"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <TouchableOpacity
        style={[styles.beginBtn, submitting && styles.btnDisabled]}
        onPress={handleBegin}
        disabled={submitting}
        activeOpacity={0.8}
      >
        <Text style={styles.beginBtnText}>{submitting ? 'CALIBRATING…' : 'BEGIN TRAINING'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* -------------------------------------------------------------------------- */
/* Daily training                                                             */
/* -------------------------------------------------------------------------- */

function DailyTraining({
  exercises,
  loading,
  onComplete,
  fireBurst,
}: {
  exercises: ReturnType<typeof useTrainingStore.getState>['exercises'];
  loading: boolean;
  onComplete: (id: string) => Promise<{ leveledUp: boolean; xp: number }>;
  fireBurst: (leveledUp: boolean, xp: number) => void;
}) {
  const todayGymHours = useTrainingStore((s) => s.todayGymHours);
  const lastNutrition = useTrainingStore((s) => s.lastNutrition);
  const logGymHours = useTrainingStore((s) => s.logGymHours);

  const running = useTimeLogStore((s) => s.running);
  const todayLogs = useTimeLogStore((s) => s.todayLogs);
  const todayFocusSeconds = useTimeLogStore((s) => s.todaySeconds);
  const stopping = useTimeLogStore((s) => s.stopping);
  const startTimer = useTimeLogStore((s) => s.startTimer);
  const stopTimer = useTimeLogStore((s) => s.stopTimer);
  const cancelTimer = useTimeLogStore((s) => s.cancelTimer);
  const activeGoals = useGoalStore((s) => s.activeGoals);
  const alert = useSystemDialog();

  const [completing, setCompleting] = useState<string | null>(null);
  const [gymModalOpen, setGymModalOpen] = useState(false);
  const [proteinModalOpen, setProteinModalOpen] = useState(false);
  const [gymNote, setGymNote] = useState<string | null>(null);
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [focusNote, setFocusNote] = useState<string | null>(null);
  const today = todayDateStr();

  const doneToday = exercises.filter((e) => e.lastCompletedDate === today).length;
  const allDone = exercises.length > 0 && doneToday === exercises.length;
  const remainingGym = Math.max(0, DAILY_GYM_HOURS_CAP - todayGymHours);

  const goalTitles = Object.fromEntries(activeGoals.map((g) => [g.id, g.title]));
  const runningGoalTitle = running?.goalId ? (goalTitles[running.goalId] ?? null) : null;
  const focusHoursToday = Math.round((todayFocusSeconds / 3600) * 10) / 10;

  const handleComplete = async (id: string) => {
    setCompleting(id);
    const res = await onComplete(id);
    setCompleting(null);
    fireBurst(res.leveledUp, res.xp);
  };

  const handleLogGym = async (hours: number) => {
    const res = await logGymHours(hours);
    if (res.grantedHours > 0) fireBurst(res.leveledUp, res.xp);
    setGymNote(res.grantedHours < hours ? 'Capped at 4h/day' : null);
  };

  const applyStopResult = (res: Awaited<ReturnType<typeof stopTimer>>) => {
    if (res.discarded) {
      setFocusNote('Under 5 min — nothing logged.');
      return;
    }
    if (res.xp > 0) fireBurst(res.leveledUp, res.xp);
    setFocusNote(res.capped ? `Capped at ${DAILY_FOCUS_HOURS_CAP}h/day` : null);
  };

  const handleStopConfirm = async (description: string) => {
    applyStopResult(await stopTimer({ description }));
  };

  // Long-press on STOP: most sessions need no edit, so skip straight to logging.
  const handleStopImmediate = async () => {
    applyStopResult(await stopTimer());
  };

  const handleDiscard = () => {
    alert(
      '[ DISCARD SESSION ]',
      'This time will not be logged and earns no XP.',
      [
        { text: 'KEEP RUNNING', style: 'cancel' },
        { text: 'DISCARD', style: 'destructive', onPress: () => void cancelTimer() },
      ],
      'warning',
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pixelTitle}>DAILY TRAINING</Text>

      {loading && <ActivityIndicator color={Colors.primary} style={styles.loader} />}

      {/* Protein target */}
      <View style={styles.proteinCard}>
        <Text style={styles.proteinLabel}>PROTEIN INTAKE</Text>
        <Text style={styles.proteinValue}>
          {lastNutrition ? `${lastNutrition.dailyProteinG}g` : '—'}
        </Text>
        {lastNutrition && (
          <Text style={styles.cardSub}>as of {shortDate(lastNutrition.computedAt)}</Text>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => setProteinModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardBtnText}>CALCULATE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setProteinModalOpen(true)} activeOpacity={0.7}>
            <Text style={styles.cardLink}>UPDATE WEIGHT</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Focus log — the live timer takes the same slot as the idle card, so
          starting a session causes no layout shift. */}
      {running ? (
        <ActiveTimerCard
          log={running}
          goalTitle={runningGoalTitle}
          stopping={stopping}
          onStop={() => setStopModalOpen(true)}
          onStopImmediate={handleStopImmediate}
          onCancel={handleDiscard}
        />
      ) : (
        <View style={styles.proteinCard}>
          <Text style={styles.proteinLabel}>FOCUS LOG</Text>
          <Text style={styles.proteinValue}>
            {focusHoursToday} / {DAILY_FOCUS_HOURS_CAP}h today
          </Text>
          {focusNote && <Text style={styles.cardNote}>{focusNote}</Text>}
          <TouchableOpacity
            style={styles.cardBtn}
            onPress={() => {
              setFocusNote(null);
              setStartModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cardBtnText}>START TIMER</Text>
          </TouchableOpacity>
        </View>
      )}

      <TimerStartModal
        visible={startModalOpen}
        goals={activeGoals}
        onStart={startTimer}
        onClose={() => setStartModalOpen(false)}
      />
      <TimerStopModal
        visible={stopModalOpen}
        log={running}
        goalTitle={runningGoalTitle}
        bankedSeconds={todayFocusSeconds}
        onConfirm={handleStopConfirm}
        onDiscard={cancelTimer}
        onClose={() => setStopModalOpen(false)}
      />

      {/* Gym hours */}
      <View style={styles.proteinCard}>
        <Text style={styles.proteinLabel}>GYM HOURS</Text>
        <Text style={styles.proteinValue}>
          {todayGymHours} / {DAILY_GYM_HOURS_CAP}h today
        </Text>
        {gymNote && <Text style={styles.cardNote}>{gymNote}</Text>}
        <TouchableOpacity
          style={styles.cardBtn}
          onPress={() => {
            setGymNote(null);
            setGymModalOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.cardBtnText}>LOG GYM HOURS</Text>
        </TouchableOpacity>
      </View>

      <GymHoursModal
        visible={gymModalOpen}
        remainingHours={remainingGym}
        onLog={handleLogGym}
        onClose={() => setGymModalOpen(false)}
      />
      <ProteinCalcModal visible={proteinModalOpen} onClose={() => setProteinModalOpen(false)} />

      <TimeLogList logs={todayLogs} goalTitles={goalTitles} />

      {allDone && (
        <View style={styles.allDoneBox}>
          <Text style={styles.allDoneText}>[Training complete.]</Text>
          <Text style={styles.allDoneSub}>Recovery is also training.</Text>
        </View>
      )}

      {exercises.map((e) => {
        const doneForEx = e.lastCompletedDate === today;
        const targetLine =
          e.mode === 'reps'
            ? `${e.currentTarget} ${e.name.toUpperCase()}`
            : `${e.name.toUpperCase()} ${e.currentTarget}s`;
        const atMax = e.currentTarget >= e.maxTarget;
        const meta = atMax
          ? 'MAX'
          : `Day ${e.daysTrained} • next increase at ${nextMilestone(e.stepIndex)} days`;

        return (
          <View key={e.id} style={styles.exCard}>
            <Text style={styles.exTarget}>{targetLine}</Text>
            <Text style={styles.exMuscle}>{e.muscleGroup}</Text>
            <Text style={styles.exMeta}>{meta}</Text>

            {doneForEx ? (
              <View style={[styles.completeBtn, styles.completeBtnDone]}>
                <Text style={styles.completeBtnDoneText}>✓ DONE</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.completeBtn, completing === e.id && styles.btnDisabled]}
                onPress={() => handleComplete(e.id)}
                disabled={completing === e.id}
                activeOpacity={0.8}
              >
                <Text style={styles.completeBtnText}>COMPLETE</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loader: {
    marginVertical: Spacing.lg,
  },
  pixelTitle: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  intro: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },

  // Assessment fields
  field: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    ...Typography.label,
    color: Colors.accent,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.3),
    color: Colors.textPrimary,
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  beginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadow.card,
  },
  beginBtnText: {
    ...Typography.system,
    color: Colors.textPrimary,
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Protein card
  proteinCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.3),
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  proteinLabel: {
    ...Typography.label,
    color: Colors.accent,
  },
  proteinValue: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xl,
    color: Colors.textPrimary,
  },
  cardSub: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  cardNote: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    lineHeight: 13,
    color: Colors.warning,
    textAlign: 'center',
  },
  cardActions: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cardBtn: {
    backgroundColor: withAlpha(Colors.accent, 0.12),
    borderWidth: 1,
    borderColor: withAlpha(Colors.accent, 0.4),
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  cardBtnText: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    color: Colors.accent,
  },
  cardLink: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    color: Colors.textSecondary,
  },

  // Exercise card
  exCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: withAlpha(Colors.primary, 0.25),
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadow.card,
  },
  exTarget: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  exMuscle: {
    ...Typography.label,
    color: Colors.textSecondary,
  },
  exMeta: {
    ...Typography.body,
    fontSize: FontSize.xs,
    marginBottom: Spacing.sm,
  },
  completeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  completeBtnText: {
    ...Typography.system,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
  },
  completeBtnDone: {
    backgroundColor: withAlpha(Colors.success, 0.15),
    borderWidth: 1,
    borderColor: withAlpha(Colors.success, 0.4),
  },
  completeBtnDoneText: {
    ...Typography.system,
    fontSize: FontSize.sm,
    color: Colors.success,
  },

  // All-done box
  allDoneBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
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
});
