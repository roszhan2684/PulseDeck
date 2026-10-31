import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Vote, X } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactionBar } from '@/components/feed/ReactionBar';
import { ReactionPicker } from '@/components/feed/ReactionPicker';
import { SubmissionCard } from '@/components/feed/SubmissionCard';
import { SubmissionMedia } from '@/components/feed/SubmissionMedia';
import { ReactionBurst, SharedMediaTransition, SwipeDeck, type Burst, type MediaRect } from '@/components/motion';
import { Button, EmptyState, ErrorState, IconButton, Screen, ScreenHeader, Skeleton, Text } from '@/components/ui';
import { formatCountdown, phaseCopy } from '@/domain/challengeState';
import { useChallenge, useChallengePhase } from '@/features/challenges/useChallenge';
import { useMyVote, useReact, useVote } from '@/features/reactions/useReactions';
import { useFeed } from '@/features/submissions/useFeed';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/appStore';
import { colors, radii, space } from '@/theme';
import { DEFAULT_REACTION, type ReactionType, type Submission } from '@/types/domain';

export default function ChallengeFeed() {
  const { id, start } = useLocalSearchParams<{ id: string; start?: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const myId = useAppStore((s) => s.userId);
  const challenge = useChallenge(id);
  const feed = useFeed(id);
  const myVote = useMyVote(id);
  const react = useReact(id);
  const vote = useVote(id);
  const { phase, remainingMs, mySubmission } = useChallengePhase(challenge.data, feed.data);
  const [index, setIndex] = useState(Number(start ?? 0) || 0);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [picker, setPicker] = useState<{ x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState<{ sub: Submission; origin: MediaRect } | null>(null);
  const deckRef = useRef<React.ComponentRef<typeof View>>(null);

  const subs = feed.data ?? [];
  const safeIndex = Math.min(index, Math.max(0, subs.length - 1));
  const current = subs[safeIndex];
  const cardW = width - space.lg * 2;
  const cardH = Math.min(height - insets.top - insets.bottom - 330, cardW * 1.42);
  const winnerId = challenge.data?.winnerSubmissionId ?? (phase === 'completed' ? [...subs].sort((a, b) => b.voteCount - a.voteCount)[0]?.id : undefined);

  const fire = (type: ReactionType, point?: { x: number; y: number }) => {
    setBurst({ id: Date.now(), emoji: type, x: point?.x, y: point?.y });
    haptics.selection();
  };
  const toggle = (s: Submission, type: ReactionType, point?: { x: number; y: number }) => {
    if (!s.myReactions.includes(type)) fire(type, point);
    react.mutate({ submissionId: s.id, type, mode: 'toggle' });
  };
  const expand = (s: Submission) =>
    deckRef.current?.measureInWindow((x, y, w, h) => setExpanded({ sub: s, origin: { x, y, width: w, height: h } }));

  if (challenge.error || feed.error) {
    return (
      <Screen>
        <ScreenHeader />
        <ErrorState error={challenge.error ?? feed.error} onRetry={() => (challenge.refetch(), feed.refetch())} />
      </Screen>
    );
  }

  const copy = phase ? phaseCopy[phase] : null;
  return (
    <Screen>
      <ScreenHeader
        title={challenge.data ? `${challenge.data.emoji} ${challenge.data.prompt}` : ''}
        subtitle={copy ? `${copy.label}${phase !== 'completed' ? ` · ${copy.countdownLabel.toLowerCase()} ${formatCountdown(remainingMs)}` : ''}` : undefined}
      />
      <View style={styles.deckArea}>
        {feed.isLoading ? (
          <Skeleton width={cardW} height={cardH} radius={radii.xl} />
        ) : !subs.length ? (
          <EmptyState emoji="🃏" title="No responses yet" message="The deck is empty. Somebody has to go first." actionLabel={phase === 'active' ? 'Be the first' : undefined} onAction={() => router.push(`/challenge/submit?challengeId=${id}` as Href)} />
        ) : (
          <View ref={deckRef} collapsable={false}>
            <SwipeDeck
              data={subs}
              index={safeIndex}
              onIndexChange={(i) => {
                setIndex(i);
                setPicker(null);
              }}
              keyExtractor={(s) => s.id}
              width={cardW}
              height={cardH}
              renderCard={(s, i, isTop) => (
                <SubmissionCard submission={s} active={isTop} isWinner={s.id === winnerId} votedFor={myVote.data === s.id} position={`${i + 1}/${subs.length}`} />
              )}
              onTap={expand}
              onDoubleTap={(s, p) => {
                fire(DEFAULT_REACTION, p);
                react.mutate({ submissionId: s.id, type: DEFAULT_REACTION, mode: 'add' });
              }}
              onLongPress={(_s, p) => {
                haptics.medium();
                setPicker(p);
              }}
            />
            <ReactionBurst burst={burst} />
            {current && (
              <ReactionPicker
                anchor={picker}
                selected={current.myReactions}
                onDismiss={() => setPicker(null)}
                onSelect={(r) => {
                  toggle(current, r, picker ?? undefined);
                  setPicker(null);
                }}
              />
            )}
          </View>
        )}
      </View>

      {current && (
        <View style={[styles.bottom, { paddingBottom: insets.bottom + space.sm }]}>
          <View style={styles.nav}>
            <IconButton icon={ChevronLeft} accessibilityLabel="Previous response" disabled={safeIndex === 0} onPress={() => setIndex(safeIndex - 1)} />
            <Text variant="caption" color="textMuted" align="center" style={{ flex: 1 }}>
              Swipe to browse · double-tap to {DEFAULT_REACTION} · hold to react
            </Text>
            <IconButton icon={ChevronRight} accessibilityLabel="Next response" disabled={safeIndex >= subs.length - 1} onPress={() => setIndex(safeIndex + 1)} />
          </View>
          <ReactionBar submission={current} onToggle={(r) => toggle(current, r)} />
          <View style={styles.cta}>
            {phase === 'active' && !mySubmission && <Button label="Add yours" icon={Plus} fullWidth onPress={() => router.push(`/challenge/submit?challengeId=${id}` as Href)} />}
            {phase === 'voting' &&
              (current.userId === myId ? (
                <Button label="That’s you. Vote for someone else" variant="secondary" disabled fullWidth />
              ) : (
                <Button
                  label={myVote.data === current.id ? `Voted for ${current.author.displayName.split(' ')[0]} ✓` : `Vote for ${current.author.displayName.split(' ')[0]}`}
                  icon={Vote}
                  variant={myVote.data === current.id ? 'secondary' : 'lime'}
                  fullWidth
                  onPress={() => {
                    haptics.medium();
                    vote.mutate(current.id);
                  }}
                />
              ))}
          </View>
        </View>
      )}

      <SharedMediaTransition
        visible={!!expanded}
        origin={expanded?.origin ?? null}
        onClose={() => setExpanded(null)}
        overlay={
          expanded && (
            <View style={[styles.expandedOverlay, { paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.lg }]} pointerEvents="box-none">
              <IconButton icon={X} variant="glass" accessibilityLabel="Close" onPress={() => setExpanded(null)} style={{ alignSelf: 'flex-end' }} />
              <View style={styles.expandedCaption}>
                <Text variant="bodyStrong">{expanded.sub.author.displayName}</Text>
                {!!expanded.sub.caption && <Text variant="body">{expanded.sub.caption}</Text>}
                <Text variant="caption" color="textMuted">
                  Drag down to close
                </Text>
              </View>
            </View>
          )
        }
      >
        {expanded && <SubmissionMedia submission={expanded.sub} active full />}
      </SharedMediaTransition>
    </Screen>
  );
}

const styles = StyleSheet.create({
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  bottom: { gap: space.sm },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm },
  cta: { paddingHorizontal: space.lg },
  expandedOverlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: space.lg },
  expandedCaption: { gap: space.xxs, backgroundColor: colors.overlay, padding: space.md, borderRadius: radii.lg },
});
