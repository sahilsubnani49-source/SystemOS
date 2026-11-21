import type { Save } from './schema';

// The player's reading fonts. Pixel faces suit the look, but dense kanji like 曜 or 議
// blur at pixel resolution, so the menu offers clearer faces. Pure: the renderer maps
// each choice to an actual font.

/** pixel: DotGothic16. textbook: Klee One, drawn like the strokes in a school textbook. clear: the phone's own font. */
export type JaFont = 'pixel' | 'textbook' | 'clear';
/** pixel: Press Start 2P. clear: the phone's own font. */
export type LatinFont = 'pixel' | 'clear';

export interface FontSettings {
  ja: JaFont;
  latin: LatinFont;
}

export const DEFAULT_FONTS: FontSettings = { ja: 'pixel', latin: 'pixel' };
export const JA_FONTS: readonly JaFont[] = ['pixel', 'textbook', 'clear'];
export const LATIN_FONTS: readonly LatinFont[] = ['pixel', 'clear'];

/** A save's fonts, with the pixel defaults for saves written before the setting existed. */
export function fontSettings(save: Pick<Save, 'font'> | null | undefined): FontSettings {
  const f = save?.font ?? {};
  return {
    ja: (JA_FONTS as readonly string[]).includes(f.ja ?? '') ? (f.ja as JaFont) : DEFAULT_FONTS.ja,
    latin: (LATIN_FONTS as readonly string[]).includes(f.latin ?? '') ? (f.latin as LatinFont) : DEFAULT_FONTS.latin,
  };
}
