import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { logger } from '@/lib/logger';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

/** Asks for permission and returns an Expo push token, or null when unavailable (simulator, denied, no EAS project). */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.granted ? 'granted' : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Challenges', importance: AndroidImportance.DEFAULT });
  }
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!Device.isDevice || !projectId) {
    logger.debug('Push token skipped: needs a physical device and an EAS projectId');
    return null;
  }
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    logger.warn('Push token failed', e);
    return null;
  }
}

/** Local notification used by the demo to show deep-linking end to end. */
export async function scheduleChallengeReminder(challengeId: string, prompt: string, seconds = 5) {
  if (Platform.OS === 'web') throw new Error('Local notifications need the iOS app');
  await Notifications.scheduleNotificationAsync({
    content: { title: 'New challenge 🔔', body: prompt, data: { url: `/challenge/${challengeId}` } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

/** Opens the route carried in a notification's `data.url`, including on cold start. */
export function useNotificationRouting(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    const open = (n: Notifications.Notification) => {
      const url = n.request.content.data?.url;
      if (typeof url === 'string') router.push(url as Href);
    };
    const last = Notifications.getLastNotificationResponse();
    if (last) open(last.notification);
    const sub = Notifications.addNotificationResponseReceivedListener((r) => open(r.notification));
    return () => sub.remove();
  }, [enabled]);
}
