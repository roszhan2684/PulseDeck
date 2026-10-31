import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { toAppError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import type { AuthResult } from '@/services/types';
import { useAppStore } from '@/store/appStore';

const applySession = (r: AuthResult | null) => useAppStore.getState().setSession(r?.userId ?? null, !!r && !r.needsOnboarding);

export async function restoreSession() {
  try {
    // Marketing-site walkthrough: /demo/?flow=onboarding starts as a brand-new demo user.
    if (backend.mode === 'demo' && Platform.OS === 'web' && /[?&]flow=onboarding/.test(window.location.search)) {
      return applySession(await backend.auth.signUp('guest@pulsedeck.app', 'demo1234'));
    }
    const restored = await backend.auth.restore();
    // Opt-in for screenshots, Maestro flows and reviewers: EXPO_PUBLIC_DEMO_AUTOLOGIN=1 (demo backend only).
    if (!restored && backend.mode === 'demo' && process.env.EXPO_PUBLIC_DEMO_AUTOLOGIN === '1') {
      return applySession(await backend.auth.demo());
    }
    applySession(restored);
  } catch (e) {
    logger.warn('Session restore failed', e);
    applySession(null);
  }
}

export async function signOut() {
  await backend.auth.signOut();
  queryClient.clear();
  applySession(null);
}

type Credentials = { email: string; password: string };

/** Auth mutations. Errors are normalized to AppError so screens can render category-specific copy. */
export function useAuthActions() {
  const signIn = useMutation({
    mutationFn: ({ email, password }: Credentials) => backend.auth.signIn(email.trim(), password),
    onSuccess: applySession,
    onError: (e) => toAppError(e, 'auth'),
  });
  const signUp = useMutation({
    mutationFn: ({ email, password }: Credentials) => backend.auth.signUp(email.trim(), password),
    onSuccess: applySession,
  });
  const magicLink = useMutation({ mutationFn: (email: string) => backend.auth.sendMagicLink(email.trim()) });
  const demo = useMutation({ mutationFn: () => backend.auth.demo(), onSuccess: applySession });
  return { signIn, signUp, magicLink, demo, isDemo: backend.mode === 'demo' };
}
