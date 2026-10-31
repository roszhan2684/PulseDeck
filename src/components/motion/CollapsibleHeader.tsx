import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, gradients, layout, space } from '@/theme';
import { Text } from '../ui/Text';

export const COLLAPSED_BAR = 52;

export interface CollapsibleHeaderProps {
  /** Scroll offset of the screen's Animated.ScrollView. */
  scrollY: SharedValue<number>;
  /** Expanded height, excluding the safe-area inset. */
  height: number;
  imageUri?: string;
  /** Title shown in the compact bar once collapsed. */
  title: string;
  /** Content pinned to the bottom of the expanded header (fades out on collapse). */
  children?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
}

/**
 * Collapsing header with a parallax/stretch background. Scroll drives everything directly
 * (no timers), so it stays in sync at 60fps. Parallax and stretch are disabled under reduced motion.
 */
export function CollapsibleHeader({ scrollY, height, imageUri, title, children, left, right }: CollapsibleHeaderProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotionPref();
  const full = height + insets.top;
  const collapsed = COLLAPSED_BAR + insets.top;
  const range = full - collapsed;

  const container = useAnimatedStyle(() => ({
    height: interpolate(scrollY.get(), [0, range], [full, collapsed], Extrapolation.CLAMP),
  }));
  const image = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: reduced
        ? []
        : [{ translateY: interpolate(y, [-200, 0, range], [-100, 0, -range * 0.45], Extrapolation.CLAMP) }, { scale: interpolate(y, [-200, 0], [1.5, 1], Extrapolation.CLAMP) }],
    };
  });
  const content = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [0, range * 0.6], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: reduced ? 0 : interpolate(scrollY.get(), [0, range], [0, -24], Extrapolation.CLAMP) }],
  }));
  const bar = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [range * 0.6, range], [0, 1], Extrapolation.CLAMP) }));

  return (
    <Animated.View style={[styles.container, container]}>
      {imageUri ? (
        <Animated.View style={[StyleSheet.absoluteFill, { height: full }, image]}>
          <Image source={{ uri: imageUri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <LinearGradient colors={gradients.mediaFade} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : (
        <LinearGradient colors={['#1B1B27', colors.bg]} style={StyleSheet.absoluteFill} />
      )}
      <Animated.View style={[StyleSheet.absoluteFill, styles.barBg, bar]} />
      <Animated.View style={[styles.content, content]}>{children}</Animated.View>
      <View style={[styles.bar, { top: insets.top }]}>
        <View style={styles.side}>{left}</View>
        <Animated.View style={[styles.title, bar]}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {title}
          </Text>
        </Animated.View>
        <View style={[styles.side, styles.right]}>{right}</View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, overflow: 'hidden' },
  barBg: { backgroundColor: colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  content: { position: 'absolute', left: layout.screenPadding, right: layout.screenPadding, bottom: space.lg },
  bar: { position: 'absolute', left: 0, right: 0, height: COLLAPSED_BAR, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.sm },
  side: { minWidth: 48, flexDirection: 'row' },
  right: { justifyContent: 'flex-end' },
  title: { flex: 1, alignItems: 'center' },
});
