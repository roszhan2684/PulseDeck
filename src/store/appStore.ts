import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { NotificationType } from '@/types/domain';

export type MotionPreference = 'system' | 'reduce' | 'full';
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface OnboardingDraft {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  interests: string[];
  groupId: string | null;
  notifications: boolean;
}

const emptyDraft: OnboardingDraft = {
  username: '',
  displayName: '',
  avatarUrl: null,
  interests: [],
  groupId: null,
  notifications: true,
};

interface AppState {
  authStatus: AuthStatus;
  userId: string | null;
  hasOnboarded: boolean;
  selectedGroupId: string | null;
  motionPreference: MotionPreference;
  /** Demo-only: makes the in-memory backend fail requests so error states can be exercised. */
  simulateFailures: boolean;
  onboarding: OnboardingDraft;
  /** Per-group notification preferences. Missing keys default to enabled. */
  notificationPrefs: Record<string, Partial<Record<NotificationType, boolean>>>;

  setSession: (userId: string | null, hasOnboarded: boolean) => void;
  completeOnboarding: () => void;
  selectGroup: (id: string | null) => void;
  setMotionPreference: (p: MotionPreference) => void;
  setSimulateFailures: (v: boolean) => void;
  updateOnboarding: (patch: Partial<OnboardingDraft>) => void;
  setNotificationPref: (groupId: string, type: NotificationType, value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      authStatus: 'loading',
      userId: null,
      hasOnboarded: false,
      selectedGroupId: null,
      motionPreference: 'system',
      simulateFailures: false,
      onboarding: emptyDraft,
      notificationPrefs: {},

      setSession: (userId, hasOnboarded) =>
        set(userId ? { userId, hasOnboarded, authStatus: 'signedIn' } : { userId: null, hasOnboarded: false, authStatus: 'signedOut', onboarding: emptyDraft }),
      completeOnboarding: () => set({ hasOnboarded: true, onboarding: emptyDraft }),
      selectGroup: (selectedGroupId) => set({ selectedGroupId }),
      setMotionPreference: (motionPreference) => set({ motionPreference }),
      setSimulateFailures: (simulateFailures) => set({ simulateFailures }),
      updateOnboarding: (patch) => set((s) => ({ onboarding: { ...s.onboarding, ...patch } })),
      setNotificationPref: (groupId, type, value) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [groupId]: { ...s.notificationPrefs[groupId], [type]: value } } })),
    }),
    {
      name: 'pulsedeck-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ selectedGroupId, motionPreference, notificationPrefs, onboarding }) => ({
        selectedGroupId,
        motionPreference,
        notificationPrefs,
        onboarding,
      }),
    },
  ),
);
