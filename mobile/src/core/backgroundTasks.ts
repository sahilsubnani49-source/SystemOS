import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getMeta, setMeta } from '../data/services/AppMeta';
import { LAST_DAILY_NOTIFICATION_DATE } from '../data/services/DailyTimelineService';
import { NotificationService } from './NotificationService';
import { todayDateStr } from './dateUtils';

export const DAILY_RESET_TASK = 'SYSTEMOS_DAILY_RESET';

/**
 * Define the background task.
 * Must be called at the module level (top of the file, outside any component).
 */
TaskManager.defineTask(DAILY_RESET_TASK, async () => {
  try {
    // Day advancement itself happens on foreground (DailyTimelineService.tick).
    // The background run only fires the daily reminder if neither the tick nor a
    // previous background run has already announced today.
    const today = todayDateStr();
    const lastNotified = await getMeta(LAST_DAILY_NOTIFICATION_DATE);

    if (lastNotified !== today) {
      await setMeta(LAST_DAILY_NOTIFICATION_DATE, today);
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
      stopOnTerminate: false, // keep running after app is closed on Android
      startOnBoot: true, // restart task on device reboot (Android)
    });
  }
}

export async function unregisterBackgroundTasks(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_RESET_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(DAILY_RESET_TASK);
  }
}
