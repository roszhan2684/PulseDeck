import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { usePresence } from '@/hooks/usePresence';
import { colors, radii, space } from '@/theme';
import { gesture, springs } from '@/theme/motion';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Bottom sheet: soft spring in, drag the handle area down to dismiss (velocity-aware), keyboard-aware. */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { mounted, progress, reduced } = usePresence(visible, 'soft');
  const drag = useSharedValue(0);

  const pan = usePanGesture({
    activeOffsetY: 8,
    onUpdate: (e) => {
      'worklet';
      drag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      const dismiss = e.translationY > gesture.sheetDismissDistance || e.velocityY > gesture.sheetDismissVelocity;
      if (dismiss) scheduleOnRN(onClose);
      drag.set(withSpring(0, springs.standard));
    },
  });

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const sheet = useAnimatedStyle(() => ({
    opacity: reduced ? progress.get() : 1,
    transform: [{ translateY: (reduced ? 0 : interpolate(progress.get(), [0, 1], [height * 0.6, 0])) + drag.get() }],
  }));

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close sheet" />
      </Animated.View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.end} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }, sheet]} accessibilityViewIsModal>
          <GestureDetector gesture={pan}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
              {title && (
                <Text variant="h3" accessibilityRole="header">
                  {title}
                </Text>
              )}
            </View>
          </GestureDetector>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.overlay },
  end: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surfaceRaised, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, paddingHorizontal: space.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
  handleArea: { alignItems: 'center', paddingTop: space.sm, paddingBottom: space.lg, gap: space.md },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
});
