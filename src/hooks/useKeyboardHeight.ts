import { useAnimatedKeyboard, type SharedValue } from 'react-native-reanimated';

/** Keyboard height as a shared value (UI thread). Web returns a constant 0, see useKeyboardHeight.web.ts. */
export function useKeyboardHeight(): SharedValue<number> {
  return useAnimatedKeyboard().height;
}
