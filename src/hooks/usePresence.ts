import { useEffect, useState } from 'react';
import { useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { animateTo } from '@/lib/animation';
import { timings, type SpringName } from '@/theme/motion';
import { useReducedMotionPref } from './useMotion';

/**
 * Keeps an overlay mounted while it animates out.
 * `progress` runs 0 → 1 on show (spring) and 1 → 0 on hide (timing), then unmounts.
 */
export function usePresence(visible: boolean, spring: SpringName = 'soft') {
  const reduced = useReducedMotionPref();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) progress.set(animateTo(1, spring, reduced));
    else
      progress.set(
        withTiming(0, timings.fast, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
  }, [visible, spring, reduced, progress]);

  return { mounted, progress, reduced };
}
