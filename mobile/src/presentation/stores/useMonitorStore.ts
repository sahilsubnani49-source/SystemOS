import { create } from 'zustand';
import { Monitor, type MonitorStatus } from '../../data/services/MonitorService';
import type { DiagnosticEvent, DiagnosticLevel } from '../../domain/models/DiagnosticEvent';

export const MONITOR_DURATIONS: { label: string; ms: number }[] = [
  { label: '30 MIN', ms: 30 * 60_000 },
  { label: '2 H', ms: 2 * 3_600_000 },
  { label: '24 H', ms: 24 * 3_600_000 },
  // "Until stopped": the service caps every window at 7 days.
  { label: 'UNTIL STOP', ms: Number.MAX_SAFE_INTEGER },
];

interface MonitorState extends MonitorStatus {
  counts: Record<DiagnosticLevel, number>;
  events: DiagnosticEvent[];
  filter: DiagnosticLevel;
  busy: boolean;
  refresh: () => Promise<void>;
  start: (ms: number) => Promise<void>;
  stop: () => Promise<void>;
  setFilter: (level: DiagnosticLevel) => Promise<void>;
  loadEvents: () => Promise<void>;
  clear: () => Promise<void>;
  exportText: () => Promise<string>;
}

const EMPTY_COUNTS: Record<DiagnosticLevel, number> = { debug: 0, info: 0, warn: 0, error: 0 };

export const useMonitorStore = create<MonitorState>((set, get) => {
  // Mirror the service's window (it can end on its own while the app is open).
  Monitor.subscribe((s) => set({ activeUntil: s.activeUntil, startedAt: s.startedAt }));

  return {
    ...Monitor.status(),
    counts: EMPTY_COUNTS,
    events: [],
    filter: 'debug',
    busy: false,

    refresh: async () => {
      set({ ...Monitor.status(), counts: await Monitor.counts() });
    },

    start: async (ms) => {
      set({ busy: true });
      try {
        await Monitor.start(ms);
      } finally {
        set({ busy: false });
      }
      await get().refresh();
    },

    stop: async () => {
      set({ busy: true });
      try {
        await Monitor.stop();
      } finally {
        set({ busy: false });
      }
      await get().refresh();
    },

    setFilter: async (filter) => {
      set({ filter });
      await get().loadEvents();
    },

    loadEvents: async () => {
      set({ events: await Monitor.list(get().filter, 200) });
    },

    clear: async () => {
      await Monitor.clear();
      set({ events: [], counts: EMPTY_COUNTS });
    },

    exportText: () => Monitor.exportText(),
  };
});
