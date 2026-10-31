import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Text } from '@/components/ui';
import { colors, radii } from '@/theme';

export interface MotionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

const THUMB = 24;

/** Gesture-driven slider: the thumb tracks the finger on the UI thread; JS only receives stepped values. */
export function MotionSlider({ label, value, min, max, step, onChange }: MotionSliderProps) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const last = useSharedValue(value);
  const usable = Math.max(1, width - THUMB);

  useEffect(() => {
    if (width) x.set(((value - min) / (max - min)) * usable);
  }, [value, min, max, usable, width, x]);

  const setFromX = (px: number) => {
    'worklet';
    const clamped = Math.max(0, Math.min(usable, px - THUMB / 2));
    x.set(clamped);
    const v = Math.round(((clamped / usable) * (max - min) + min) / step) * step;
    const rounded = Number(v.toFixed(3));
    if (rounded !== last.get()) {
      last.set(rounded);
      scheduleOnRN(onChange, rounded);
    }
  };
  const pan = usePanGesture({
    activeOffsetX: [-2, 2],
    failOffsetY: [-12, 12],
    onBegin: (e) => {
      'worklet';
      setFromX(e.x);
    },
    onUpdate: (e) => {
      'worklet';
      setFromX(e.x);
    },
  });
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const fill = useAnimatedStyle(() => ({ width: x.get() + THUMB / 2 }));
  const nudge = (dir: 1 | -1) => onChange(Math.max(min, Math.min(max, Number((value + dir * step).toFixed(3)))));

  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text variant="caption" color="textMuted">
          {label}
        </Text>
        <Text variant="caption" style={{ fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </View>
      <GestureDetector gesture={pan}>
        <View
          style={styles.hit}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min, max, now: value }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
        >
          <View style={styles.track}>
            <Animated.View style={[styles.fill, fill]} />
          </View>
          <Animated.View style={[styles.thumb, thumb]} />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  hit: { height: 36, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  thumb: { position: 'absolute', left: 0, width: THUMB, height: THUMB, borderRadius: radii.pill, backgroundColor: colors.white, borderWidth: 3, borderColor: colors.primary },
});

