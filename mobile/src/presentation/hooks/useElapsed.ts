import { useEffect, useState } from 'react';

/**
 * Seconds elapsed since `startIso`, recomputed every second. Returns 0 when null.
 * The value is DERIVED from the timestamp (now − start), so it stays correct across
 * re-renders and app restarts — the interval just forces a re-render to tick.
 */
export function useElapsedSeconds(startIso: string | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startIso) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [startIso]);

  if (!startIso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(startIso).getTime()) / 1000));
}

/**
 * Allotted time per difficulty rank, in seconds — the countdown budget for a quest
 * once accepted. Mirrors the effort estimates shown in the UI.
 */
export const EFFORT_SECONDS: Record<string, number> = {
  E: 1 * 60 * 60, // 1 hour
  D: 2 * 60 * 60, // 2 hours
  C: 4 * 60 * 60, // 4 hours
  B: 6 * 60 * 60, // 6 hours
  A: 8 * 60 * 60, // 8 hours
  S: 12 * 60 * 60, // 12 hours
};

/**
 * Seconds remaining in a countdown that started at `startIso` with a `totalSeconds`
 * budget. Clamped at 0 (never negative). Ticks every second while running.
 */
export function useCountdownSeconds(startIso: string | null, totalSeconds: number): number {
  const elapsed = useElapsedSeconds(startIso);
  return Math.max(0, totalSeconds - elapsed);
}

/** Format seconds as mm:ss, or h:mm:ss past an hour. */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
