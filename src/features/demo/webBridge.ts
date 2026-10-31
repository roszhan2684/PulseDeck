import { router, usePathname, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { backend } from '@/services/backend';
import { useAppStore } from '@/store/appStore';

type BridgeMessage = { type: 'pulsedeck:navigate'; href: string };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Web-only bridge for the marketing site's guided walkthrough. The site embeds the app
 * in an iframe and posts { type: 'pulsedeck:navigate', href } to jump between features;
 * the app reports its current route back so the site can highlight the active step.
 * Onboarding is started with a fresh load of `?flow=onboarding` (see restoreSession).
 * Demo backend only — never active against Supabase.
 */
export function useWebDemoBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS !== 'web' || backend.mode !== 'demo' || window.parent === window) return;
    window.parent.postMessage({ type: 'pulsedeck:route', pathname }, '*');
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS !== 'web' || backend.mode !== 'demo') return;
    const onMessage = async (e: MessageEvent<BridgeMessage>) => {
      if (e.data?.type !== 'pulsedeck:navigate') return;
      const store = useAppStore.getState();
      if (!(store.authStatus === 'signedIn' && store.hasOnboarded)) {
        const res = await backend.auth.demo();
        store.setSession(res.userId, true);
        await wait(60);
      }
      if (router.canDismiss()) router.dismissAll();
      router.navigate(e.data.href as Href);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
}
