import type { TextStyle } from 'react-native';

export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  heading: 'BricolageGrotesque_700Bold',
  headingMedium: 'BricolageGrotesque_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/** Type scale. Bricolage Grotesque for personality, Inter for legibility. */
export const typography = {
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -1.2 },
  h1: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  h2: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  h3: { fontFamily: fonts.headingMedium, fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontFamily: fonts.bodySemibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  button: { fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 20 },
  metric: { fontFamily: fonts.heading, fontSize: 28, lineHeight: 32, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
