import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { DailyResetService } from '../data/services/DailyResetService';
import { NotificationService } from './NotificationService';

export const DAILY_RESET_TASK = 'SYSTEMOS_DAILY_RESET';

/**
 * Define the background task.
 * Must be called at the module level (top of the file, outside any component).
 */
TaskManager.defineTask(DAILY_RESET_TASK, async () => {
  try {
    // Check if any incomplete quests remain (penalty warning)
    // The reset itself is handled on foreground — background just fires warnings
    const lastReset = await DailyResetService.getLastResetDate();
    const today = new Date().toDateString();

    if (lastReset !== today) {
      // It's a new day and app hasn't been opened yet — fire a reminder
      await NotificationService.send(
        '[Daily Quest has arrived.]',
        'New challenges await, Hunter. Rise and conquer.',
      );
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch task.
 * Safe to call multiple times — will update the interval if already registered.
 *
 * Note: iOS enforces a minimum interval of ~15 minutes regardless of what's set.
 * Android respects the interval more precisely.
 */
export async function registerBackgroundTasks(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_RESET_TASK);

  if (!isRegistered) {
    await BackgroundFetch.registerTaskAsync(DAILY_RESET_TASK, {
      minimumInterval: 60 * 60, // 1 hour (iOS will run it less frequently)
      stopOnTerminate: false,   // keep running after app is closed on Android
      startOnBoot: true,        // restart task on device reboot (Android)
    });
  }
}

export async function unregisterBackgroundTasks(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_RESET_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(DAILY_RESET_TASK);
  }
}
