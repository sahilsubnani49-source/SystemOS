import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { usePlayerStore } from '../presentation/stores/usePlayerStore';
import { useQuestStore } from '../presentation/stores/useQuestStore';
import { useGoalStore } from '../presentation/stores/useGoalStore';
import { useInventoryStore } from '../presentation/stores/useInventoryStore';
import { useTrainingStore } from '../presentation/stores/useTrainingStore';
import { useTimeLogStore } from '../presentation/stores/useTimeLogStore';
import { useAuthStore } from '../presentation/stores/useAuthStore';
import { onConnectivityChange } from './network';
import { NotificationService } from './NotificationService';
import { DailyTimelineService } from '../data/services/DailyTimelineService';
import { registerBackgroundTasks } from './backgroundTasks';
import { ENV } from './env';

/**
 * Initializes auth, all stores, notifications, and background tasks on app launch.
 * Also handles the daily timeline tick on foreground and re-sync on connectivity
 * restore — but ONLY while a Hunter is logged in, so no /api/* call ever fires
 * without a Bearer token. Returns `ready` (false until the first pass completes)
 * and `error` (a System-style message when startup failed).
 */
export function useAppBootstrap() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Store actions are read via getState() at call time — nothing is closed over,
    // so the empty dependency list below is honest (this effect runs exactly once).

    let dataLoaded = false;

    // Advance the campaign timeline (evaluate elapsed days → keys/dungeons/rank),
    // then refresh the views that depend on it.
    async function advanceTimeline() {
      await DailyTimelineService.tick();
      // Inventory included: a tick can enforce the penalty, which wipes rewards.
      await Promise.all([
        usePlayerStore.getState().refreshFromLocal(),
        useQuestStore.getState().load(),
        useGoalStore.getState().load(),
        useInventoryStore.getState().load(),
      ]);
    }

    // Load the per-Hunter domain data. Runs only when logged in (the first login
    // seeds this device from the API with the Bearer token). Guarded so it runs at
    // most once per session.
    async function loadData() {
      if (dataLoaded) return;
      dataLoaded = true;
      // Load all stores in parallel, then advance the timeline for elapsed days.
      await Promise.all([
        usePlayerStore.getState().load(),
        useQuestStore.getState().load(),
        useGoalStore.getState().load(),
        useInventoryStore.getState().load(),
        useTrainingStore.getState().load(),
        // Also rehydrates any focus timer that was running when the app was killed.
        useTimeLogStore.getState().load(),
      ]);
      await advanceTimeline();
    }

    async function boot() {
      try {
        // 0. Resolve the session first — everything below depends on logged-in state.
        await useAuthStore.getState().initialize();

        // 1. Request notification permissions
        await NotificationService.requestPermissions();

        // 2. Schedule the daily 8am quest reminder
        await NotificationService.scheduleDailyQuestReminder(8, 0).catch(() => {});

        // 3. Register background fetch task
        await registerBackgroundTasks().catch(() => {});

        // 4. Only touch the network / seed data when a Hunter is signed in. When
        //    logged out we go straight to ready so the Login screen shows and NO
        //    /api/* call fires (they would 401 without a token).
        if (useAuthStore.getState().status === 'loggedIn') {
          await loadData();
        }
      } catch (e) {
        if (ENV.IS_DEV) {
          console.error('[Bootstrap] startup failed:', e);
        }
        setError(e instanceof Error ? e.message : 'The System failed to initialize.');
      } finally {
        // Always leave the loading screen — a failed boot shows the error state
        // instead of hanging on "[Initializing...]" forever.
        setReady(true);
      }
    }

    boot();

    // First login within a running session: seed this device's data once status
    // flips to loggedIn. (Bootstrap already handles the launch-time logged-in case.)
    const unsubAuth = useAuthStore.subscribe((state, prev) => {
      if (state.status === 'loggedIn' && prev.status !== 'loggedIn') {
        loadData().catch((e) => {
          if (ENV.IS_DEV) console.error('[Bootstrap] loadData failed:', e);
        });
      }
      // A logout ends the session — allow a future login to reseed.
      if (state.status === 'loggedOut' && prev.status === 'loggedIn') {
        dataLoaded = false;
      }
    });

    // Re-sync when the device comes back online — only while logged in.
    const unsubNet = onConnectivityChange((online) => {
      if (online && useAuthStore.getState().status === 'loggedIn') {
        useInventoryStore.getState().load();
      }
    });

    // Advance the timeline whenever the app returns to the foreground — only while
    // logged in (and after data has been loaded once).
    const unsubApp = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active' && useAuthStore.getState().status === 'loggedIn' && dataLoaded) {
        advanceTimeline().catch(() => {});
        // A timer left running past the session ceiling is auto-closed here.
        useTimeLogStore
          .getState()
          .reconcileRunning()
          .catch(() => {});
      }
    });

    return () => {
      unsubAuth();
      unsubNet();
      unsubApp.remove();
    };
  }, []);

  return { ready, error };
}
