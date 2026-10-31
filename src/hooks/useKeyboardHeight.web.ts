import { useSharedValue, type SharedValue } from 'react-native-reanimated';

/** Browsers resize the viewport themselves, so the composer needs no keyboard offset on web. */
export function useKeyboardHeight(): SharedValue<number> {
  return useSharedValue(0);
}
