import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LeaderboardRow } from '@/components/leaderboard/LeaderboardRow';
import { AnimatedListItem } from '@/components/motion';
import { Badge, EmptyState, ErrorState, RowSkeleton, Screen, ScreenHeader, SegmentedControl, Text } from '@/components/ui';
import { METRIC_LABELS } from '@/domain/leaderboard';
import { useSelectedGroup } from '@/features/groups/useGroups';
import { useLeaderboard } from '@/features/leaderboard/useLeaderboard';
import { useAppStore } from '@/store/appStore';
import { layout, space } from '@/theme';
import type { LeaderboardMetric, RankedEntry } from '@/types/domain';

const UNITS: Record<LeaderboardMetric, string> = { wins: 'wins', participation: 'posts', reactions: 'reacts', streak: 'days' };
const TABS: Record<LeaderboardMetric, string> = { wins: 'Wins', participation: 'Posts', reactions: 'Reactions', streak: 'Streak' };

export default function Leaderboard() {
  const myId = useAppStore((s) => s.userId);
  const { group } = useSelectedGroup();
  const [metric, setMetric] = useState<LeaderboardMetric>('wins');
  const board = useLeaderboard(group?.id, metric);
  const [snap, setSnap] = useState<{ ranked: RankedEntry[]; metric: LeaderboardMetric; movement: Record<string, number> }>({ ranked: board.ranked, metric, movement: {} });

  // When a live update re-ranks the board, diff against the previous ranking to show up/down arrows.
  if (snap.ranked !== board.ranked || snap.metric !== metric) {
    const before = new Map(snap.ranked.map((e) => [e.userId, e.rank]));
    const movement: Record<string, number> = {};
    if (snap.metric === metric) {
      for (const e of board.ranked) {
        const prev = before.get(e.userId);
        if (prev && prev !== e.rank) movement[e.userId] = prev - e.rank;
      }
    }
    setSnap({ ranked: board.ranked, metric, movement });
  }
  const movement = snap.movement;

  return (
    <Screen>
      <ScreenHeader title="Leaderboard" subtitle={group ? `${group.emoji} ${group.name} · this week` : undefined} right={<Badge label="Live" tone="success" dot />} />
      <View style={styles.controls}>
        <SegmentedControl
          value={metric}
          onChange={setMetric}
          accessibilityLabel="Leaderboard metric"
          options={(Object.keys(METRIC_LABELS) as LeaderboardMetric[]).map((m) => ({ value: m, label: TABS[m] }))}
        />
        <Text variant="caption" color="textSubtle" align="center">
          Updates live as votes and reactions land · resets Monday 12:00 AM ET
        </Text>
      </View>
      {board.error ? (
        <ErrorState error={board.error} onRetry={() => board.refetch()} />
      ) : board.isLoading ? (
        <View style={styles.list}>
          <RowSkeleton count={6} />
        </View>
      ) : !board.ranked.length ? (
        <EmptyState emoji="🏁" title="No scores yet" message="Rankings appear after the first challenge wraps." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {board.ranked.map((e, i) => (
            <AnimatedListItem key={e.userId} index={i}>
              <LeaderboardRow
                entry={e}
                unit={UNITS[metric]}
                isMe={e.userId === myId}
                movement={movement[e.userId] ?? 0}
                onPress={() => router.push((e.userId === myId ? '/profile' : `/profile/${e.userId}`) as Href)}
              />
            </AnimatedListItem>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: layout.screenPadding, gap: space.sm, paddingBottom: space.sm },
  list: { padding: layout.screenPadding, gap: space.xs, paddingBottom: space.huge },
});
