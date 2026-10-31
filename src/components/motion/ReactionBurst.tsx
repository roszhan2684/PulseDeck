import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { duration, springs } from '@/theme/motion';

export interface Burst {
  /** Change this to replay the burst. */
  id: number;
  emoji: string;
  /** Center point inside the parent. Defaults to the parent's center. */
  x?: number;
  y?: number;
}

export interface ReactionBurstProps {
  burst: Burst | null;
  /** Number of particle copies. */
  particles?: number;
  size?: number;
}

/** Playful-spring emoji pop with radial particles. Particles are skipped under reduced motion. */
export function ReactionBurst({ burst, particles = 7, size = 84 }: ReactionBurstProps) {
  if (!burst) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BurstInstance key={burst.id} burst={burst} particles={particles} size={size} />
    </View>
  );
}

function BurstInstance({ burst, particles, size }: { burst: Burst; particles: number; size: number }) {
  const reduced = useReducedMotionPref();
  const pop = useSharedValue(0);
  const fade = useSharedValue(1);
  useEffect(() => {
    pop.set(reduced ? withTiming(1, { duration: duration.fast }) : withSpring(1, springs.playful));
    fade.set(withDelay(520, withTiming(0, { duration: duration.standard })));
  }, [pop, fade, reduced]);
  const main = useAnimatedStyle(() => ({
    opacity: fade.get(),
    transform: [{ scale: reduced ? 1 : interpolate(pop.get(), [0, 1], [0.2, 1]) }, { translateY: interpolate(fade.get(), [0, 1], [-30, 0]) }],
  }));
  const pos = burst.x !== undefined && burst.y !== undefined ? { left: burst.x - size / 2, top: burst.y - size / 2 } : { alignSelf: 'center' as const, top: '40%' as const };
  return (
    <View style={[styles.anchor, pos, { width: size, height: size }]}>
      {!reduced && Array.from({ length: particles }, (_, i) => <Particle key={i} emoji={burst.emoji} index={i} count={particles} size={size} />)}
      <Animated.Text style={[styles.emoji, { fontSize: size * 0.8, lineHeight: size }, main]}>{burst.emoji}</Animated.Text>
    </View>
  );
}

function Particle({ emoji, index, count, size }: { emoji: string; index: number; count: number; size: number }) {
  const t = useSharedValue(0);
  // Deterministic spread with a little jitter so bursts don't look mechanical.
  const angle = (index / count) * Math.PI * 2 + (index % 2 ? 0.25 : -0.15);
  const dist = size * (0.9 + (index % 3) * 0.25);
  useEffect(() => {
    t.set(withSequence(withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })));
  }, [t]);
  const style = useAnimatedStyle(() => {
    const p = t.get();
    return {
      opacity: interpolate(p, [0, 0.15, 1], [0, 1, 0]),
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p + 40 * p * p },
        { scale: interpolate(p, [0, 0.3, 1], [0.3, 0.6, 0.35]) },
        { rotate: `${(index % 2 ? 1 : -1) * 40 * p}deg` },
      ],
    };
  });
  return <Animated.Text style={[styles.particle, { fontSize: size * 0.45, lineHeight: size }, style]}>{emoji}</Animated.Text>;
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  emoji: { textAlign: 'center' },
  particle: { position: 'absolute', textAlign: 'center' },
});
