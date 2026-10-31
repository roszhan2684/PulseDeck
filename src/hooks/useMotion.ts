import { useReducedMotion } from 'react-native-reanimated';
import { useAppStore } from '@/store/appStore';

/** Resolves the effective reduced-motion flag from the OS setting and the in-app override. */
export function useReducedMotionPref(): boolean {
  const system = useReducedMotion();
  const pref = useAppStore((s) => s.motionPreference);
  return pref === 'reduce' || (pref === 'system' && system);
}
