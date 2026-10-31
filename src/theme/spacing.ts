import type { ViewStyle } from 'react-native';

/** 4pt spacing scale: 4 8 12 16 20 24 32 40 48. */
export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 48 } as const;

export const radii = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, xxl: 36, pill: 999 } as const;

export const layout = {
  screenPadding: space.lg,
  minTouchTarget: 44,
  tabBarHeight: 64,
  maxContentWidth: 520,
} as const;

export const shadows = {
  sm: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  md: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  glow: { shadowColor: '#7C5CFF', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
} satisfies Record<string, ViewStyle>;

export const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 } as const;
