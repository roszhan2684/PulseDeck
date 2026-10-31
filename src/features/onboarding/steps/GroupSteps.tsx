import { Bell, BellOff, Hash, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { AnimatedPressable, ReactionBurst } from '@/components/motion';
import { Avatar, Button, Card, SegmentedControl, Text, TextField } from '@/components/ui';
import { normalizeInviteCode, validateGroupName, validateInviteCode } from '@/domain/validation';
import { useCreateGroup, useJoinGroup } from '@/features/groups/useGroups';
import { registerForPushNotifications } from '@/features/notifications/notifications';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { errorCopy, toAppError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { backend } from '@/services/backend';
import { colors, radii, space } from '@/theme';
import { springs } from '@/theme/motion';
import type { Group } from '@/types/domain';
import { StepTitle, type StepProps } from './ProfileSteps';

const EMOJIS = ['🏠', '🍕', '🎮', '🏈', '🎧', '✈️', '🐶', '☕'];

/** Join-or-create. Used in onboarding and (compact) in the Groups tab sheet. */
export function GroupStep({ draft, update, compact }: StepProps & { compact?: boolean }) {
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<Group | null>(null);
  const join = useJoinGroup();
  const create = useCreateGroup();

  const done = (g: Group) => {
    haptics.success();
    setJoined(g);
    update({ groupId: g.id });
  };
  const fail = (e: unknown) => {
    haptics.error();
    const err = toAppError(e);
    setError(err.kind === 'notFound' ? 'No group uses that code. Double-check with your friend.' : errorCopy[err.kind].message);
  };
  const submit = () => {
    setError(null);
    const check = mode === 'join' ? validateInviteCode(code) : validateGroupName(name);
    if (!check.ok) return setError(check.message);
    if (mode === 'join') join.mutate(code, { onSuccess: done, onError: fail });
    else create.mutate({ name, emoji }, { onSuccess: done, onError: fail });
  };

  if (joined && draft.groupId && !compact) {
    return (
      <View style={styles.gap}>
        <StepTitle overline="Step 4" title={`You’re in ${joined.name}`} body={`${joined.memberCount} ${joined.memberCount === 1 ? 'member' : 'members'} · invite code ${joined.inviteCode}`} />
        <Card style={styles.joined}>
          <Text style={{ fontSize: 44 }}>{joined.emoji}</Text>
          <Text variant="h2">{joined.name}</Text>
          <Text variant="bodySmall" color="textMuted" align="center">
            {joined.description}
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.gap}>
      {!compact && <StepTitle overline="Step 4" title="Find your crew" body="Join with an invite code, or start a group and invite friends." />}
      <SegmentedControl
        value={mode}
        onChange={(m) => {
          setMode(m);
          setError(null);
        }}
        options={[
          { value: 'join', label: 'Join with code' },
          { value: 'create', label: 'Start a group' },
        ]}
      />
      {mode === 'join' ? (
        <TextField
          label="Invite code"
          icon={Hash}
          value={code}
          onChangeText={(t) => setCode(normalizeInviteCode(t))}
          placeholder="4BFAM1"
          autoCapitalize="characters"
          autoCorrect={false}
          error={error}
          hint={backend.mode === 'demo' ? 'Demo codes: 4BFAM1, LUNCH7, GGWP42' : 'Ask a friend for their 6-character code'}
          onSubmitEditing={submit}
        />
      ) : (
        <View style={{ gap: space.md }}>
          <TextField label="Group name" icon={Users} value={name} onChangeText={setName} placeholder="Apartment 4B" error={error} maxLength={32} onSubmitEditing={submit} />
          <View style={styles.emojis} accessibilityRole="radiogroup" accessibilityLabel="Group icon">
            {EMOJIS.map((e) => (
              <AnimatedPressable key={e} onPress={() => setEmoji(e)} haptic="selection" style={[styles.emoji, emoji === e && styles.emojiOn]} accessibilityRole="radio" accessibilityState={{ checked: emoji === e }} accessibilityLabel={e}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      )}
      <Button label={mode === 'join' ? 'Join group' : 'Create group'} variant="secondary" loading={join.isPending || create.isPending} onPress={submit} />
    </View>
  );
}

export function NotificationStep({ draft, update }: StepProps) {
  const [asking, setAsking] = useState(false);
  const choose = async (on: boolean) => {
    update({ notifications: on });
    if (!on) return;
    setAsking(true);
    await registerForPushNotifications().catch(() => null);
    setAsking(false);
  };
  const options = [
    { on: true, Icon: Bell, title: 'Turn on notifications', body: 'Know the moment a challenge drops or a friend posts.' },
    { on: false, Icon: BellOff, title: 'Maybe later', body: 'You can change this per group in Settings.' },
  ];
  return (
    <View style={styles.gap}>
      <StepTitle overline="Step 5" title="Don’t miss the drop" body="Challenges are more fun when everyone posts within the hour." />
      {options.map(({ on, Icon, title, body }) => (
        <AnimatedPressable key={title} onPress={() => choose(on)} disabled={asking} accessibilityRole="radio" accessibilityState={{ checked: draft.notifications === on }} style={[styles.option, draft.notifications === on && styles.optionOn]}>
          <View style={styles.optionIcon}>
            <Icon size={22} color={draft.notifications === on ? colors.lime : colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong">{title}</Text>
            <Text variant="bodySmall" color="textMuted">
              {body}
            </Text>
          </View>
        </AnimatedPressable>
      ))}
    </View>
  );
}

/** Final step: check mark pops, emoji burst, avatar settles in. The screen then hands off to the app. */
export function SuccessStep({ draft }: StepProps) {
  const reduced = useReducedMotionPref();
  const pop = useSharedValue(0);
  const [burst, setBurst] = useState<{ id: number; emoji: string } | null>(null);
  useEffect(() => {
    pop.set(withDelay(120, withSpring(1, springs.playful)));
    const t = setTimeout(() => setBurst({ id: 1, emoji: '🎉' }), 260);
    return () => clearTimeout(t);
  }, [pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: reduced ? 1 : pop.get() }], opacity: Math.min(1, pop.get() * 1.5) }));
  return (
    <View style={styles.success}>
      <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[styles.ring, style]}>
          <Avatar uri={draft.avatarUrl ?? undefined} name={draft.displayName} size={128} />
        </Animated.View>
        <ReactionBurst burst={burst} size={96} particles={10} />
      </View>
      <Text variant="display" align="center">
        You’re in, {draft.displayName.split(' ')[0] || 'friend'}!
      </Text>
      <Text variant="body" color="textMuted" align="center">
        Today’s challenge is live. Post something before the timer runs out.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.lg },
  joined: { alignItems: 'center', gap: space.xs, paddingVertical: space.xxl },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  emoji: { width: 48, height: 48, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  emojiOn: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  optionOn: { borderColor: colors.lime, backgroundColor: colors.limeMuted },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  success: { alignItems: 'center', gap: space.md, paddingTop: space.xxl },
  ring: { padding: 6, borderRadius: 80, borderWidth: 3, borderColor: colors.lime },
});
