import { router, type Href } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { space } from '@/theme';
import type { GroupMember } from '@/types/domain';
import { AnimatedAvatar } from '../motion/AnimatedAvatar';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Text } from '../ui';

/** Horizontal member carousel. Pulse rings mark who has already posted today. */
export function MemberRail({ members, myId }: { members: GroupMember[]; myId: string | null }) {
  const sorted = [...members].sort((a, b) => Number(b.postedToday) - Number(a.postedToday));
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {sorted.map((m) => (
        <AnimatedPressable
          key={m.userId}
          onPress={() => router.push((m.userId === myId ? '/profile' : `/profile/${m.userId}`) as Href)}
          style={styles.item}
          accessibilityLabel={`${m.profile.displayName}${m.postedToday ? ', posted today' : ', hasn’t posted yet'}, ${m.currentStreak}-day streak`}
        >
          <AnimatedAvatar uri={m.profile.avatarUrl} size={54} pulse={m.postedToday} />
          <Text variant="caption" color={m.postedToday ? 'text' : 'textSubtle'} numberOfLines={1}>
            {m.userId === myId ? 'You' : m.profile.displayName.split(' ')[0]}
          </Text>
          {m.currentStreak > 0 && (
            <View style={styles.streak}>
              <Text variant="caption" color="warning" style={{ fontSize: 10 }}>
                🔥{m.currentStreak}
              </Text>
            </View>
          )}
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingHorizontal: space.lg },
  item: { alignItems: 'center', width: 68, gap: 4 },
  streak: { position: 'absolute', top: 44, right: 2 },
});
