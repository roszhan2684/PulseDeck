import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInLeft, FadeInRight, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import { AnimatedProgressBar } from '@/components/motion';
import { Button, IconButton, Text } from '@/components/ui';
import { validateUsername } from '@/domain/validation';
import { AvatarStep, InterestsStep, UsernameStep, WelcomeStep, type StepProps } from '@/features/onboarding/steps/ProfileSteps';
import { GroupStep, NotificationStep, SuccessStep } from '@/features/onboarding/steps/GroupSteps';
import { useUpdateProfile } from '@/features/profile/useProfile';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { errorCopy, toAppError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { backend } from '@/services/backend';
import { useAppStore } from '@/store/appStore';
import { colors, layout, space } from '@/theme';
import { duration, easing } from '@/theme/motion';

const STEPS: { key: string; Component: (p: StepProps) => React.ReactNode }[] = [
  { key: 'welcome', Component: WelcomeStep },
  { key: 'username', Component: UsernameStep },
  { key: 'avatar', Component: AvatarStep },
  { key: 'interests', Component: InterestsStep },
  { key: 'group', Component: GroupStep },
  { key: 'notifications', Component: NotificationStep },
  { key: 'success', Component: SuccessStep },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotionPref();
  const draft = useAppStore((s) => s.onboarding);
  const update = useAppStore((s) => s.updateOnboarding);
  const complete = useAppStore((s) => s.completeOnboarding);
  const saveProfile = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const exit = useSharedValue(0);
  const { key, Component } = STEPS[step];

  const valid: Record<string, boolean> = {
    welcome: true,
    username: draft.displayName.trim().length >= 2 && draft.username.length >= 3,
    avatar: !!draft.avatarUrl,
    interests: draft.interests.length >= 3,
    group: !!draft.groupId,
    notifications: true,
    success: true,
  };

  const go = (d: 1 | -1) => {
    setDir(d);
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + d)));
  };

  // The coordinated hand-off: content scales up and fades, then the auth guard swaps in the tabs.
  const finish = () => {
    haptics.success();
    if (reduced) return complete();
    exit.set(withTiming(1, { duration: duration.large, easing: easing.exit }, (done) => done && scheduleOnRN(complete)));
  };

  const next = async () => {
    setError(null);
    if (key === 'success') return finish();
    setBusy(true);
    try {
      if (key === 'username') {
        const v = validateUsername(draft.username);
        if (!v.ok) throw new Error(v.message);
        if (!(await backend.profiles.usernameAvailable(draft.username))) throw new Error('That username is taken. Try another.');
      }
      if (key === 'notifications') {
        await saveProfile.mutateAsync({ username: draft.username, displayName: draft.displayName.trim(), avatarUrl: draft.avatarUrl ?? '' });
      }
      go(1);
    } catch (e) {
      haptics.error();
      const err = toAppError(e, 'validation');
      setError(err.kind === 'validation' ? err.message : errorCopy[err.kind].message);
    } finally {
      setBusy(false);
    }
  };

  const exitStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.get(), transform: [{ scale: 1 + exit.get() * 0.12 }] }));
  const entering = reduced ? FadeIn.duration(duration.fast) : (dir === 1 ? FadeInRight : FadeInLeft).duration(duration.standard).easing(easing.enter);

  return (
    <Animated.View style={[styles.screen, exitStyle]}>
      <View style={[styles.top, { paddingTop: insets.top + space.xs }]}>
        {step > 0 && key !== 'success' ? <IconButton icon={ChevronLeft} accessibilityLabel="Previous step" onPress={() => go(-1)} /> : <View style={{ width: 44 }} />}
        <View style={{ flex: 1 }}>
          <AnimatedProgressBar progress={(step + 1) / STEPS.length} accessibilityLabel={`Step ${step + 1} of ${STEPS.length}`} />
        </View>
        <Text variant="caption" color="textMuted" style={{ width: 32, textAlign: 'right' }}>
          {step + 1}/{STEPS.length}
        </Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View key={key} entering={entering} exiting={FadeOut.duration(duration.instant)}>
            <Component draft={draft} update={update} error={key === 'username' ? error : null} />
          </Animated.View>
          {error && key !== 'username' && (
            <Text variant="bodySmall" color="danger" accessibilityRole="alert" style={{ marginTop: space.md }}>
              {error}
            </Text>
          )}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <Button
            label={key === 'success' ? 'Let’s go' : key === 'welcome' ? 'Let’s do it' : 'Continue'}
            size="lg"
            fullWidth
            disabled={!valid[key]}
            loading={busy}
            onPress={next}
            accessibilityHint={!valid[key] ? 'Complete this step to continue' : undefined}
          />
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingBottom: space.sm },
  content: { padding: layout.screenPadding, paddingTop: space.xl, paddingBottom: space.huge },
  footer: { paddingHorizontal: layout.screenPadding, paddingTop: space.sm },
});
