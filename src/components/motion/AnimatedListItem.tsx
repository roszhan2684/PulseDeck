import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { presets } from '@/theme/motion';

export interface AnimatedListItemProps {
  children: ReactNode;
  /** Stagger index for the entrance. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * List row with entrance, exit and layout transitions.
 * The layout transition is what makes leaderboard rows physically reorder instead of jumping.
 */
export function AnimatedListItem({ children, index = 0, style }: AnimatedListItemProps) {
  const reduced = useReducedMotionPref();
  return (
    <Animated.View entering={presets.enter(reduced, index)} exiting={presets.exit()} layout={presets.layout(reduced)} style={style}>
      {children}
    </Animated.View>
  );
}
