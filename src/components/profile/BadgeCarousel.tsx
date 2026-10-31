import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii, space } from '@/theme';
import type { Badge } from '@/types/domain';
import { Text } from '../ui';

const ITEM = 148;
const GAP = space.sm;

/** Snapping badge carousel; items scale and brighten as they reach the leading edge. */
export function BadgeCarousel({ badges }: { badges: Badge[] }) {
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => x.set(e.contentOffset.x));
  return (
    <Animated.ScrollView
      horizontal
      onScroll={onScroll}
      scrollEventThrottle={16}
      snapToInterval={ITEM + GAP}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityLabel="Badges"
    >
      {badges.map((b, i) => (
        <BadgeItem key={b.id} badge={b} index={i} x={x} />
      ))}
    </Animated.ScrollView>
  );
}

function BadgeItem({ badge, index, x }: { badge: Badge; index: number; x: SharedValue<number> }) {
  const reduced = useReducedMotionPref();
  const style = useAnimatedStyle(() => {
    const d = Math.abs(index * (ITEM + GAP) - x.get()) / (ITEM + GAP);
    return {
      opacity: interpolate(d, [0, 2.5], [1, 0.55], Extrapolation.CLAMP),
      transform: [{ scale: reduced ? 1 : interpolate(d, [0, 2], [1, 0.9], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Animated.View style={[styles.item, style]} accessible accessibilityLabel={`${badge.title} badge. ${badge.description}`}>
      <View style={styles.medal}>
        <Text style={{ fontSize: 30 }}>{badge.emoji}</Text>
      </View>
      <Text variant="bodyStrong" numberOfLines={1}>
        {badge.title}
      </Text>
      <Text variant="caption" color="textMuted" numberOfLines={2}>
        {badge.description}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: space.lg, gap: GAP },
  item: { width: ITEM, padding: space.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 4 },
  medal: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs, borderWidth: 1, borderColor: colors.borderStrong },
});
