import type { ReactNode } from 'react';
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { haptics } from '@/lib/haptics';
import { press, springs } from '@/theme/motion';

const AnimatedBase = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style' | 'children'> {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale while pressed. Defaults to `motion.press.scale` (0.96). */
  scaleTo?: number;
  /** Optional haptic fired on press. Use sparingly. */
  haptic?: keyof typeof haptics;
}

/** Pressable with snappy spring scale feedback. Falls back to an opacity dip under reduced motion. */
export function AnimatedPressable({ children, style, scaleTo = press.scale, haptic, onPressIn, onPressOut, onPress, disabled, ...rest }: AnimatedPressableProps) {
  const reduced = useReducedMotionPref();
  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: reduced ? interpolate(pressed.get(), [0, 1], [1, 0.7]) : 1,
    transform: [{ scale: reduced ? 1 : interpolate(pressed.get(), [0, 1], [1, scaleTo]) }],
  }));

  return (
    <AnimatedBase
      accessibilityRole="button"
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e: GestureResponderEvent) => {
        pressed.set(withSpring(1, springs.snappy));
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        pressed.set(withSpring(0, springs.snappy));
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) haptics[haptic]();
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedBase>
  );
}
