import { colors } from './motion';

/** Font family names, as registered in app/_layout.tsx. */
export const fonts = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  mono: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  /** Only for the "pebl." wordmark. */
  wordmark: 'BricolageGrotesque_700Bold',
};

/** Surface and text colours for the dark UI, built on the brand palette. */
export const ui = {
  bg: colors.black,
  card: colors.ink,
  line: '#2C2C2E',
  text: colors.pearl,
  muted: '#A1A1A6',
  faint: '#8E8E93', // ~6:1 on black, ~5:1 on ink (WCAG AA for text)
  accent: colors.rose,
  danger: '#FF6B81',
};

/** Smallest touch target we allow. */
export const TAP = 48;
