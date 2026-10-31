import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  GestureDetector,
  useCompetingGestures,
  useExclusiveGestures,
  useLongPressGesture,
  usePanGesture,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
  type WithSpringConfig,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { colors, radii, shadows } from '@/theme';
import { gesture, springs, timings } from '@/theme/motion';

export interface SwipeDeckConfig {
  /** Fraction of card width that commits a swipe. */
  distanceRatio: number;
  /** Release velocity (pt/s) that commits a swipe regardless of distance. */
  velocity: number;
  maxRotation: number;
  backScale: number;
  spring: WithSpringConfig;
}

export interface SwipeDeckProps<T> {
  data: T[];
  /** Controlled index of the top card. Changing it externally animates the deck (used by a11y buttons). */
  index: number;
  onIndexChange: (index: number) => void;
  renderCard: (item: T, index: number, isTop: boolean) => ReactNode;
  keyExtractor: (item: T) => string;
  width: number;
  height: number;
  onTap?: (item: T) => void;
  onDoubleTap?: (item: T, point: { x: number; y: number }) => void;
  onLongPress?: (item: T, point: { x: number; y: number }) => void;
  /** Override tuning (Motion Lab). Defaults come from `theme/motion`. */
  config?: Partial<SwipeDeckConfig>;
}

/**
 * Physics-based card stack. A single shared `position` (in card units) drives every card:
 * offset = cardIndex - position. offset < 0 → leaving left, 0 → top, > 0 → stacked behind.
 * Swipe left = next, swipe right = previous (the previous card follows the finger back in).
 * Everything runs on the UI thread; JS only hears about the settled index.
 */
export function SwipeDeck<T>({ data, index, onIndexChange, renderCard, keyExtractor, width, height, onTap, onDoubleTap, onLongPress, config }: SwipeDeckProps<T>) {
  const cfg: SwipeDeckConfig = {
    distanceRatio: gesture.swipeDistanceRatio,
    velocity: gesture.swipeVelocity,
    maxRotation: gesture.maxRotationDeg,
    backScale: gesture.backCardScale,
    spring: springs.standard,
    ...config,
  };
  const reduced = useReducedMotionPref();
  const position = useSharedValue(index);
  const start = useSharedValue(index);
  const last = Math.max(0, data.length - 1);

  useEffect(() => {
    if (Math.round(position.get()) !== index) {
      position.set(reduced ? withTiming(index, timings.standard) : withSpring(index, cfg.spring));
    }
    // cfg.spring identity changes each render; only the index should retrigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, reduced, position]);

  const pan = usePanGesture({
    activeOffsetX: [-12, 12],
    failOffsetY: [-24, 24],
    onActivate: () => {
      'worklet';
      start.set(position.get());
    },
    onUpdate: (e) => {
      'worklet';
      const next = start.get() - e.translationX / width;
      // Rubber-band past the first and last card.
      const banded = next < 0 ? next * 0.25 : next > last ? last + (next - last) * 0.25 : next;
      position.set(banded);
    },
    onDeactivate: (e) => {
      'worklet';
      const base = Math.round(start.get());
      const dx = -e.translationX / width;
      const v = -e.velocityX;
      let target = base;
      if (dx > cfg.distanceRatio || v > cfg.velocity) target = base + 1;
      else if (dx < -cfg.distanceRatio || v < -cfg.velocity) target = base - 1;
      target = Math.max(0, Math.min(last, target));
      position.set(reduced ? withTiming(target, timings.standard) : withSpring(target, { ...cfg.spring, velocity: v / width }));
      if (target !== base) scheduleOnRN(onIndexChange, target);
    },
  });

  const current = () => data[index];
  const singleTap = useTapGesture({ runOnJS: true, onActivate: () => current() && onTap?.(current()) });
  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    maxDelay: gesture.doubleTapMaxDelayMs,
    runOnJS: true,
    onActivate: (e) => current() && onDoubleTap?.(current(), { x: e.x, y: e.y }),
  });
  const longPress = useLongPressGesture({
    minDuration: gesture.longPressMs,
    runOnJS: true,
    onActivate: (e) => current() && onLongPress?.(current(), { x: e.x, y: e.y }),
  });
  const taps = useExclusiveGestures(doubleTap, singleTap);
  const composed = useCompetingGestures(pan, longPress, taps);

  const from = Math.max(0, index - 2);
  const to = Math.min(data.length, index + 4);

  return (
    <GestureDetector gesture={composed}>
      <View style={{ width, height }} accessibilityRole="adjustable" accessibilityLabel={`Card ${index + 1} of ${data.length}`}>
        {data.slice(from, to).map((item, k) => {
          const i = from + k;
          return (
            <DeckCard key={keyExtractor(item)} i={i} zIndex={data.length - i} position={position} width={width} height={height} cfg={cfg} reduced={reduced}>
              {renderCard(item, i, i === index)}
            </DeckCard>
          );
        })}
      </View>
    </GestureDetector>
  );
}

interface DeckCardProps {
  i: number;
  zIndex: number;
  position: SharedValue<number>;
  width: number;
  height: number;
  cfg: SwipeDeckConfig;
  reduced: boolean;
  children: ReactNode;
}

function DeckCard({ i, zIndex, position, width, height, cfg, reduced, children }: DeckCardProps) {
  const style = useAnimatedStyle(() => {
    const offset = i - position.get();
    if (reduced) {
      return {
        opacity: interpolate(offset, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP),
        transform: [{ translateX: interpolate(offset, [-1, 0], [-20, 0], Extrapolation.CLAMP) }],
      };
    }
    const leaving = Math.min(offset, 0);
    const behind = Math.max(offset, 0);
    return {
      opacity: interpolate(offset, [-1.3, -1, 2, 2.8], [0, 1, 1, 0], Extrapolation.CLAMP),
      transform: [
        { translateX: leaving * width * gesture.exitMultiplier },
        { translateY: interpolate(behind, [0, 1, 2], [0, gesture.backCardOffsetY, gesture.backCardOffsetY * 1.8], Extrapolation.CLAMP) },
        { rotate: `${leaving * cfg.maxRotation}deg` },
        { scale: interpolate(behind, [0, 1, 2], [1, cfg.backScale, cfg.backScale - 0.05], Extrapolation.CLAMP) },
      ],
    };
  });
  const dim = useAnimatedStyle(() => ({
    opacity: reduced ? 0 : interpolate(i - position.get(), [0, 1], [0, 0.45], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.card, { width, height, zIndex }, style]}>
      {children}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, dim]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', borderRadius: radii.xl, overflow: 'hidden', backgroundColor: colors.surface, transformOrigin: 'bottom', ...shadows.md },
  dim: { backgroundColor: colors.bg },
});
