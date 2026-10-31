import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Check } from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { rankEntries } from '@/domain/leaderboard';
import { thumbnail } from '@/lib/images';
import { colors, radii, space } from '@/theme';
import type { Group, LeaderboardEntry, Submission } from '@/types/domain';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Avatar, Sheet, Text } from '../ui';

/** Horizontal strip of today's responses; opens the swipe deck at that card. */
export function DeckPreview({ submissions, challengeId }: { submissions: Submission[]; challengeId: string }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deck}>
      {submissions.map((s, i) => (
        <AnimatedPressable key={s.id} onPress={() => router.push(`/challenge/${challengeId}?start=${i}` as Href)} style={styles.thumb} accessibilityLabel={`Open ${s.author.displayName}’s response`}>
          {s.mediaType === 'text' ? (
            <View style={[StyleSheet.absoluteFill, styles.textThumb]}>
              <Text variant="caption" numberOfLines={5}>
                {s.text}
              </Text>
            </View>
          ) : (
            <Image source={{ uri: thumbnail(s.thumbnailUrl ?? s.mediaUrl ?? '') }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
          )}
          <View style={styles.thumbAuthor}>
            <Avatar uri={s.author.avatarUrl} name={s.author.displayName} size={22} borderColor={colors.bg} />
          </View>
        </AnimatedPressable>
      ))}
    </ScrollView>
  );
}

/** Compact top-3 list for Home and Group screens. */
export function LeaderboardSnapshot({ entries, myId }: { entries: LeaderboardEntry[]; myId: string | null }) {
  const top = rankEntries(entries, 'wins').slice(0, 3);
  return (
    <AnimatedPressable onPress={() => router.push('/leaderboard')} scaleTo={0.98} style={styles.board} accessibilityLabel="Open leaderboard">
      {top.map((e) => (
        <View key={e.userId} style={styles.boardRow}>
          <Text variant="bodyStrong" color={e.rank === 1 ? 'gold' : 'textMuted'} style={{ width: 20 }}>
            {e.rank}
          </Text>
          <Avatar uri={e.profile.avatarUrl} name={e.profile.displayName} size={32} />
          <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
            {e.userId === myId ? 'You' : e.profile.displayName}
          </Text>
          <Text variant="bodySmall" color="textMuted">
            {e.wins} {e.wins === 1 ? 'win' : 'wins'}
          </Text>
        </View>
      ))}
    </AnimatedPressable>
  );
}

export function GroupSwitcher({ visible, onClose, groups, selectedId, onSelect }: { visible: boolean; onClose: () => void; groups: Group[]; selectedId?: string; onSelect: (id: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Switch group">
      <View style={{ gap: space.xs }}>
        {groups.map((g) => (
          <AnimatedPressable
            key={g.id}
            onPress={() => {
              onSelect(g.id);
              onClose();
            }}
            style={[styles.groupRow, g.id === selectedId && styles.groupOn]}
            accessibilityRole="radio"
            accessibilityState={{ checked: g.id === selectedId }}
          >
            <Text style={{ fontSize: 24 }}>{g.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">{g.name}</Text>
              <Text variant="caption" color="textMuted">
                {g.memberCount} members
              </Text>
            </View>
            {g.id === selectedId && <Check size={20} color={colors.lime} />}
          </AnimatedPressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  deck: { gap: space.sm, paddingHorizontal: space.lg },
  thumb: { width: 108, height: 144, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface },
  textThumb: { padding: space.sm, backgroundColor: colors.primaryMuted, justifyContent: 'center' },
  thumbAuthor: { position: 'absolute', left: 6, bottom: 6 },
  board: { marginHorizontal: space.lg, padding: space.md, gap: space.sm, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  boardRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radii.lg, backgroundColor: colors.surface, minHeight: 60 },
  groupOn: { borderWidth: 1, borderColor: colors.primary },
});
