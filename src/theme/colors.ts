/**
 * Color tokens. Dark-first palette tuned for OLED iPhones.
 * Contrast (on `bg`): text 18.6:1, textMuted 8.1:1, textSubtle 4.6:1.
 */
export const colors = {
  bg: '#09090F',
  surface: '#13131C',
  surfaceRaised: '#1B1B27',
  surfaceSunken: '#0E0E15',
  border: '#262635',
  borderStrong: '#383849',

  text: '#F4F4F8',
  textMuted: '#A9A9BC',
  textSubtle: '#7A7A90',
  textInverse: '#09090F',

  primary: '#7C5CFF',
  primaryPressed: '#6A4AF0',
  primaryMuted: 'rgba(124, 92, 255, 0.16)',
  accent: '#FF4F8B',
  accentMuted: 'rgba(255, 79, 139, 0.16)',
  lime: '#C8FF4D',
  limeMuted: 'rgba(200, 255, 77, 0.14)',

  success: '#2EE59D',
  successMuted: 'rgba(46, 229, 157, 0.14)',
  warning: '#FFB547',
  warningMuted: 'rgba(255, 181, 71, 0.14)',
  danger: '#FF5A6E',
  dangerMuted: 'rgba(255, 90, 110, 0.14)',
  info: '#4CC9F0',

  gold: '#FFD15C',
  silver: '#CBD2E1',
  bronze: '#E3A06B',

  overlay: 'rgba(5, 5, 10, 0.72)',
  scrim: 'rgba(0, 0, 0, 0.45)',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export const gradients = {
  pulse: ['#7C5CFF', '#FF4F8B'],
  sunset: ['#FF4F8B', '#FFB547'],
  aurora: ['#4CC9F0', '#7C5CFF'],
  lime: ['#C8FF4D', '#2EE59D'],
  mediaFade: ['rgba(9,9,15,0)', 'rgba(9,9,15,0.55)', 'rgba(9,9,15,0.95)'],
} as const;

/** Category colors for interests, groups and text submissions. */
export const tints = ['#7C5CFF', '#FF4F8B', '#4CC9F0', '#FFB547', '#2EE59D', '#C8FF4D'] as const;

export type ColorToken = keyof typeof colors;
