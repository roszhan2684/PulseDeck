import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { colors, radii } from '@/theme';

export interface SpringParams {
  damping: number;
  stiffness: number;
  mass: number;
}

/** Integrates a damped spring from 0 → 1 and returns sampled points plus settle time (ms). */
export function simulateSpring({ damping, stiffness, mass }: SpringParams, maxMs = 1600) {
  const dt = 1 / 240;
  let x = 0;
  let v = 0;
  let settledAt = maxMs;
  const pts: { t: number; x: number }[] = [];
  for (let t = 0; t <= maxMs / 1000; t += dt) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    pts.push({ t, x });
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01 && settledAt === maxMs) settledAt = Math.round(t * 1000);
  }
  return { pts, settledAt, overshoot: Math.max(0, ...pts.map((p) => p.x)) - 1 };
}

export interface SpringGraphProps {
  config: SpringParams;
  width: number;
  height?: number;
}

/** Live plot of a spring curve (Motion Lab). Dashed line = target value. */
export function SpringGraph({ config, width, height = 140 }: SpringGraphProps) {
  const path = useMemo(() => {
    const { pts } = simulateSpring(config);
    const maxT = pts[pts.length - 1].t;
    const yFor = (x: number) => height - 16 - x * (height - 48);
    return pts
      .filter((_, i) => i % 3 === 0)
      .map((p, i) => `${i ? 'L' : 'M'}${((p.t / maxT) * width).toFixed(1)},${yFor(Math.max(-0.2, Math.min(1.6, p.x))).toFixed(1)}`)
      .join(' ');
  }, [config, width, height]);
  const targetY = height - 16 - (height - 48);
  return (
    <View style={[styles.box, { width, height }]} accessibilityLabel="Spring curve" accessible>
      <Svg width={width} height={height}>
        <Line x1={0} x2={width} y1={targetY} y2={targetY} stroke={colors.borderStrong} strokeDasharray="4 6" />
        <Line x1={0} x2={width} y1={height - 16} y2={height - 16} stroke={colors.border} />
        <Path d={path} stroke={colors.lime} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ box: { backgroundColor: colors.surfaceSunken, borderRadius: radii.md, overflow: 'hidden' } });
