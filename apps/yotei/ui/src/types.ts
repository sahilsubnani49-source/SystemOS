import type { PlanDraft } from '@yotei/core';

/**
 * The ONLY contract a host app sees. Yotei never imports from a host; a host talks to
 * it exclusively through these props.
 */
export interface YoteiAppProps {
  /**
   * Structure a planner .md (the host calls POST /api/yotei/parse with its own auth and
   * maps the response with draftFromWire). Throw an Error with a readable message on
   * failure: it is shown to the user as-is.
   */
  parsePlan: (markdown: string) => Promise<PlanDraft>;
  /** Host closes Yotei (SystemOS pops its modal). Omit in the standalone app. */
  onExit?: () => void;
  /** SQLite file Yotei owns. Separate from any host database. */
  databaseName?: string;
  /** Optional bridge for a host's monitoring: failures with technical detail only. */
  onDiagnostic?: (event: YoteiDiagnostic) => void;
}

export interface YoteiDiagnostic {
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}
