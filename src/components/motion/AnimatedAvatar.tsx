import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors } from '@/theme';
import { easing, springs } from '@/theme/motion';

export interface AnimatedAvatarProps {
  uri: string;
  size?: number;
  /** "Pulse ring": animated heartbeat ring meaning "posted today / active now". */
  pulse?: boolean;
  /** Selection state with animated border (onboarding avatar picker). */
  selected?: boolean;
  ringColor?: string;
  accessibilityLabel?: string;
}

/** Avatar with animated selection border and an optional pulse ring. */
export function AnimatedAvatar({ uri, size = 48, pulse = false, selected = false, ringColor = colors.lime, accessibilityLabel }: AnimatedAvatarProps) {
  const reduced = useReducedMotionPref();
  const sel = useSharedValue(selected ? 1 : 0);
  const beat = useSharedValue(0);

  useEffect(() => {
    sel.set(reduced ? withTiming(selected ? 1 : 0) : withSpring(selected ? 1 : 0, springs.snappy));
  }, [selected, reduced, sel]);

  useEffect(() => {
    beat.set(pulse && !reduced ? withRepeat(withTiming(1, { duration: 1600, easing: easing.standard }), -1, false) : 0);
  }, [pulse, reduced, beat]);

  const ring = size + 8;
  const border = useAnimatedStyle(() => ({
    borderColor: interpolateColor(sel.get(), [0, 1], [pulse ? ringColor : colors.border, colors.primary]),
    borderWidth: interpolate(sel.get(), [0, 1], [pulse ? 2 : 1, 3]),
    transform: [{ scale: interpolate(sel.get(), [0, 1], [1, 1.06]) }],
  }));
  const wave = useAnimatedStyle(() => ({
    opacity: interpolate(beat.get(), [0, 1], [0.55, 0]),
    transform: [{ scale: interpolate(beat.get(), [0, 1], [1, 1.35]) }],
  }));

  return (
    <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }}>
      {pulse && !reduced && <Animated.View style={[styles.abs, { width: ring, height: ring, borderRadius: ring / 2, borderColor: ringColor }, wave]} />}
      <Animated.View style={[styles.abs, { width: ring, height: ring, borderRadius: ring / 2 }, border]} />
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.surfaceRaised }} contentFit="cover" transition={180} recyclingKey={uri} />
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute', borderWidth: 2 } });
