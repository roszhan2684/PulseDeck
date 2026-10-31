import { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { animateTo } from '@/lib/animation';
import { colors, radii } from '@/theme';

export interface MotionTabIndicatorProps {
  index: number;
  /** Width of one tab/segment. */
  itemWidth: number;
  height?: number;
  inset?: number;
  color?: string;
  style?: ViewStyle;
}

/** Pill that springs between tabs/segments. Place it absolutely inside the tab row. */
export function MotionTabIndicator({ index, itemWidth, height = 36, inset = 4, color = colors.surfaceRaised, style }: MotionTabIndicatorProps) {
  const reduced = useReducedMotionPref();
  const x = useSharedValue(index * itemWidth);
  useEffect(() => {
    x.set(animateTo(index * itemWidth, 'snappy', reduced));
  }, [index, itemWidth, reduced, x]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  if (!itemWidth) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pill, { width: itemWidth - inset * 2, height, left: inset, backgroundColor: color }, style, animated]}
    />
  );
}

const styles = StyleSheet.create({ pill: { position: 'absolute', borderRadius: radii.pill } });
