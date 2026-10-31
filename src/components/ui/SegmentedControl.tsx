import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { haptics } from '@/lib/haptics';
import { colors, radii } from '@/theme';
import { MotionTabIndicator } from '../motion/MotionTabIndicator';
import { Text } from './Text';

export interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel?: string;
}

/** Segmented control with a spring-driven indicator (MotionTabIndicator). */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const itemWidth = width / options.length;
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <View style={styles.track} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      <MotionTabIndicator index={index} itemWidth={itemWidth} height={34} inset={3} style={{ top: 3 }} />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) haptics.selection();
              onChange(o.value);
            }}
          >
            <Text variant="caption" color={active ? 'text' : 'textMuted'} numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold' }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 40, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
