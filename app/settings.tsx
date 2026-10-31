import { router } from 'expo-router';
import { BellRing, FlaskConical, LogOut, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AnimatedModal } from '@/components/motion';
import { Button, Card, Chip, Screen, ScreenHeader, SectionHeader, SegmentedControl, Text } from '@/components/ui';
import { signOut } from '@/features/auth/session';
import { useCurrentChallenge } from '@/features/challenges/useChallenge';
import { useMyGroups } from '@/features/groups/useGroups';
import { scheduleChallengeReminder } from '@/features/notifications/notifications';
import { backend } from '@/services/backend';
import { useAppStore, type MotionPreference } from '@/store/appStore';
import { toast } from '@/store/toastStore';
import { colors, layout, space } from '@/theme';
import { NOTIFICATION_TYPES } from '@/types/domain';

export default function Settings() {
  const motion = useAppStore((s) => s.motionPreference);
  const setMotion = useAppStore((s) => s.setMotionPreference);
  const flaky = useAppStore((s) => s.simulateFailures);
  const setFlaky = useAppStore((s) => s.setSimulateFailures);
  const prefs = useAppStore((s) => s.notificationPrefs);
  const setPref = useAppStore((s) => s.setNotificationPref);
  const groups = useMyGroups();
  const [groupId, setGroupId] = useState<string | null>(useAppStore.getState().selectedGroupId);
  const activeGroup = groupId ?? groups.data?.[0]?.id;
  const challenge = useCurrentChallenge(activeGroup);
  const [confirm, setConfirm] = useState(false);

  const testNotification = async () => {
    if (!challenge.data) return toast.error('No active challenge', 'Pick a group with a live challenge.');
    try {
      await scheduleChallengeReminder(challenge.data.id, challenge.data.prompt, 3);
      toast.success('Notification in 3 seconds', 'Lock your phone or background the app, then tap it.');
    } catch {
      toast.error('Notifications are off', 'Allow notifications for PulseDeck in iOS Settings.');
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <SectionHeader title="Motion" inset={false} />
          <SegmentedControl<MotionPreference>
            value={motion}
            onChange={setMotion}
            accessibilityLabel="Motion preference"
            options={[
              { value: 'system', label: 'Match iOS' },
              { value: 'reduce', label: 'Reduced' },
              { value: 'full', label: 'Full' },
            ]}
          />
          <Text variant="caption" color="textSubtle" style={styles.note}>
            Reduced motion swaps slides, parallax and particles for gentle fades. Everything still works.
          </Text>
        </View>

        <View>
          <SectionHeader title="Notifications" inset={false} />
          <View style={styles.chips}>
            {groups.data?.map((g) => (
              <Chip key={g.id} label={g.name} emoji={g.emoji} selected={g.id === activeGroup} onPress={() => setGroupId(g.id)} />
            ))}
          </View>
          <Card padded={false}>
            {NOTIFICATION_TYPES.map((n, i) => {
              const on = activeGroup ? (prefs[activeGroup]?.[n.type] ?? true) : true;
              return (
                <View key={n.type} style={[styles.row, i > 0 && styles.divider]}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong">{n.label}</Text>
                    <Text variant="caption" color="textMuted">
                      {n.description}
                    </Text>
                  </View>
                  <Switch
                    value={on}
                    onValueChange={(v) => {
                      if (activeGroup) setPref(activeGroup, n.type, v);
                    }}
                    trackColor={{ true: colors.primary, false: colors.surfaceRaised }}
                    thumbColor={colors.white}
                    accessibilityLabel={`${n.label} notifications`}
                  />
                </View>
              );
            })}
          </Card>
          <Button label="Send a test challenge notification" icon={BellRing} variant="secondary" style={{ marginTop: space.sm }} onPress={testNotification} />
        </View>

        <View>
          <SectionHeader title="Developer" inset={false} />
          <Card padded={false}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Simulate flaky network</Text>
                <Text variant="caption" color="textMuted">
                  {backend.mode === 'demo' ? 'Fails ~50% of requests to show retry, rollback and error states.' : 'Only available in demo mode.'}
                </Text>
              </View>
              <Switch value={flaky} onValueChange={setFlaky} disabled={backend.mode !== 'demo'} trackColor={{ true: colors.warning, false: colors.surfaceRaised }} thumbColor={colors.white} accessibilityLabel="Simulate flaky network" />
            </View>
          </Card>
          <View style={styles.buttons}>
            <Button label="Open Motion Lab" icon={Sparkles} variant="secondary" onPress={() => router.push('/dev/motion-lab')} />
            <Text variant="caption" color="textSubtle" align="center">
              <FlaskConical size={12} color={colors.textSubtle} /> Backend: {backend.mode === 'demo' ? 'Demo (in-memory, simulated realtime)' : 'Supabase'}
            </Text>
          </View>
        </View>

        <Button label="Sign out" icon={LogOut} variant="danger" onPress={() => setConfirm(true)} />
        <Text variant="caption" color="textSubtle" align="center">
          PulseDeck 1.0.0 · Made with Expo, Reanimated and too much cold brew
        </Text>
      </ScrollView>

      <AnimatedModal visible={confirm} onClose={() => setConfirm(false)} accessibilityLabel="Confirm sign out">
        <View style={{ gap: space.md }}>
          <Text variant="h2">Sign out?</Text>
          <Text variant="body" color="textMuted">
            Your streak is safe. Just don’t miss tomorrow’s drop.
          </Text>
          <Button label="Sign out" variant="danger" onPress={() => void signOut()} />
          <Button label="Cancel" variant="ghost" onPress={() => setConfirm(false)} />
        </View>
      </AnimatedModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: layout.screenPadding, gap: space.xxl, paddingBottom: space.huge },
  note: { marginTop: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginBottom: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, minHeight: 60 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  buttons: { gap: space.sm, marginTop: space.sm },
});
