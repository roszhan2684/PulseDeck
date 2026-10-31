import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii, space } from '@/theme';
import { springs } from '@/theme/motion';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
  count?: number;
  disabled?: boolean;
}

/** Selectable chip. Selection pops with a playful spring and tints the background. */
export function Chip({ label, emoji, selected = false, onPress, count, disabled }: ChipProps) {
  const reduced = useReducedMotionPref();
  const s = useSharedValue(selected ? 1 : 0);
  const pop = useSharedValue(1);
  useEffect(() => {
    s.set(withSpring(selected ? 1 : 0, springs.snappy));
    if (selected && !reduced) pop.set(withSequence(withSpring(1.1, springs.playful), withSpring(1, springs.snappy)));
  }, [selected, reduced, s, pop]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(s.get(), [0, 1], [colors.surface, colors.primaryMuted]),
    borderColor: interpolateColor(s.get(), [0, 1], [colors.border, colors.primary]),
    transform: [{ scale: pop.get() }],
  }));
  return (
    <AnimatedPressable onPress={onPress} disabled={disabled} haptic="selection" accessibilityRole="checkbox" accessibilityState={{ checked: selected }} accessibilityLabel={count !== undefined ? `${label} ${count}` : label}>
      <Animated.View style={[styles.base, style]}>
        {emoji && <Text style={styles.emoji}>{emoji}</Text>}
        <Text variant="bodySmall" color={selected ? 'text' : 'textMuted'} style={{ fontFamily: 'Inter_500Medium' }}>
          {label}
        </Text>
        {count !== undefined && (
          <Text variant="caption" color={selected ? 'text' : 'textSubtle'}>
            {count}
          </Text>
        )}
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: space.md, borderRadius: radii.pill, borderWidth: 1.5 },
  emoji: { fontSize: 16 },
});
