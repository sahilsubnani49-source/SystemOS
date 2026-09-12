import { TrainingExercise } from '../models/TrainingExercise';
import { GymSession } from '../models/GymSession';

export interface ITrainingRepository {
  getExercises(): Promise<TrainingExercise[]>;
  saveExercises(list: TrainingExercise[]): Promise<void>;
  /** Mark an exercise as completed for `dateStr` and increment its days-trained counter. */
  completeExercise(id: string, dateStr: string): Promise<TrainingExercise>;
  /** Apply a progression step: set the new target and step index. */
  applyProgression(id: string, newTarget: number, newStepIndex: number): Promise<TrainingExercise>;
  /** Read the gym session for a given day, or null if none logged yet. */
  getGymSession(date: string): Promise<GymSession | null>;
  /** Insert or accumulate a gym session for its day. */
  upsertGymSession(session: GymSession): Promise<void>;
  /** All-time gym hours expressed in minutes, for the Hunter Log's Gym total. */
  getTotalGymMinutes(): Promise<number>;
  clearAll(): Promise<void>;
}
