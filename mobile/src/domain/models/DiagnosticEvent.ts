/** Severity of a System Monitor event. */
export type DiagnosticLevel = 'debug' | 'info' | 'warn' | 'error';

/** Which part of the ecosystem an event came from. */
export type DiagnosticCategory =
  'api' | 'error' | 'lifecycle' | 'timeline' | 'timer' | 'sync' | 'kotodama' | 'perf';

/**
 * One technical-health event recorded by the System Monitor while a recording
 * window is open. `data` is a small, already-redacted JSON object: never tokens,
 * request bodies or the Hunter's own text.
 */
export interface DiagnosticEvent {
  id?: number;
  /** ISO timestamp. */
  at: string;
  level: DiagnosticLevel;
  category: DiagnosticCategory;
  message: string;
  data?: Record<string, unknown>;
}
