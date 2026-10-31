import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Camera, Layers, Trophy, Vote } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { formatCountdown, phaseCopy, type ChallengePhase } from '@/domain/challengeState';
import { colors, radii, shadows, space } from '@/theme';
import type { Challenge, GroupMember } from '@/types/domain';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { AvatarStack, Badge, Button, Text, type BadgeTone, type ButtonVariant } from '../ui';

const phaseStyle: Record<ChallengePhase, { tone: BadgeTone; variant: ButtonVariant; icon: typeof Camera }> = {
  upcoming: { tone: 'neutral', variant: 'secondary', icon: Bell },
  active: { tone: 'lime', variant: 'primary', icon: Camera },
  submitted: { tone: 'success', variant: 'secondary', icon: Layers },
  voting: { tone: 'accent', variant: 'lime', icon: Vote },
  completed: { tone: 'neutral', variant: 'secondary', icon: Trophy },
};

export interface ChallengeCardProps {
  challenge: Challenge;
  phase: ChallengePhase;
  remainingMs: number;
  members: GroupMember[];
  onPress: () => void;
  onCta: () => void;
}

/** The home screen's hero. Every challenge phase has its own badge, CTA and countdown copy. */
export function ChallengeCard({ challenge, phase, remainingMs, members, onPress, onCta }: ChallengeCardProps) {
  const copy = phaseCopy[phase];
  const st = phaseStyle[phase];
  const posted = members.filter((m) => m.postedToday);
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.985} style={styles.card} accessibilityLabel={`Today’s challenge: ${challenge.prompt}. ${copy.label}.`} accessibilityHint="Opens the submissions deck">
      {challenge.coverUrl && <Image source={{ uri: challenge.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />}
      <LinearGradient colors={['rgba(124,92,255,0.3)', 'rgba(9,9,15,0.45)', 'rgba(9,9,15,0.88)', 'rgba(9,9,15,0.98)']} locations={[0, 0.2, 0.42, 0.7]} style={StyleSheet.absoluteFill} />
      <View style={styles.top}>
        <Badge label={copy.label} tone={st.tone} dot={phase === 'active' || phase === 'voting'} style={styles.badgeBg} />
        <View style={styles.emoji}>
          <Text style={{ fontSize: 26 }}>{challenge.emoji}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text variant="overline" color="lime" style={styles.shadow}>
          Today’s challenge
        </Text>
        <Text variant="display" style={[styles.prompt, styles.shadow]} numberOfLines={3}>
          {challenge.prompt}
        </Text>
        <Text variant="bodySmall" color="textMuted" numberOfLines={2}>
          {challenge.description}
        </Text>
        <View style={styles.meta}>
          <View>
            <Text variant="overline" color="textSubtle">
              {copy.countdownLabel}
            </Text>
            <Text variant="h2" style={styles.countdown} accessibilityLabel={`${copy.countdownLabel} ${formatCountdown(remainingMs)}`}>
              {phase === 'completed' ? '—' : formatCountdown(remainingMs)}
            </Text>
          </View>
          <View style={styles.participation}>
            <AvatarStack profiles={posted.map((m) => m.profile)} size={26} />
            <Text variant="caption" color="textMuted">
              {posted.length} of {members.length} in
            </Text>
          </View>
        </View>
        {copy.cta && <Button label={copy.cta} icon={st.icon} variant={st.variant} size="lg" onPress={onCta} fullWidth />}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 460, borderRadius: radii.xxl, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong, ...shadows.glow, shadowOpacity: 0.25 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg },
  badgeBg: { backgroundColor: 'rgba(9,9,15,0.6)' },
  emoji: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(9,9,15,0.55)', alignItems: 'center', justifyContent: 'center' },
  body: { marginTop: 'auto', padding: space.xl, gap: space.xs },
  prompt: { marginBottom: space.xxs },
  shadow: { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 12, textShadowOffset: { width: 0, height: 1 } },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginVertical: space.md },
  countdown: { fontVariant: ['tabular-nums'] },
  participation: { alignItems: 'flex-end', gap: 6 },
});
