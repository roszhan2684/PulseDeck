import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, ChevronUp, Crown, Flame } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radii, space } from '@/theme';
import type { RankedEntry } from '@/types/domain';
import { AnimatedCounter } from '../motion/AnimatedCounter';
import { AnimatedPressable } from '../motion/AnimatedPressable';
import { Avatar, Text } from '../ui';

const medal = [colors.gold, colors.silver, colors.bronze];

export interface LeaderboardRowProps {
  entry: RankedEntry;
  unit: string;
  isMe: boolean;
  /** Positive = moved up since last update. */
  movement: number;
  onPress: () => void;
}

/** Leaderboard row. Parent wraps it in AnimatedListItem so rank changes animate as physical reorders. */
export function LeaderboardRow({ entry, unit, isMe, movement, onPress }: LeaderboardRowProps) {
  const leader = entry.rank === 1;
  return (
    <AnimatedPressable onPress={onPress} scaleTo={0.98} style={[styles.row, isMe && styles.me, leader && styles.leader]} accessibilityLabel={`Rank ${entry.rank}, ${entry.profile.displayName}${isMe ? ' (you)' : ''}, ${entry.score} ${unit}`}>
      {leader && <LinearGradient colors={['rgba(255,209,92,0.16)', 'rgba(255,209,92,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />}
      <View style={styles.rank}>
        {entry.rank <= 3 ? (
          <View style={[styles.medal, { backgroundColor: medal[entry.rank - 1] }]}>
            <Text variant="caption" color="textInverse" style={{ fontFamily: 'Inter_700Bold' }}>
              {entry.rank}
            </Text>
          </View>
        ) : (
          <Text variant="bodyStrong" color="textMuted">
            {entry.rank}
          </Text>
        )}
      </View>
      <View>
        <Avatar uri={entry.profile.avatarUrl} name={entry.profile.displayName} size={44} borderColor={leader ? colors.gold : undefined} />
        {leader && (
          <View style={styles.crown}>
            <Crown size={14} color={colors.gold} fill={colors.gold} />
          </View>
        )}
      </View>
      <View style={styles.name}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {isMe ? 'You' : entry.profile.displayName}
        </Text>
        <View style={styles.sub}>
          <Flame size={12} color={colors.warning} />
          <Text variant="caption" color="textMuted">
            {entry.streak}-day streak
          </Text>
          {movement !== 0 &&
            (movement > 0 ? <ChevronUp size={14} color={colors.success} accessibilityLabel="Moved up" /> : <ChevronDown size={14} color={colors.danger} accessibilityLabel="Moved down" />)}
        </View>
      </View>
      <View style={styles.score}>
        <AnimatedCounter value={entry.score} variant="h2" color={leader ? 'gold' : 'text'} />
        <Text variant="caption" color="textSubtle">
          {unit}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.sm, paddingRight: space.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: 'hidden' },
  me: { borderColor: colors.primary, borderWidth: 1 },
  leader: { borderColor: 'rgba(255,209,92,0.5)', borderWidth: 1 },
  rank: { width: 32, alignItems: 'center' },
  medal: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  crown: { position: 'absolute', top: -9, alignSelf: 'center' },
  name: { flex: 1, gap: 2 },
  sub: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  score: { alignItems: 'flex-end' },
});
