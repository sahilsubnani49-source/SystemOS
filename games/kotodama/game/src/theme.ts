export const C = {
  ink: '#0B0B12',
  night: '#141428',
  panel: '#1C1A2E',
  panelEdge: '#3B3558',
  paper: '#F4E9D0',
  paperDim: '#CDBF9E',
  gold: '#E8B04B',
  red: '#C0392B',
  crimson: '#8E1F2F',
  sakura: '#F4A7C0',
  jade: '#3FAE7A',
  sky: '#5B8DEF',
  violet: '#8E6CEF',
  hpHigh: '#4CD07D',
  hpMid: '#E8C14B',
  hpLow: '#E8574B',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.55)',
} as const;

/** Font family names registered by useGameFonts(). */
export const F = {
  /** Pixel face WITH Japanese glyphs: all kana/kanji text must use this. */
  ja: 'DotGothic16_400Regular',
  /** Latin-only pixel face for titles and numbers. */
  pixel: 'PressStart2P_400Regular',
} as const;

export function hpColor(fraction: number): string {
  if (fraction > 0.5) return C.hpHigh;
  if (fraction > 0.2) return C.hpMid;
  return C.hpLow;
}
