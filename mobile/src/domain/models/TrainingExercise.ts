export interface TrainingExercise {
  id: string;
  name: string;
  muscleGroup: string;
  mode: 'reps' | 'seconds';
  baseline: number;
  currentTarget: number;
  maxTarget: number;
  stepIndex: number;
  daysTrained: number;
  lastCompletedDate: string | null;
  createdAt: string;
}
