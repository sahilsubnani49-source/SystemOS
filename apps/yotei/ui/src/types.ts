/**
 * The ONLY contract a host app sees. Yotei never imports from a host; a host talks to
 * it exclusively through these props. Yotei is fully offline: it needs no API, account
 * or token from its host.
 */
export interface YoteiAppProps {
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
