import { TrainingExercise } from '../../domain/models/TrainingExercise';
import { NotificationService } from '../../core/NotificationService';

export interface ExerciseCatalogEntry {
  name: string;
  muscleGroup: string;
  mode: 'reps' | 'seconds';
  defaultBaseline: number;
  maxTarget: number;
}

/** The fixed set of bodyweight exercises the player can enrol in. */
export const EXERCISE_CATALOG: readonly ExerciseCatalogEntry[] = [
  {
    name: 'Push-ups',
    muscleGroup: 'Chest & Triceps',
    mode: 'reps',
    defaultBaseline: 10,
    maxTarget: 100,
  },
  {
    name: 'Squats',
    muscleGroup: 'Legs & Glutes',
    mode: 'reps',
    defaultBaseline: 15,
    maxTarget: 100,
  },
  { name: 'Sit-ups', muscleGroup: 'Core', mode: 'reps', defaultBaseline: 15, maxTarget: 100 },
  {
    name: 'Pull-ups',
    muscleGroup: 'Back & Biceps',
    mode: 'reps',
    defaultBaseline: 3,
    maxTarget: 30,
  },
  {
    name: 'Plank',
    muscleGroup: 'Core & Shoulders',
    mode: 'seconds',
    defaultBaseline: 30,
    maxTarget: 300,
  },
  { name: 'Burpees', muscleGroup: 'Full Body', mode: 'reps', defaultBaseline: 8, maxTarget: 60 },
];

/**
 * The days-trained threshold at which the (stepIndex+1)-th target increase fires.
 * Doubles each step: 3, 6, 12, 24, 48, …
 */
export function nextMilestone(stepIndex: number): number {
  return 3 * 2 ** stepIndex;
}

/**
 * Computes the next target after a progression step. With k = stepIndex + 1, the
 * target grows by 1/(k+1) each step (50%, then 33%, 25%, 20%, …), clamped to maxTarget.
 */
export function computeNextTarget(
  currentTarget: number,
  stepIndex: number,
  maxTarget: number,
): number {
  const k = stepIndex + 1;
  return Math.min(maxTarget, Math.round(currentTarget * (1 + 1 / (k + 1))));
}

/**
 * Orchestration helper called AFTER the completion row has been persisted (so
 * `exercise.daysTrained` already reflects today's completion). Decides whether a
 * target increase fires and, if so, fires the "training intensified" notification.
 */
export function onExerciseCompleted(exercise: TrainingExercise): {
  increased: boolean;
  newTarget: number;
  newStepIndex: number;
} {
  const shouldIncrease =
    exercise.daysTrained >= nextMilestone(exercise.stepIndex) &&
    exercise.currentTarget < exercise.maxTarget;

  if (!shouldIncrease) {
    return {
      increased: false,
      newTarget: exercise.currentTarget,
      newStepIndex: exercise.stepIndex,
    };
  }

  const newStepIndex = exercise.stepIndex + 1;
  const newTarget = computeNextTarget(
    exercise.currentTarget,
    exercise.stepIndex,
    exercise.maxTarget,
  );

  NotificationService.send(
    '[Training Intensified.]',
    `${exercise.name}: target raised to ${newTarget}${
      exercise.mode === 'seconds' ? 's' : ' reps'
    }. Your limits are a lie.`,
  ).catch(() => {});

  return { increased: true, newTarget, newStepIndex };
}
