import { AtSign, User } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AnimatedAvatar, AnimatedPressable } from '@/components/motion';
import { Chip, Text, TextField } from '@/components/ui';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { avatarChoices } from '@/services/demo/seed';
import type { OnboardingDraft } from '@/store/appStore';
import { colors, space } from '@/theme';
import { presets } from '@/theme/motion';

export interface StepProps {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
  error?: string | null;
}

export const INTERESTS = [
  ['Food', '🍔'],
  ['Pets', '🐶'],
  ['Fitness', '💪'],
  ['Gaming', '🎮'],
  ['Music', '🎧'],
  ['Travel', '✈️'],
  ['Sneakers', '👟'],
  ['Movies', '🍿'],
  ['Football', '🏈'],
  ['Art', '🎨'],
  ['Tech', '💻'],
  ['Outdoors', '🏕️'],
] as const;

export function StepTitle({ overline, title, body }: { overline: string; title: string; body: string }) {
  return (
    <View style={styles.titles}>
      <Text variant="overline" color="primary">
        {overline}
      </Text>
      <Text variant="h1" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color="textMuted">
        {body}
      </Text>
    </View>
  );
}

export function WelcomeStep() {
  const reduced = useReducedMotionPref();
  const points = [
    ['🎯', 'One prompt a day', 'Something silly, quick, and real.'],
    ['⚡', '30 seconds to post', 'Photo, short video or a hot take.'],
    ['🏆', 'Your crew votes', 'Win rounds, build streaks, earn badges.'],
  ];
  return (
    <View style={styles.gap}>
      <StepTitle overline="Welcome" title="Let’s set you up" body="A few quick steps and you’re in the game." />
      {points.map(([emoji, title, body], i) => (
        <Animated.View key={title} entering={presets.enter(reduced, i + 2)} style={styles.point}>
          <Text style={{ fontSize: 26 }}>{emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="bodySmall" color="textMuted">
              {body}
            </Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

export function UsernameStep({ draft, update, error }: StepProps) {
  return (
    <View style={styles.gap}>
      <StepTitle overline="Step 1" title="What should we call you?" body="Friends will see this on your posts." />
      <TextField label="Name" icon={User} value={draft.displayName} onChangeText={(displayName) => update({ displayName })} placeholder="Jordan Rivera" autoComplete="name" textContentType="name" returnKeyType="next" />
      <TextField
        label="Username"
        icon={AtSign}
        value={draft.username}
        onChangeText={(t) => update({ username: t.toLowerCase().replace(/\s/g, '') })}
        placeholder="jordan.rivera"
        autoCapitalize="none"
        autoCorrect={false}
        error={error}
        hint="3–20 characters: letters, numbers, dots, underscores"
        maxLength={20}
      />
    </View>
  );
}

export function AvatarStep({ draft, update }: StepProps) {
  return (
    <View style={styles.gap}>
      <StepTitle overline="Step 2" title="Pick your face" body="You can swap in a real photo later." />
      <View style={styles.avatars} accessibilityRole="radiogroup">
        {avatarChoices.map((uri, i) => (
          <AnimatedPressable key={uri} onPress={() => update({ avatarUrl: uri })} haptic="selection" accessibilityRole="radio" accessibilityState={{ checked: draft.avatarUrl === uri }} accessibilityLabel={`Avatar ${i + 1}`}>
            <AnimatedAvatar uri={uri} size={84} selected={draft.avatarUrl === uri} />
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );
}

export function InterestsStep({ draft, update }: StepProps) {
  const toggle = (label: string) =>
    update({ interests: draft.interests.includes(label) ? draft.interests.filter((x) => x !== label) : [...draft.interests, label] });
  return (
    <View style={styles.gap}>
      <StepTitle overline="Step 3" title="What are you into?" body={`Pick at least 3 so we can tune your prompts. ${draft.interests.length}/3`} />
      <View style={styles.chips}>
        {INTERESTS.map(([label, emoji]) => (
          <Chip key={label} label={label} emoji={emoji} selected={draft.interests.includes(label)} onPress={() => toggle(label)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.lg },
  titles: { gap: space.xs, marginBottom: space.xs },
  point: { flexDirection: 'row', gap: space.md, alignItems: 'center', padding: space.md, borderRadius: 20, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
