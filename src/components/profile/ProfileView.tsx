import { router, type Href } from 'expo-router';
import { ChevronLeft, Settings } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMyGroups } from '@/features/groups/useGroups';
import { useProfile, useProfileStats, useUserSubmissions } from '@/features/profile/useProfile';
import { colors, layout, space } from '@/theme';
import { AnimatedAvatar } from '../motion/AnimatedAvatar';
import { CollapsibleHeader } from '../motion/CollapsibleHeader';
import { Chip, EmptyState, ErrorState, IconButton, Screen, ScreenHeader, SectionHeader, Skeleton, Text } from '../ui';
import { BadgeCarousel } from './BadgeCarousel';
import { StatTile } from './StatTile';
import { SubmissionGrid } from './SubmissionGrid';

const HEADER = 330;

/** Shared by the Profile tab (isMe) and /profile/[id]. */
export function ProfileView({ userId, isMe }: { userId: string; isMe: boolean }) {
  const insets = useSafeAreaInsets();
  const profile = useProfile(userId);
  const stats = useProfileStats(userId);
  const subs = useUserSubmissions(userId);
  const groups = useMyGroups();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => scrollY.set(e.contentOffset.y));

  if (profile.error) {
    return (
      <Screen>
        <ScreenHeader back={!isMe} />
        <ErrorState error={profile.error} onRetry={() => profile.refetch()} />
      </Screen>
    );
  }
  const p = profile.data;
  const s = stats.data;
  const cover = subs.data?.find((x) => x.mediaType === 'photo')?.mediaUrl;

  return (
    <View style={styles.screen}>
      <CollapsibleHeader
        scrollY={scrollY}
        height={HEADER}
        imageUri={cover}
        title={p?.displayName ?? ''}
        left={!isMe ? <IconButton icon={ChevronLeft} variant="glass" accessibilityLabel="Go back" onPress={() => router.back()} /> : undefined}
        right={isMe ? <IconButton icon={Settings} variant="glass" accessibilityLabel="Settings" onPress={() => router.push('/settings')} /> : undefined}
      >
        {p ? (
          <View style={styles.identity}>
            <AnimatedAvatar uri={p.avatarUrl} size={92} pulse={(s?.currentStreak ?? 0) > 0} />
            <Text variant="h1" align="center" numberOfLines={1}>
              {p.displayName}
            </Text>
            <Text variant="caption" color="textMuted">
              @{p.username}
              {p.city ? ` · ${p.city}` : ''}
            </Text>
            {!!p.bio && (
              <Text variant="bodySmall" color="textMuted" align="center" numberOfLines={2}>
                {p.bio}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.identity}>
            <Skeleton width={92} height={92} radius={46} />
            <Skeleton width={180} height={28} />
          </View>
        )}
      </CollapsibleHeader>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: HEADER + insets.top + space.lg, paddingBottom: 140, gap: space.xxl }}>
        <View style={styles.stats}>
          {s ? (
            <>
              <StatTile label="Day streak" value={s.currentStreak} emoji="🔥" color="warning" />
              <StatTile label="Challenges done" value={s.challengesCompleted} emoji="✅" />
              <StatTile label="Wins" value={s.wins} emoji="👑" color="gold" />
              <StatTile label="Reactions received" value={s.reactionsReceived} emoji="💜" color="primary" />
            </>
          ) : (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} width="47%" height={104} radius={20} style={{ flexGrow: 1 }} />)
          )}
        </View>

        {!!s?.badges.length && (
          <View>
            <SectionHeader title="Badges" />
            <BadgeCarousel badges={s.badges} />
          </View>
        )}

        <View>
          <SectionHeader title="Responses" />
          {subs.data?.length ? (
            <SubmissionGrid submissions={subs.data} onPress={(x) => router.push(`/challenge/${x.challengeId}` as Href)} />
          ) : subs.isLoading ? (
            <View style={styles.pad}>
              <Skeleton height={160} radius={16} />
            </View>
          ) : (
            <EmptyState emoji="📸" title="No responses yet" message={isMe ? 'Answer today’s challenge to start your grid.' : 'Nothing posted yet.'} />
          )}
        </View>

        {isMe && !!groups.data?.length && (
          <View>
            <SectionHeader title="Groups" />
            <View style={[styles.pad, styles.groups]}>
              {groups.data.map((g) => (
                <Chip key={g.id} label={g.name} emoji={g.emoji} onPress={() => router.push(`/group/${g.id}` as Href)} />
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  identity: { alignItems: 'center', gap: 6 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, paddingHorizontal: layout.screenPadding },
  pad: { paddingHorizontal: layout.screenPadding },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
});
