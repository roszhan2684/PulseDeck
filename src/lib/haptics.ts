import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (fn: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  fn().catch(() => undefined); // haptics are best-effort; missing hardware is not an error
};

/** Intentional haptic vocabulary. Don't fire haptics on every interaction. */
export const haptics = {
  /** Button / chip selection */
  soft: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  /** Committing an action, e.g. submitting a challenge */
  medium: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Reaction pick, tab change */
  selection: () => run(() => Haptics.selectionAsync()),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
