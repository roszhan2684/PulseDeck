import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radii, space } from '@/theme';

export interface CardProps {
  children: ReactNode;
  padded?: boolean;
  tone?: 'surface' | 'raised' | 'sunken';
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, padded = true, tone = 'surface', style }: CardProps) {
  return <View style={[styles.base, toneStyles[tone], padded && styles.padded, style]}>{children}</View>;
}

const toneStyles = StyleSheet.create({
  surface: { backgroundColor: colors.surface },
  raised: { backgroundColor: colors.surfaceRaised },
  sunken: { backgroundColor: colors.surfaceSunken },
});

const styles = StyleSheet.create({
  base: { borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  padded: { padding: space.md },
});
