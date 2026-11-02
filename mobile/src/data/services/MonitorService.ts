import { Platform } from 'react-native';
import { DiagnosticsRepository } from '../repositories/DiagnosticsRepository';
import { getMeta, setMeta, deleteMeta } from './AppMeta';
import type {
  DiagnosticCategory,
  DiagnosticEvent,
  DiagnosticLevel,
} from '../../domain/models/DiagnosticEvent';

// System Monitor: technical-health logging that runs ONLY inside a recording window
// the Hunter switches on in Settings. Outside a window, log() is a single number
// comparison and writes nothing.
//
// Privacy: events carry routes, statuses, timings, ids and error messages. redact()
// strips anything that could be a credential or the Hunter's own text before it is
// buffered, so a forgotten call site can't leak a token or a bio into an export.

const repo = new DiagnosticsRepository();

const META_UNTIL = 'monitor_until';
const META_STARTED = 'monitor_started';

/** "Until stopped" still ends on its own: a window can never run forever by accident. */
export const MAX_WINDOW_MS = 7 * 24 * 3_600_000;
export const MAX_ROWS = 5_000;
const MAX_AGE_DAYS = 7;
const FLUSH_EVERY_MS = 3_000;
const FLUSH_AT_EVENTS = 25;
const MAX_STRING = 300;
export const EXPORT_LINES = 2_000;

const SECRET_KEY =
  /token|password|secret|authorization|cookie|bio|aspiration|description|note|plan|context|feedback|title/i;

/** Drop sensitive keys and clip long strings, recursively (depth-limited). */
export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string')
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…` : value;
  if (typeof value !== 'object') return value;
  if (depth >= 3) return '[…]';
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(k)) continue;
    out[k] = redact(v, depth + 1);
  }
  return out;
}

export interface MonitorStatus {
  /** Epoch ms the window ends, or null when not recording. */
  activeUntil: number | null;
  startedAt: number | null;
}

let activeUntil: number | null = null;
let startedAt: number | null = null;
let buffer: DiagnosticEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;
const listeners = new Set<(s: MonitorStatus) => void>();

function notify() {
  const status = { activeUntil, startedAt };
  for (const l of listeners) l(status);
}

function isRecording(now = Date.now()): boolean {
  if (activeUntil === null) return false;
  if (now < activeUntil) return true;
  // The window ran out. Close it synchronously FIRST, so nothing below can re-enter.
  void closeWindow('Recording window ended');
  return false;
}

/**
 * End the window: append a closing event straight to the buffer (log() would refuse
 * it, the window being closed), then flush and forget the stored window. activeUntil
 * is cleared before any await, so a second caller sees "not recording" and returns.
 */
async function closeWindow(reason: string): Promise<void> {
  if (activeUntil === null) return;
  activeUntil = null;
  startedAt = null;
  buffer.push({
    at: new Date().toISOString(),
    level: 'info',
    category: 'lifecycle',
    message: reason,
  });
  notify();
  await flush();
  await deleteMeta(META_UNTIL).catch(() => {});
  await deleteMeta(META_STARTED).catch(() => {});
  await repo.prune(MAX_ROWS, MAX_AGE_DAYS).catch(() => {});
}

async function flush(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  // Serialize flushes so a background flush and a timer flush never interleave.
  if (flushing) await flushing;
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  flushing = repo
    .insertMany(batch)
    .catch(() => {
      // Diagnostics must never break the app. A failed batch is dropped.
    })
    .finally(() => {
      flushing = null;
    });
  await flushing;
}

function scheduleFlush() {
  if (buffer.length >= FLUSH_AT_EVENTS) {
    void flush();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(() => void flush(), FLUSH_EVERY_MS);
}

export const Monitor = {
  /** Record an event if a window is open. Never throws, never awaits. */
  log(
    level: DiagnosticLevel,
    category: DiagnosticCategory,
    message: string,
    data?: Record<string, unknown>,
  ): void {
    try {
      if (!isRecording()) return;
      buffer.push({
        at: new Date().toISOString(),
        level,
        category,
        message: message.length > MAX_STRING ? `${message.slice(0, MAX_STRING)}…` : message,
        data: data ? (redact(data) as Record<string, unknown>) : undefined,
      });
      scheduleFlush();
    } catch {
      // Never let logging take the app down.
    }
  },

  /** Log a caught error with its name and message (never its stack's local values). */
  error(
    category: DiagnosticCategory,
    message: string,
    err: unknown,
    data?: Record<string, unknown>,
  ) {
    const e =
      err instanceof Error ? { name: err.name, error: err.message } : { error: String(err) };
    Monitor.log('error', category, message, { ...data, ...e });
  },

  isRecording: () => isRecording(),
  status: (): MonitorStatus => ({ activeUntil, startedAt }),

  subscribe(listener: (s: MonitorStatus) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** Re-open a window that was running when the app was last killed. Call at boot. */
  async hydrate(): Promise<void> {
    const until = Number((await getMeta(META_UNTIL)) ?? NaN);
    const started = Number((await getMeta(META_STARTED)) ?? NaN);
    if (Number.isFinite(until) && until > Date.now()) {
      activeUntil = until;
      startedAt = Number.isFinite(started) ? started : null;
      notify();
      Monitor.log('info', 'lifecycle', 'App started (recording resumed)', platformInfo());
    } else if (Number.isFinite(until)) {
      // Expired while the app was closed.
      await deleteMeta(META_UNTIL);
      await deleteMeta(META_STARTED);
    }
  },

  /** Open a recording window. `durationMs` is clamped to MAX_WINDOW_MS. */
  async start(durationMs: number): Promise<void> {
    const now = Date.now();
    activeUntil = now + Math.min(Math.max(60_000, durationMs), MAX_WINDOW_MS);
    startedAt = now;
    await setMeta(META_UNTIL, String(activeUntil));
    await setMeta(META_STARTED, String(startedAt));
    await repo.prune(MAX_ROWS, MAX_AGE_DAYS).catch(() => {});
    notify();
    Monitor.log('info', 'lifecycle', 'Recording started', {
      ...platformInfo(),
      until: new Date(activeUntil).toISOString(),
    });
  },

  stop: (): Promise<void> => closeWindow('Recording stopped'),

  /** Write buffered events now (call when the app backgrounds). */
  flush,

  async list(minLevel: DiagnosticLevel, limit = 200): Promise<DiagnosticEvent[]> {
    await flush();
    return repo.list({ minLevel, limit });
  },

  async counts(): Promise<Record<DiagnosticLevel, number>> {
    await flush();
    return repo.countByLevel();
  },

  async clear(): Promise<void> {
    buffer = [];
    await repo.clear();
  },

  /** A readable, shareable report: a header, then one line per event (oldest first). */
  async exportText(): Promise<string> {
    await flush();
    const events = (await repo.list({ minLevel: 'debug', limit: EXPORT_LINES })).reverse();
    const counts = await repo.countByLevel();
    const info = platformInfo();
    const header = [
      'SystemOS System Monitor export',
      `Exported: ${new Date().toISOString()}`,
      `Platform: ${info.platform} ${info.osVersion}${info.dev ? ' (dev build)' : ''}`,
      `Window: ${startedAt ? new Date(startedAt).toISOString() : '-'} → ${
        activeUntil ? new Date(activeUntil).toISOString() : 'stopped'
      }`,
      `Events: ${counts.error} error, ${counts.warn} warn, ${counts.info} info, ${counts.debug} debug` +
        (events.length >= EXPORT_LINES ? ` (newest ${EXPORT_LINES} shown)` : ''),
      '',
    ];
    const lines = events.map((e) => formatLine(e));
    return [...header, ...lines].join('\n');
  },
};

export function formatLine(e: DiagnosticEvent): string {
  const data = e.data && Object.keys(e.data).length > 0 ? ` ${JSON.stringify(e.data)}` : '';
  return `${e.at} ${e.level.toUpperCase().padEnd(5)} ${e.category.padEnd(9)} ${e.message}${data}`;
}

function platformInfo() {
  return { platform: Platform.OS, osVersion: String(Platform.Version), dev: __DEV__ };
}
