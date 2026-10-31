import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityList } from '@/components/group/ActivityList';
import { MemberRail } from '@/components/group/MemberRail';
import { DeckPreview, LeaderboardSnapshot } from '@/components/group/Snapshots';
import { AnimatedListItem, AnimatedPressable, CollapsibleHeader } from '@/components/motion';
import { Badge, ErrorState, IconButton, RowSkeleton, Screen, ScreenHeader, SectionHeader, Text } from '@/components/ui';
import { phaseCopy } from '@/domain/challengeState';
import { useChallengePhase, useCurrentChallenge } from '@/features/challenges/useChallenge';
import { GroupSettingsSheet } from '@/features/groups/GroupSettingsSheet';
import { useActivity, useChallengeHistory, useGroup, useMembers } from '@/features/groups/useGroups';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import { useFeed } from '@/features/submissions/useFeed';
import { useAppStore } from '@/store/appStore';
import { colors, layout, radii, space } from '@/theme';

const HEADER = 280;

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const myId = useAppStore((s) => s.userId);
  const selectGroup = useAppStore((s) => s.selectGroup);
  const group = useGroup(id);
  const members = useMembers(id);
  const challenge = useCurrentChallenge(id);
  const feed = useFeed(challenge.data?.id);
  const activity = useActivity(id);
  const history = useChallengeHistory(id);
  const board = useLeaderboard(id, 'wins', false);
  const { phase } = useChallengePhase(challenge.data, feed.data);
  const [settings, setSettings] = useState(false);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => scrollY.set(e.contentOffset.y));

  if (group.error) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState error={group.error} onRetry={() => group.refetch()} />
      </Screen>
    );
  }
  const g = group.data;

  return (
    <View style={styles.screen}>
      <CollapsibleHeader
        scrollY={scrollY}
        height={HEADER}
        imageUri={g?.avatarUrl}
        title={g?.name ?? ''}
        left={<IconButton icon={ChevronLeft} variant="glass" accessibilityLabel="Go back" onPress={() => router.back()} />}
        right={<IconButton icon={Settings} variant="glass" accessibilityLabel="Group settings" onPress={() => setSettings(true)} disabled={!g} />}
      >
        {g && (
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 36 }}>{g.emoji}</Text>
            <Text variant="display" numberOfLines={1}>
              {g.name}
            </Text>
            <Text variant="bodySmall" color="textMuted" numberOfLines={2}>
              {g.memberCount} members · {g.description}
            </Text>
            <Badge label={`Invite code ${g.inviteCode}`} tone="primary" style={{ marginTop: space.xs }} />
          </View>
        )}
      </CollapsibleHeader>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: HEADER + insets.top + space.lg, paddingBottom: insets.bottom + space.huge, gap: space.xxl }}>
        <View>
          <SectionHeader title="Members" />
          {members.data ? <MemberRail members={members.data} myId={myId} /> : <View style={styles.pad}><RowSkeleton count={1} /></View>}
        </View>

        {challenge.data && phase && (
          <View style={styles.pad}>
            <SectionHeader title="Current challenge" inset={false} />
            <AnimatedPressable
              onPress={() => {
                selectGroup(id);
                router.push(`/challenge/${challenge.data?.id}` as Href);
              }}
              style={styles.current}
              accessibilityLabel={`${challenge.data.prompt}, ${phaseCopy[phase].label}`}
            >
              <Text style={{ fontSize: 32 }}>{challenge.data.emoji}</Text>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="bodyStrong">{challenge.data.prompt}</Text>
                <Badge label={phaseCopy[phase].label} tone={phase === 'voting' ? 'accent' : 'lime'} dot />
              </View>
            </AnimatedPressable>
          </View>
        )}

        {!!feed.data?.length && challenge.data && (
          <View>
            <SectionHeader title="Recent submissions" />
            <DeckPreview submissions={feed.data} challengeId={challenge.data.id} />
          </View>
        )}

        {!!board.data?.length && (
          <View>
            <SectionHeader title="Leaderboard" actionLabel="See all" onAction={() => (selectGroup(id), router.push('/leaderboard'))} />
            <LeaderboardSnapshot entries={board.data} myId={myId} />
          </View>
        )}

        {!!activity.data?.length && (
          <View style={styles.pad}>
            <SectionHeader title="Activity" inset={false} />
            <ActivityList items={activity.data} />
          </View>
        )}

        <View style={styles.pad}>
          <SectionHeader title="Challenge history" inset={false} />
          {history.data?.length ? (
            <View style={{ gap: space.xs }}>
              {history.data.map((c, i) => (
                <AnimatedListItem key={c.id} index={i}>
                  <AnimatedPressable onPress={() => router.push(`/challenge/${c.id}` as Href)} scaleTo={0.98} style={styles.history} accessibilityLabel={`${c.prompt}, ${new Date(c.startsAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}>
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                    <Text variant="bodySmall" style={{ flex: 1 }} numberOfLines={1}>
                      {c.prompt}
                    </Text>
                    <Text variant="caption" color="textSubtle">
                      {new Date(c.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </AnimatedPressable>
                </AnimatedListItem>
              ))}
            </View>
          ) : (
            <Text variant="bodySmall" color="textMuted">
              {history.isLoading ? 'Loading…' : 'No finished challenges yet. History shows up after the first round.'}
            </Text>
          )}
        </View>
      </Animated.ScrollView>
      {g && <GroupSettingsSheet key={g.name} group={g} visible={settings} onClose={() => setSettings(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: layout.screenPadding },
  current: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  history: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, paddingHorizontal: space.md, borderRadius: radii.md, backgroundColor: colors.surface },
});
