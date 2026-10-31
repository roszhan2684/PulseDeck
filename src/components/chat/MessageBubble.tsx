import { router, type Href } from 'expo-router';
import { Check, CircleAlert, Clock, Reply } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { haptics } from '@/lib/haptics';
import { clockTime } from '@/lib/time';
import { colors, radii, space } from '@/theme';
import { springs } from '@/theme/motion';
import type { Message, Profile } from '@/types/domain';
import { Avatar, Text } from '../ui';

const REPLY_TRIGGER = 56;

export interface MessageBubbleProps {
  message: Message;
  author?: Profile;
  isMine: boolean;
  /** First message in a run from the same author: shows name + avatar. */
  showAuthor: boolean;
  replyTo?: Message;
  replyAuthor?: Profile;
  myId: string;
  onReply: (m: Message) => void;
  onLongPress: (m: Message) => void;
  onRetry: (m: Message) => void;
  onReact: (m: Message, emoji: string) => void;
}

/** Chat bubble with swipe-to-reply, delivery state, reactions, reply quote and challenge reference. */
export function MessageBubble({ message, author, isMine, showAuthor, replyTo, replyAuthor, myId, onReply, onLongPress, onRetry, onReact }: MessageBubbleProps) {
  const x = useSharedValue(0);
  const fired = useSharedValue(false);
  const failed = message.status === 'failed';

  const pan = usePanGesture({
    activeOffsetX: 14,
    failOffsetY: [-12, 12],
    onUpdate: (e) => {
      'worklet';
      x.set(Math.min(Math.max(0, e.translationX) * 0.6, REPLY_TRIGGER + 16));
      if (x.get() >= REPLY_TRIGGER && !fired.get()) {
        fired.set(true);
        scheduleOnRN(haptics.selection);
      }
    },
    onDeactivate: () => {
      'worklet';
      if (fired.get()) scheduleOnRN(onReply, message);
      fired.set(false);
      x.set(withSpring(0, springs.snappy));
    },
  });

  const bubble = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const replyIcon = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, REPLY_TRIGGER], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(x.get(), [0, REPLY_TRIGGER], [0.5, 1], Extrapolation.CLAMP) }],
  }));

  const reactions = Object.entries(message.reactions).filter(([, users]) => (users?.length ?? 0) > 0);
  const StatusIcon = message.status === 'sending' ? Clock : failed ? CircleAlert : Check;

  return (
    <View style={[styles.row, isMine && styles.rowMine, showAuthor && { marginTop: space.sm }]}>
      <Animated.View style={[styles.replyIcon, replyIcon]}>
        <Reply size={18} color={colors.textMuted} />
      </Animated.View>
      {!isMine && <View style={styles.avatarSlot}>{showAuthor && <Avatar uri={author?.avatarUrl} name={author?.displayName} size={30} />}</View>}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.col, isMine && styles.colMine, bubble]}>
          {showAuthor && !isMine && (
            <Text variant="caption" color="textMuted" style={styles.name}>
              {author?.displayName.split(' ')[0]}
            </Text>
          )}
          <Pressable
            onLongPress={() => onLongPress(message)}
            onPress={failed ? () => onRetry(message) : undefined}
            delayLongPress={300}
            accessibilityRole="text"
            accessibilityLabel={`${isMine ? 'You' : author?.displayName}: ${message.body}. ${clockTime(message.createdAt)}${failed ? '. Failed to send, double tap to retry' : ''}`}
            accessibilityActions={[{ name: 'activate' }, { name: 'longpress', label: 'React or reply' }]}
            style={[styles.bubble, isMine ? styles.mine : styles.theirs, message.status === 'sending' && styles.sending, failed && styles.failed]}
          >
            {replyTo && (
              <View style={styles.quote}>
                <Text variant="caption" color="primary" style={{ fontFamily: 'Inter_600SemiBold' }}>
                  {replyTo.userId === myId ? 'You' : replyAuthor?.displayName.split(' ')[0]}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={1}>
                  {replyTo.body}
                </Text>
              </View>
            )}
            {message.challengeRef && (
              <Pressable onPress={() => router.push(`/challenge/${message.challengeRef?.id}` as Href)} style={styles.ref} accessibilityRole="link" accessibilityLabel={`Open challenge ${message.challengeRef.prompt}`}>
                <Text variant="overline" color="lime">
                  Challenge
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {message.challengeRef.prompt} →
                </Text>
              </Pressable>
            )}
            {message.mediaUrl && <Image source={{ uri: message.mediaUrl }} style={styles.media} contentFit="cover" />}
            {!!message.body && <Text variant="body">{message.body}</Text>}
            <View style={styles.meta}>
              <Text variant="caption" color={isMine ? 'textMuted' : 'textSubtle'} style={{ fontSize: 11 }}>
                {failed ? 'Not sent · Tap to retry' : clockTime(message.createdAt)}
              </Text>
              {isMine && <StatusIcon size={12} color={failed ? colors.danger : colors.textMuted} />}
            </View>
          </Pressable>
          {reactions.length > 0 && (
            <View style={[styles.reactions, isMine && { alignSelf: 'flex-end' }]}>
              {reactions.map(([emoji, users]) => (
                <Pressable key={emoji} onPress={() => onReact(message, emoji)} style={[styles.reaction, users?.includes(myId) && styles.reactionMine]} accessibilityRole="button" accessibilityLabel={`${emoji} ${users?.length}`}>
                  <Text style={{ fontSize: 12 }}>{emoji}</Text>
                  <Text variant="caption" style={{ fontSize: 11 }}>
                    {users?.length}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: space.md, marginTop: 3 },
  rowMine: { justifyContent: 'flex-end' },
  avatarSlot: { width: 30, marginRight: space.xs },
  col: { maxWidth: '78%' },
  colMine: { alignItems: 'flex-end' },
  name: { marginLeft: space.sm, marginBottom: 3 },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.lg, gap: 4 },
  mine: { backgroundColor: colors.primary, borderBottomRightRadius: radii.xs },
  theirs: { backgroundColor: colors.surfaceRaised, borderBottomLeftRadius: radii.xs },
  sending: { opacity: 0.7 },
  failed: { backgroundColor: colors.dangerMuted, borderWidth: 1, borderColor: colors.danger },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: space.xs, marginBottom: 2, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: radii.xs, paddingVertical: 4, paddingRight: space.xs },
  ref: { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: radii.sm, padding: space.xs, gap: 2 },
  media: { width: 200, height: 200, borderRadius: radii.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-end' },
  reactions: { flexDirection: 'row', gap: 4, marginTop: -6, marginLeft: space.xs },
  reaction: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.bg },
  reactionMine: { borderColor: colors.primary },
  replyIcon: { position: 'absolute', left: space.md, bottom: 12 },
});
