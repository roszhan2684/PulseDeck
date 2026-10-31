import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii, space } from '@/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Placeholder block with a slow breathing pulse (static under reduced motion). Size it like the final content. */
export function Skeleton({ width = '100%', height = 16, radius = radii.sm, style }: SkeletonProps) {
  const reduced = useReducedMotionPref();
  const o = useSharedValue(0.5);
  useEffect(() => {
    if (!reduced) o.set(withRepeat(withTiming(1, { duration: 900 }), -1, true));
  }, [reduced, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.get() }));
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceRaised }, anim, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />;
}

/** Skeleton matching ChallengeCard so the home screen doesn't shift when data lands. */
export function ChallengeCardSkeleton() {
  return (
    <View style={sk.card} accessibilityLabel="Loading challenge" accessible>
      <Skeleton width={90} height={24} radius={radii.pill} />
      <View style={{ flex: 1 }} />
      <Skeleton width="85%" height={30} />
      <Skeleton width="60%" height={30} />
      <Skeleton width="100%" height={52} radius={radii.pill} style={{ marginTop: space.md }} />
    </View>
  );
}

export function RowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={{ gap: space.md }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={sk.row}>
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="50%" height={14} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  card: { height: 440, borderRadius: radii.xl, backgroundColor: colors.surface, padding: space.xl, gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
