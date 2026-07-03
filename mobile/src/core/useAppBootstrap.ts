import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePlayerStore } from '../presentation/stores/usePlayerStore';
import { useQuestStore } from '../presentation/stores/useQuestStore';
import { useGoalStore } from '../presentation/stores/useGoalStore';
import { useInventoryStore } from '../presentation/stores/useInventoryStore';
import { useTrainingStore } from '../presentation/stores/useTrainingStore';
import { onConnectivityChange } from './network';
import { NotificationService } from './NotificationService';
import { DailyTimelineService } from '../data/services/DailyTimelineService';
import { registerBackgroundTasks } from './backgroundTasks';

/**
 * Initializes all stores, notifications, and background tasks on app launch.
 * Also handles daily reset on foreground and re-sync on connectivity restore.
 * Returns `ready` — false until the first load completes.
 */
export function useAppBootstrap() {
  const [ready, setReady] = useState(false);

  const loadPlayer = usePlayerStore((s) => s.load);
  const refreshPlayer = usePlayerStore((s) => s.refreshFromLocal);
  const loadQuests = useQuestStore((s) => s.load);
  const loadGoal = useGoalStore((s) => s.load);
  const loadInventory = useInventoryStore((s) => s.load);
  const loadTraining = useTrainingStore((s) => s.load);

  useEffect(() => {
    // Advance the campaign timeline (evaluate elapsed days → keys/dungeons/rank),
    // then refresh the views that depend on it.
    async function advanceTimeline() {
      await DailyTimelineService.tick();
      // loadInventory included: a tick can enforce the penalty, which wipes rewards.
      await Promise.all([refreshPlayer(), loadQuests(), loadGoal(), loadInventory()]);
    }

    async function boot() {
      // 1. Request notification permissions
      await NotificationService.requestPermissions();

      // 2. Schedule the daily 8am quest reminder
      await NotificationService.scheduleDailyQuestReminder(8, 0).catch(() => {});

      // 3. Register background fetch task
      await registerBackgroundTasks().catch(() => {});

      // 4. Load all stores in parallel
      await Promise.all([loadPlayer(), loadQuests(), loadGoal(), loadInventory(), loadTraining()]);

      // 5. Advance the timeline for any days that elapsed since last open
      await advanceTimeline();

      setReady(true);
    }

    boot();

    // Re-sync when the device comes back online
    const unsubNet = onConnectivityChange((online) => {
      if (online) {
        loadInventory();
      }
    });

    // Advance the timeline whenever the app returns to the foreground
    const unsubApp = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        advanceTimeline();
      }
    });

    return () => {
      unsubNet();
      unsubApp.remove();
    };
  }, []);

  return { ready };
}
