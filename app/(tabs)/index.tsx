import { router, type Href } from 'expo-router';
import { Bell, ChevronDown, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ChallengeCard } from '@/components/challenge/ChallengeCard';
import { ActivityList } from '@/components/group/ActivityList';
import { MemberRail } from '@/components/group/MemberRail';
import { DeckPreview, GroupSwitcher, LeaderboardSnapshot } from '@/components/group/Snapshots';
import { AnimatedPressable } from '@/components/motion';
import { ChallengeCardSkeleton, EmptyState, ErrorState, IconButton, RowSkeleton, Screen, SectionHeader, Text } from '@/components/ui';
import { useChallengePhase, useCurrentChallenge } from '@/features/challenges/useChallenge';
import { useActivity, useMembers, useSelectedGroup } from '@/features/groups/useGroups';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import { scheduleChallengeReminder } from '@/features/notifications/notifications';
import { useMe } from '@/features/profile/useProfile';
import { useFeed } from '@/features/submissions/useFeed';
import { queryClient } from '@/lib/queryClient';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/store/toastStore';
import { colors, layout, radii, space } from '@/theme';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Home() {
  const myId = useAppStore((s) => s.userId);
  const selectGroup = useAppStore((s) => s.selectGroup);
  const me = useMe();
  const { group, groups, isLoading, error, refetch } = useSelectedGroup();
  const challenge = useCurrentChallenge(group?.id);
  const feed = useFeed(challenge.data?.id);
  const members = useMembers(group?.id);
  const activity = useActivity(group?.id);
  const board = useLeaderboard(group?.id, 'wins', false);
  const { phase, remainingMs } = useChallengePhase(challenge.data, feed.data);
  const [switcher, setSwitcher] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  };

  const onCta = () => {
    const c = challenge.data;
    if (!c || !phase) return;
    if (phase === 'active') return router.push(`/challenge/submit?challengeId=${c.id}` as Href);
    if (phase === 'upcoming') {
      scheduleChallengeReminder(c.id, c.prompt, 5)
        .then(() => toast.success('Reminder set', 'We’ll ping you when it drops.'))
        .catch(() => toast.error('Couldn’t schedule reminder', 'Enable notifications in Settings.'));
      return;
    }
    router.push(`/challenge/${c.id}` as Href);
  };

  if (error) return <Screen><ErrorState error={error} onRetry={refetch} /></Screen>;
  if (!isLoading && !group) {
    return (
      <Screen style={{ justifyContent: 'center' }}>
        <EmptyState emoji="👋" title="No crew yet" message="Join a group with an invite code or start your own." actionLabel="Find a group" onAction={() => router.push('/groups')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.textMuted} />}>
        <View style={styles.header}>
          <AnimatedPressable onPress={() => setSwitcher(true)} style={styles.groupPill} accessibilityLabel={`Current group ${group?.name ?? ''}. Switch group`}>
            <Text style={{ fontSize: 18 }}>{group?.emoji}</Text>
            <Text variant="bodyStrong" numberOfLines={1} style={{ maxWidth: 180 }}>
              {group?.name ?? ' '}
            </Text>
            <ChevronDown size={16} color={colors.textMuted} />
          </AnimatedPressable>
          <View style={styles.actions}>
            <IconButton icon={Trophy} accessibilityLabel="Leaderboard" onPress={() => router.push('/leaderboard')} />
            <IconButton icon={Bell} accessibilityLabel="Notification settings" onPress={() => router.push('/settings')} badge />
          </View>
        </View>

        <View style={styles.pad}>
          <Text variant="h2">
            {greeting()}, {me.data?.displayName.split(' ')[0] ?? ''} 👋
          </Text>
          <Text variant="bodySmall" color="textMuted" style={{ marginBottom: space.lg }}>
            {phase === 'active' ? 'Your crew is waiting on you.' : phase === 'voting' ? 'Voting is open. Pick a winner.' : 'Here’s what’s happening today.'}
          </Text>
          {challenge.isLoading || !phase ? (
            challenge.data === null ? (
              <EmptyState emoji="🌙" title="No challenge right now" message="The next prompt drops tomorrow at 9:00 AM." />
            ) : (
              <ChallengeCardSkeleton />
            )
          ) : (
            challenge.data && (
              <ChallengeCard challenge={challenge.data} phase={phase} remainingMs={remainingMs} members={members.data ?? []} onPress={() => router.push(`/challenge/${challenge.data?.id}` as Href)} onCta={onCta} />
            )
          )}
        </View>

        <View>
          <SectionHeader title="Who’s in" actionLabel="Group" onAction={() => group && router.push(`/group/${group.id}` as Href)} />
          {members.data ? <MemberRail members={members.data} myId={myId} /> : <View style={styles.pad}><RowSkeleton count={1} /></View>}
        </View>

        {!!feed.data?.length && challenge.data && (
          <View>
            <SectionHeader title="Today’s deck" actionLabel={`See all ${feed.data.length}`} onAction={() => router.push(`/challenge/${challenge.data?.id}` as Href)} />
            <DeckPreview submissions={feed.data} challengeId={challenge.data.id} />
          </View>
        )}

        {!!board.data?.length && (
          <View>
            <SectionHeader title="This week" actionLabel="Leaderboard" onAction={() => router.push('/leaderboard')} />
            <LeaderboardSnapshot entries={board.data} myId={myId} />
          </View>
        )}

        <View style={styles.pad}>
          <SectionHeader title="Activity" inset={false} />
          {activity.data ? activity.data.length ? <ActivityList items={activity.data} /> : <Text variant="bodySmall" color="textMuted">Quiet so far. Be the first to post.</Text> : <RowSkeleton count={3} />}
        </View>
      </ScrollView>
      <GroupSwitcher visible={switcher} onClose={() => setSwitcher(false)} groups={groups} selectedId={group?.id} onSelect={selectGroup} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 140, gap: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: layout.screenPadding, paddingTop: space.xs, marginBottom: -space.md },
  groupPill: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, height: 44, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  actions: { flexDirection: 'row', gap: space.xs },
  pad: { paddingHorizontal: layout.screenPadding },
});
