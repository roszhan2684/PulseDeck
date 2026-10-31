import type { ReactNode } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { usePresence } from '@/hooks/usePresence';
import { colors, radii } from '@/theme';
import { gesture, springs } from '@/theme/motion';

export interface MediaRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SharedMediaTransitionProps {
  visible: boolean;
  /** Window-space rect of the thumbnail being expanded (from `measureInWindow`). */
  origin: MediaRect | null;
  onClose: () => void;
  /** Media content; it is laid out to fill the animating frame. */
  children: ReactNode;
  /** Overlay content (caption, actions) that fades in once expanded. */
  overlay?: ReactNode;
}

/**
 * Expands media from its on-screen rect to full screen (soft spring) and back.
 * Drag down to dismiss with velocity awareness. Reduced motion: a plain cross-fade.
 */
export function SharedMediaTransition({ visible, origin, onClose, children, overlay }: SharedMediaTransitionProps) {
  const { width: W, height: H } = useWindowDimensions();
  const { mounted, progress, reduced } = usePresence(visible, 'soft');
  const dragY = useSharedValue(0);
  const o = origin ?? { x: W * 0.1, y: H * 0.2, width: W * 0.8, height: H * 0.5 };

  const pan = usePanGesture({
    activeOffsetY: [-10, 10],
    onUpdate: (e) => {
      'worklet';
      dragY.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > gesture.sheetDismissDistance || e.velocityY > gesture.sheetDismissVelocity) {
        scheduleOnRN(onClose);
        dragY.set(withSpring(0, springs.soft));
      } else {
        dragY.set(withSpring(0, springs.standard));
      }
    },
  });

  const frame = useAnimatedStyle(() => {
    const p = progress.get();
    const shrink = interpolate(dragY.get(), [0, H], [1, 0.6], Extrapolation.CLAMP);
    if (reduced) return { left: 0, top: 0, width: W, height: H, opacity: p, borderRadius: 0 };
    return {
      left: interpolate(p, [0, 1], [o.x, 0]),
      top: interpolate(p, [0, 1], [o.y, 0]),
      width: interpolate(p, [0, 1], [o.width, W]),
      height: interpolate(p, [0, 1], [o.height, H]),
      borderRadius: interpolate(p, [0, 1], [radii.xl, 0]) + (1 - shrink) * 60,
      transform: [{ translateY: dragY.get() }, { scale: shrink }],
    };
  });
  const backdrop = useAnimatedStyle(() => ({
    opacity: progress.get() * interpolate(dragY.get(), [0, 300], [1, 0.2], Extrapolation.CLAMP),
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0.7, 1], [0, 1], Extrapolation.CLAMP) * interpolate(dragY.get(), [0, 80], [1, 0], Extrapolation.CLAMP),
  }));

  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdrop]} />
      <GestureDetector gesture={pan}>
        <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
          <Animated.View style={[styles.frame, frame]}>{children}</Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]} pointerEvents="box-none">
            {overlay}
          </Animated.View>
        </View>
      </GestureDetector>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.bg },
  frame: { position: 'absolute', overflow: 'hidden', backgroundColor: colors.surface },
});
