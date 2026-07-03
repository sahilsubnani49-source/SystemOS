import type { TextStyle, ViewStyle } from 'react-native';
import { Rank, Rarity } from './constants';

export const Colors = {
  background: '#0D0D11',
  surface: '#171721',
  surfaceAlt: '#1A1A2E',
  surfaceBorder: '#1E1E2E',
  primary: '#7F3DFF',
  primaryDim: '#5F00FF',
  accent: '#00E5FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#9E9E9E',
  success: '#00C853',
  warning: '#FFD600',
  error: '#FF1744',
  orange: '#FF9800',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const FontSize = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
} as const;

/**
 * Font families loaded at app boot (App.tsx). `pixel` is the retro-arcade face
 * used app-wide as the primary typeface.
 */
export const Fonts = {
  pixel: 'PressStart2P_400Regular',
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

/**
 * Append an alpha channel to a 6-digit hex color.
 * Replaces fragile `color + '55'` string concatenation.
 * @param alpha 0..1 opacity
 */
export function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const a = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** Quest difficulty rank colors (E → S). Centralized from RankBadge/QuestCard. */
export const RankColors: Record<Rank, string> = {
  E: Colors.accent,
  D: Colors.success,
  C: Colors.warning,
  B: Colors.orange,
  A: Colors.error,
  S: Colors.primary,
};

/**
 * Item rarity tier colors (Common → Legendary).
 * The visual identity of the loot system — defined once, consumed by ItemCard,
 * RewardModal, and InventoryScreen.
 */
export const RarityColors: Record<Rarity, string> = {
  Common: Colors.textSecondary,
  Rare: '#2196F3',
  Epic: Colors.primary,
  Legendary: Colors.orange,
};

/** Elevation presets: soft neutral depth for cards, plus a dynamic rarity glow. */
export const Shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  } as ViewStyle,
  glow: (color: string): ViewStyle => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  }),
};

/** Typography presets capturing the recurring "system/terminal" aesthetic. */
export const Typography = {
  title: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xxl,
    letterSpacing: 1,
    color: Colors.textPrimary,
  } as TextStyle,
  heading: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.lg,
    letterSpacing: 0.5,
    color: Colors.textPrimary,
  } as TextStyle,
  label: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  } as TextStyle,
  system: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.textPrimary,
  } as TextStyle,
  body: {
    fontFamily: Fonts.pixel,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  } as TextStyle,
};
