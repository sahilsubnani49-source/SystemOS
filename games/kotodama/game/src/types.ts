/**
 * The ONLY contract a host app sees. The game never imports from a host; a host
 * talks to the game exclusively through these props.
 */
export interface KotodamaGameProps {
  /** Host closes the game (SystemOS pops its modal). Omit in the standalone app. */
  onExit?: () => void;
  /** Optional bridge: called when a play session ends or the app backgrounds. */
  onStudySession?: (report: StudySessionReport) => void;
  /** SQLite file the game owns. Separate from any host database. */
  databaseName?: string;
}

export interface StudySessionReport {
  startedAt: string;
  endedAt: string;
  /** Minutes the player was actually answering prompts (idle time excluded). */
  activeMinutes: number;
  promptsAnswered: number;
  correct: number;
  /** Kana / kanji ids that reached the top mastery stage this session. */
  itemsMastered: string[];
}
