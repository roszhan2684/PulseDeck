import { router } from 'expo-router';
import { Lock, Mail, MailCheck } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Button, Card, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { validateEmail, validatePassword } from '@/domain/validation';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { AppError, errorCopy } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { colors, layout, space } from '@/theme';
import { presets } from '@/theme/motion';
import { useAuthActions } from './session';

/** Login and signup share one form. Validation runs on submit, then live as the user fixes fields. */
export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const reduced = useReducedMotionPref();
  const { signIn, signUp, magicLink, isDemo } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [useLink, setUseLink] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);

  const emailCheck = validateEmail(email);
  const pwCheck = mode === 'signup' ? validatePassword(password) : password.length ? { ok: true as const } : { ok: false as const, message: 'Enter your password.' };
  const emailError = submitted && !emailCheck.ok ? emailCheck.message : null;
  const pwError = submitted && !useLink && !pwCheck.ok ? pwCheck.message : null;
  const mutation = useLink ? magicLink : mode === 'login' ? signIn : signUp;
  const serverError = mutation.error instanceof AppError ? (mutation.error.kind === 'auth' ? mutation.error.message : errorCopy[mutation.error.kind].message) : mutation.error ? errorCopy.server.message : null;

  const submit = () => {
    setSubmitted(true);
    if (!emailCheck.ok || (!useLink && !pwCheck.ok)) {
      haptics.error();
      return;
    }
    if (useLink) return magicLink.mutate(email);
    if (mode === 'login') return signIn.mutate({ email, password }, { onError: () => haptics.error() });
    signUp.mutate({ email, password }, { onSuccess: () => router.replace('/onboarding'), onError: () => haptics.error() });
  };

  if (useLink && magicLink.isSuccess) {
    return (
      <Screen>
        <ScreenHeader />
        <Animated.View entering={presets.enter(reduced)} style={styles.sent}>
          <View style={styles.sentIcon}>
            <MailCheck size={36} color={colors.lime} />
          </View>
          <Text variant="h1" align="center">
            Check your inbox
          </Text>
          <Text variant="body" color="textMuted" align="center">
            We sent a sign-in link to {email.trim()}. Open it on this phone.
          </Text>
          <Button label="Use a password instead" variant="ghost" onPress={() => setUseLink(false)} />
        </Animated.View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Animated.View entering={reduced ? FadeIn : FadeInDown.duration(320)} style={{ gap: space.xs }}>
            <Text variant="h1">{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
            <Text variant="body" color="textMuted">
              {mode === 'login' ? 'Your crew has been posting without you.' : 'Takes 30 seconds. Your friends are waiting.'}
            </Text>
          </Animated.View>
          <View style={styles.fields}>
            <TextField
              label="Email"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              error={emailError}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="you@example.com"
              returnKeyType={useLink ? 'send' : 'next'}
              onSubmitEditing={() => (useLink ? submit() : passwordRef.current?.focus())}
            />
            {!useLink && (
              <TextField
                ref={passwordRef}
                label="Password"
                icon={Lock}
                value={password}
                onChangeText={setPassword}
                error={pwError}
                secureTextEntry
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                textContentType={mode === 'login' ? 'password' : 'newPassword'}
                placeholder={mode === 'signup' ? '8+ characters, letters and numbers' : '••••••••'}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            )}
            {serverError && (
              <Card tone="sunken" style={styles.error}>
                <Text variant="bodySmall" color="danger" accessibilityRole="alert" accessibilityLiveRegion="assertive">
                  {serverError}
                </Text>
              </Card>
            )}
          </View>
          <Button label={useLink ? 'Email me a link' : mode === 'login' ? 'Sign in' : 'Create account'} size="lg" fullWidth loading={mutation.isPending} onPress={submit} />
          {mode === 'login' && <Button label={useLink ? 'Use a password instead' : 'Email me a magic link instead'} variant="ghost" fullWidth onPress={() => setUseLink((v) => !v)} />}
          <Button
            label={mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
            variant="ghost"
            size="sm"
            onPress={() => router.replace(mode === 'login' ? '/signup' : '/login')}
          />
          {isDemo && (
            <Text variant="caption" color="textSubtle" align="center" style={{ marginTop: space.md }}>
              Demo mode: any valid email and password works.{'\n'}Try locked@pulsedeck.app to see a sign-in error.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, gap: space.md, paddingBottom: space.huge },
  fields: { gap: space.md, marginVertical: space.md },
  error: { borderColor: colors.danger },
  sent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.sm },
  sentIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.limeMuted, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
});
