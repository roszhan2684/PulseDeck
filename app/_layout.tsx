// Per-weight imports: only the 7 faces we use are bundled (not all 36).
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque/600SemiBold';
import { BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque/700Bold';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque/800ExtraBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ToastHost } from '@/components/ui';
import { restoreSession } from '@/features/auth/session';
import { useWebDemoBridge } from '@/features/demo/webBridge';
import { useNotificationRouting } from '@/features/notifications/notifications';
import { queryClient } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const authStatus = useAppStore((s) => s.authStatus);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const ready = fontsLoaded && authStatus !== 'loading';
  const inApp = authStatus === 'signedIn' && hasOnboarded;

  useEffect(() => {
    void restoreSession();
  }, []);
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  useNotificationRouting(ready && inApp);
  useWebDemoBridge();

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
          <Stack.Protected guard={inApp}>
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="challenge/[id]" />
            <Stack.Screen name="challenge/submit" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="group/[id]" />
            <Stack.Screen name="profile/[id]" />
            <Stack.Screen name="leaderboard" />
            <Stack.Screen name="settings" />
          </Stack.Protected>
          <Stack.Protected guard={!inApp}>
            <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Screen name="dev/motion-lab" />
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } });
