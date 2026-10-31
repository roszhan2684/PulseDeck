import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { usePresence } from '@/hooks/usePresence';
import { colors, radii, space } from '@/theme';

export interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  accessibilityLabel?: string;
}

/** Centered dialog using the `soft` spring. Scales in from 0.9; fades only under reduced motion. */
export function AnimatedModal({ visible, onClose, children, accessibilityLabel }: AnimatedModalProps) {
  const { mounted, progress, reduced } = usePresence(visible, 'soft');
  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const content = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: reduced ? 1 : interpolate(progress.get(), [0, 1], [0.9, 1]) }, { translateY: reduced ? 0 : interpolate(progress.get(), [0, 1], [24, 0]) }],
  }));
  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close dialog" accessibilityRole="button" />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, content]} accessibilityViewIsModal accessibilityLabel={accessibilityLabel}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  center: { flex: 1, justifyContent: 'center', padding: space.xl },
  card: { backgroundColor: colors.surfaceRaised, borderRadius: radii.xl, padding: space.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
});
