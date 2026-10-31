import { useEffect } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { typography, type ColorToken, type TypographyVariant } from '@/theme';
import { springs } from '@/theme/motion';
import { Text } from '../ui/Text';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export interface AnimatedCounterProps {
  value: number;
  variant?: TypographyVariant;
  color?: ColorToken;
  prefix?: string;
  suffix?: string;
  /** Format the number (e.g. thousands separators). Digits roll, other characters stay put. */
  format?: (n: number) => string;
  accessibilityLabel?: string;
}

/**
 * NumberFlow-style rolling counter. Each digit is a vertical strip of 0–9 that springs
 * to its new position, so 41 → 42 rolls only the last digit. Instant under reduced motion.
 */
export function AnimatedCounter({ value, variant = 'metric', color = 'text', prefix = '', suffix = '', format = (n) => n.toLocaleString('en-US'), accessibilityLabel }: AnimatedCounterProps) {
  const chars = `${prefix}${format(value)}${suffix}`.split('');
  const style = typography[variant] as TextStyle;
  const height = style.lineHeight ?? 24;
  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={accessibilityLabel ?? `${prefix}${value}${suffix}`}>
      {chars.map((ch, i) => {
        const key = chars.length - i; // key from the right so units keep identity as numbers grow
        return /\d/.test(ch) ? (
          <Digit key={key} digit={Number(ch)} height={height} variant={variant} color={color} />
        ) : (
          <Text key={key} variant={variant} color={color} style={{ height }}>
            {ch}
          </Text>
        );
      })}
    </View>
  );
}

function Digit({ digit, height, variant, color }: { digit: number; height: number; variant: TypographyVariant; color: ColorToken }) {
  const reduced = useReducedMotionPref();
  const y = useSharedValue(-digit * height);
  useEffect(() => {
    y.set(reduced ? withTiming(-digit * height, { duration: 0 }) : withSpring(-digit * height, springs.standard));
  }, [digit, height, reduced, y]);
  const strip = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return (
    <View style={{ height, overflow: 'hidden' }} importantForAccessibility="no-hide-descendants">
      <Animated.View style={strip}>
        {DIGITS.map((d) => (
          <Text key={d} variant={variant} color={color} style={{ height, fontVariant: ['tabular-nums'] }}>
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-start' } });
