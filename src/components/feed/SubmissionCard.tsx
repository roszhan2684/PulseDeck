import { LinearGradient } from 'expo-linear-gradient';
import { Crown } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { totalReactions } from '@/domain/reactions';
import { timeAgo } from '@/lib/time';
import { colors, gradients, radii, space } from '@/theme';
import type { Submission } from '@/types/domain';
import { Avatar, Badge, Text } from '../ui';
import { SubmissionMedia } from './SubmissionMedia';

export interface SubmissionCardProps {
  submission: Submission;
  active: boolean;
  isWinner?: boolean;
  votedFor?: boolean;
  position: string;
}

/** A card in the swipe deck. Purely visual; gestures live in SwipeDeck. */
export function SubmissionCard({ submission, active, isWinner, votedFor, position }: SubmissionCardProps) {
  const top = Object.entries(submission.reactions)
    .filter(([, n]) => (n ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 3);
  return (
    <View style={StyleSheet.absoluteFill} accessible accessibilityLabel={`${submission.author.displayName}: ${submission.caption || submission.text || ''}. ${totalReactions(submission)} reactions.`}>
      <SubmissionMedia submission={submission} active={active} />
      <LinearGradient colors={['rgba(9,9,15,0.55)', 'rgba(9,9,15,0)']} style={styles.topFade} />
      <LinearGradient colors={gradients.mediaFade} style={styles.bottomFade} />
      <View style={styles.header}>
        <Avatar uri={submission.author.avatarUrl} name={submission.author.displayName} size={36} />
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {submission.author.displayName}
          </Text>
          <Text variant="caption" color="textMuted">
            @{submission.author.username} · {timeAgo(submission.createdAt)}
          </Text>
        </View>
        <Text variant="caption" color="textMuted" style={styles.position}>
          {position}
        </Text>
      </View>
      <View style={styles.footer}>
        <View style={styles.badges}>
          {isWinner && <Badge label="Winner" tone="warning" />}
          {votedFor && <Badge label="Your vote" tone="lime" />}
        </View>
        {!!submission.caption && (
          <Text variant="bodyStrong" numberOfLines={3}>
            {submission.caption}
          </Text>
        )}
        {top.length > 0 && (
          <View style={styles.reactions}>
            {top.map(([emoji, n]) => (
              <View key={emoji} style={[styles.reaction, submission.myReactions.includes(emoji as never) && styles.mine]}>
                <Text style={{ fontSize: 14 }}>{emoji}</Text>
                <Text variant="caption">{n}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      {isWinner && (
        <View style={styles.crown}>
          <Crown size={18} color={colors.gold} fill={colors.gold} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  bottomFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },
  header: { position: 'absolute', top: space.md, left: space.md, right: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  position: { backgroundColor: 'rgba(9,9,15,0.55)', paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radii.pill, overflow: 'hidden' },
  footer: { position: 'absolute', left: space.lg, right: space.lg, bottom: space.lg, gap: space.sm },
  badges: { flexDirection: 'row', gap: space.xs },
  reactions: { flexDirection: 'row', gap: space.xs },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill, backgroundColor: 'rgba(255,255,255,0.12)' },
  mine: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary },
  crown: { position: 'absolute', top: -2, alignSelf: 'center', padding: space.xs },
});
