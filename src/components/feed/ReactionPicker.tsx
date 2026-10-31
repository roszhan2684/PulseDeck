import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii, shadows, space } from '@/theme';
import { stagger } from '@/theme/motion';
import { REACTION_TYPES, type ReactionType } from '@/types/domain';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Text } from '../ui';

export interface ReactionPickerProps {
  /** Window-space point to anchor the picker above. Null hides it. */
  anchor: { x: number; y: number } | null;
  selected: ReactionType[];
  onSelect: (r: ReactionType) => void;
  onDismiss: () => void;
}

/** Long-press quick reaction menu. Emojis spring in one after another. */
export function ReactionPicker({ anchor, selected, onSelect, onDismiss }: ReactionPickerProps) {
  const reduced = useReducedMotionPref();
  const { width } = useWindowDimensions();
  if (!anchor) return null;
  const pickerWidth = REACTION_TYPES.length * 52 + space.sm * 2;
  const left = Math.min(Math.max(space.md, anchor.x - pickerWidth / 2), width - pickerWidth - space.md);
  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="Close reactions" accessibilityRole="button" />
      <Animated.View entering={FadeIn.duration(120)} exiting={FadeOut.duration(120)} style={[styles.picker, { left, top: Math.max(space.md, anchor.y - 84), width: pickerWidth }]} accessibilityRole="menu">
        {REACTION_TYPES.map((r, i) => (
          <Animated.View key={r} entering={reduced ? FadeIn : ZoomIn.springify().damping(12).delay(i * stagger * 0.6)}>
            <AnimatedPressable onPress={() => onSelect(r)} scaleTo={1.25} haptic="selection" style={[styles.item, selected.includes(r) && styles.selected]} accessibilityRole="menuitem" accessibilityLabel={`React ${r}`} accessibilityState={{ selected: selected.includes(r) }}>
              <Text style={styles.emoji}>{r}</Text>
            </AnimatedPressable>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { position: 'absolute', flexDirection: 'row', padding: space.xs, borderRadius: radii.pill, backgroundColor: colors.surfaceRaised, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, ...shadows.md },
  item: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: colors.primaryMuted },
  emoji: { fontSize: 30, lineHeight: 36 },
});
