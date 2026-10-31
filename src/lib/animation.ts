import { withSpring, withTiming, type AnimationCallback } from 'react-native-reanimated';
import { springs, timings, type SpringName } from '@/theme/motion';

/** Spring to a value, or a short fade-speed timing when reduced motion is on. Usable in worklets. */
export function animateTo(value: number, spring: SpringName, reduced: boolean, cb?: AnimationCallback) {
  'worklet';
  return reduced ? withTiming(value, timings.fast, cb) : withSpring(value, springs[spring], cb);
}
