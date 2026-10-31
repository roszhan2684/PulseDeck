import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, space, type ColorToken } from '@/theme';
import { AnimatedCounter } from '../motion/AnimatedCounter';
import { Text } from '../ui';

export interface StatTileProps {
  label: string;
  value: number;
  emoji: string;
  color?: ColorToken;
}

/** Profile stat that rolls up from 0 when it first appears. */
export function StatTile({ label, value, emoji, color = 'text' }: StatTileProps) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), 220);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.emoji}>{emoji}</Text>
      <AnimatedCounter value={shown} color={color} variant="h1" />
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flexBasis: '47%', flexGrow: 1, padding: space.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 2 },
  emoji: { fontSize: 20, marginBottom: space.xxs },
});
