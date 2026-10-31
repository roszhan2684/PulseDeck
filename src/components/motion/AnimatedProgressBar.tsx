import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { animateTo } from '@/lib/animation';
import { colors, gradients, radii } from '@/theme';

export interface AnimatedProgressBarProps {
  /** 0..1 */
  progress: number;
  height?: number;
  colors?: readonly [string, string, ...string[]];
  accessibilityLabel?: string;
}

/** Gradient progress bar that springs to its value. Used by onboarding and uploads. */
export function AnimatedProgressBar({ progress, height = 6, colors: fill = gradients.pulse, accessibilityLabel = 'Progress' }: AnimatedProgressBarProps) {
  const reduced = useReducedMotionPref();
  const p = useSharedValue(progress);
  useEffect(() => {
    p.set(animateTo(Math.max(0, Math.min(1, progress)), 'standard', reduced));
  }, [progress, reduced, p]);
  const bar = useAnimatedStyle(() => ({ width: `${p.get() * 100}%` }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height }]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
    >
      <Animated.View style={[styles.fill, { borderRadius: height }, bar]}>
        <LinearGradient colors={fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: colors.surfaceRaised, overflow: 'hidden', borderRadius: radii.pill },
  fill: { height: '100%', overflow: 'hidden' },
});
