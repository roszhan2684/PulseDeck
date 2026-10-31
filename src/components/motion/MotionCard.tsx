import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii } from '@/theme';
import { press, presets } from '@/theme/motion';
import { AnimatedPressable } from './AnimatedPressable';

export interface MotionCardProps {
  children: ReactNode;
  /** Position in a list; drives the entrance stagger. */
  index?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Surface card with staggered entrance and press feedback (standard spring family). */
export function MotionCard({ children, index = 0, onPress, accessibilityLabel, style }: MotionCardProps) {
  const reduced = useReducedMotionPref();
  return (
    <Animated.View entering={presets.enter(reduced, index)} layout={presets.layout(reduced)}>
      {onPress ? (
        <AnimatedPressable onPress={onPress} scaleTo={press.cardScale} accessibilityLabel={accessibilityLabel} style={[styles.card, style]}>
          {children}
        </AnimatedPressable>
      ) : (
        <Animated.View style={[styles.card, style]}>{children}</Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
});
