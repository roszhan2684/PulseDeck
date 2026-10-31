import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii, space } from '@/theme';
import type { Profile } from '@/types/domain';
import { Avatar, Text } from '../ui';

export function TypingIndicator({ people }: { people: Profile[] }) {
  if (!people.length) return null;
  const names = people.map((p) => p.displayName.split(' ')[0]);
  const label = names.length === 1 ? `${names[0]} is typing` : `${names.join(' and ')} are typing`;
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.row} accessibilityLiveRegion="polite" accessibilityLabel={label}>
      <Avatar uri={people[0].avatarUrl} name={people[0].displayName} size={24} />
      <View style={styles.bubble}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} delay={i * 140} />
        ))}
      </View>
      <Text variant="caption" color="textSubtle">
        {label}…
      </Text>
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const reduced = useReducedMotionPref();
  const y = useSharedValue(0);
  useEffect(() => {
    if (!reduced) y.set(withDelay(delay, withRepeat(withSequence(withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 })), -1)));
  }, [delay, reduced, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }], opacity: 0.5 + Math.abs(y.get()) / 8 }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
  bubble: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.lg, backgroundColor: colors.surfaceRaised },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
});
