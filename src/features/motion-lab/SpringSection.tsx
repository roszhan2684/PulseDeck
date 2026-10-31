import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { simulateSpring, SpringGraph } from '@/components/motion';
import { Button, Chip, Text } from '@/components/ui';
import { colors, radii, space } from '@/theme';
import { duration, springs, timings, type SpringName } from '@/theme/motion';
import { MotionSlider } from './MotionSlider';

/** Springs + duration tokens with a live curve. Tweak, then replay against a real Reanimated spring. */
export function SpringSection({ width }: { width: number }) {
  const [preset, setPreset] = useState<SpringName>('standard');
  const [cfg, setCfg] = useState({ damping: 22, stiffness: 240, mass: 1 });
  const ball = useSharedValue(0);
  const bar = useSharedValue(0);
  const travel = width - 44;
  const { settledAt, overshoot } = simulateSpring(cfg);

  const choose = (name: SpringName) => {
    setPreset(name);
    const s = springs[name];
    setCfg({ damping: s.damping ?? 10, stiffness: s.stiffness ?? 100, mass: s.mass ?? 1 });
  };
  const replay = () => ball.set(withSpring(ball.get() > 0.5 ? 0 : 1, cfg));
  const ballStyle = useAnimatedStyle(() => ({ transform: [{ translateX: ball.get() * travel }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.get() * 100}%` }));

  return (
    <View style={styles.gap}>
      <View style={styles.row}>
        {(Object.keys(springs) as SpringName[]).map((n) => (
          <Chip key={n} label={n} selected={preset === n} onPress={() => choose(n)} />
        ))}
      </View>
      <SpringGraph config={cfg} width={width} />
      <Text variant="caption" color="textMuted">
        Settles in ~{settledAt}ms · overshoot {(overshoot * 100).toFixed(1)}%
      </Text>
      <MotionSlider label="damping" value={cfg.damping} min={1} max={60} step={1} onChange={(damping) => setCfg((c) => ({ ...c, damping }))} />
      <MotionSlider label="stiffness" value={cfg.stiffness} min={20} max={800} step={10} onChange={(stiffness) => setCfg((c) => ({ ...c, stiffness }))} />
      <MotionSlider label="mass" value={cfg.mass} min={0.2} max={3} step={0.1} onChange={(mass) => setCfg((c) => ({ ...c, mass }))} />
      <View style={styles.lane}>
        <Animated.View style={[styles.ball, ballStyle]} />
      </View>
      <Button label="Replay spring" variant="secondary" onPress={replay} />
      <Text variant="overline" color="textSubtle" style={{ marginTop: space.sm }}>
        Duration tokens
      </Text>
      {(Object.keys(duration) as (keyof typeof duration)[]).map((k) => (
        <View key={k} style={styles.token}>
          <Text variant="caption" style={{ width: 80 }}>
            {k}
          </Text>
          <Text variant="caption" color="textMuted">
            {duration[k]}ms
          </Text>
          <Button
            label="Play"
            size="sm"
            variant="ghost"
            onPress={() => {
              bar.set(0);
              bar.set(withTiming(1, timings[k]));
            }}
          />
        </View>
      ))}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.bar, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  lane: { height: 44, borderRadius: radii.pill, backgroundColor: colors.surfaceSunken, justifyContent: 'center' },
  ball: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime },
  token: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceSunken, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: colors.accent },
});
