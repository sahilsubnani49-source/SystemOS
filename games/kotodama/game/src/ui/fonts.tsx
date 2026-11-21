import React, { createContext, useContext } from 'react';
import { StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { DEFAULT_FONTS, fontSettings, type FontSettings } from '@kotodama/core';
import { F } from '../theme';
import { useGame } from '../state/context';

// The player's reading fonts (System tab). Every PText and PButton asks this module
// which face to use, so one setting changes the whole game.

/** Registered by GameRoot's useFonts. */
export const TEXTBOOK_JA = 'KleeOne_600SemiBold';

const FontContext = createContext<FontSettings>(DEFAULT_FONTS);

/** Wrap the game: follows the save's font setting (the title screen uses the last save's). */
export function FontProvider({ children }: { children: React.ReactNode }) {
  const font = useGame((s) => s.save?.font);
  return <FontContext.Provider value={fontSettings({ font })}>{children}</FontContext.Provider>;
}

export const useFontSettings = () => useContext(FontContext);

/**
 * The style that puts a text in the chosen face. Press Start 2P is very wide, so
 * every size in the game was picked for it: a normal face at the same size would be
 * tiny, and is scaled up to match.
 */
export function fontStyle(settings: FontSettings, ja: boolean, style: StyleProp<TextStyle>): TextStyle {
  if (ja) {
    if (settings.ja === 'pixel') return { fontFamily: F.ja };
    // undefined: the platform's own Japanese font (Hiragino on iOS, Noto Sans CJK on Android).
    return settings.ja === 'textbook' ? { fontFamily: TEXTBOOK_JA } : { fontFamily: undefined, fontWeight: '500' };
  }
  if (settings.latin === 'pixel') return { fontFamily: F.pixel };
  const flat = StyleSheet.flatten(style) ?? {};
  const size = (flat.fontSize ?? 10) * 1.45;
  return {
    fontFamily: undefined,
    fontWeight: '600',
    fontSize: size,
    lineHeight: Math.max(flat.lineHeight ?? 0, Math.round(size * 1.3)),
    letterSpacing: 0,
  };
}
