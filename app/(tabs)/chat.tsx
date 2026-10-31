import { CornerUpLeft, RotateCcw } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Composer } from '@/components/chat/Composer';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { AnimatedPressable } from '@/components/motion';
import { Badge, Button, EmptyState, ErrorState, RowSkeleton, Screen, Sheet, Text } from '@/components/ui';
import { useCurrentChallenge } from '@/features/challenges/useChallenge';
import { useChat } from '@/features/chat/useChat';
import { useMembers, useSelectedGroup } from '@/features/groups/useGroups';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useReducedMotionPref } from '@/hooks/useMotion';
import { haptics } from '@/lib/haptics';
import { useAppStore } from '@/store/appStore';
import { colors, layout, radii, space } from '@/theme';
import { presets } from '@/theme/motion';
import type { Message } from '@/types/domain';

const QUICK = ['😂', '🔥', '💀', '❤️', '👏', '😮'];
const GAP_MS = 5 * 60_000;

export default function Chat() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotionPref();
  const myId = useAppStore((s) => s.userId) ?? '';
  const { group } = useSelectedGroup();
  const members = useMembers(group?.id);
  const challenge = useCurrentChallenge(group?.id);
  const chat = useChat(group?.id);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [menu, setMenu] = useState<Message | null>(null);
  const [mountedAt] = useState(() => Date.now());
  const keyboardHeight = useKeyboardHeight();
  const tabSpace = 64 + Math.max(insets.bottom, space.sm) + space.xs;

  const profiles = useMemo(() => new Map(members.data?.map((m) => [m.userId, m.profile])), [members.data]);
  const byId = useMemo(() => new Map(chat.messages.map((m) => [m.id, m])), [chat.messages]);
  const data = useMemo(() => [...chat.messages].reverse(), [chat.messages]);
  const typingProfiles = chat.typing.map((u) => profiles.get(u)).filter((p) => !!p);

  const composerPad = useAnimatedStyle(() => ({ paddingBottom: Math.max(keyboardHeight.get() + space.xs, tabSpace) }));
  const name = (m: Message | null) => (m ? (m.userId === myId ? 'yourself' : profiles.get(m.userId)?.displayName.split(' ')[0]) : '');

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={{ fontSize: 24 }}>{group?.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" numberOfLines={1} accessibilityRole="header">
            {group?.name ?? 'Chat'}
          </Text>
          <Text variant="caption" color="textMuted">
            {group?.memberCount ?? 0} members
          </Text>
        </View>
        {chat.connection === 'connected' ? <Badge label="Live" tone="success" dot /> : <Badge label="Reconnecting" tone="warning" dot />}
      </View>

      <View style={{ flex: 1 }}>
        {chat.error ? (
          <ErrorState error={chat.error} onRetry={() => chat.refetch()} />
        ) : chat.isLoading ? (
          <View style={styles.pad}>
            <RowSkeleton count={6} />
          </View>
        ) : !data.length ? (
          <EmptyState emoji="👋" title="Say hi" message="No messages yet. Start the banter." />
        ) : (
          <Animated.FlatList
            data={data}
            inverted
            keyExtractor={(m) => m.clientId ?? m.id}
            itemLayoutAnimation={presets.layout(reduced)}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingVertical: space.sm }}
            ListHeaderComponent={<TypingIndicator people={typingProfiles} />}
            renderItem={({ item, index }) => {
              const older = data[index + 1];
              const showAuthor = !older || older.userId !== item.userId || Date.parse(item.createdAt) - Date.parse(older.createdAt) > GAP_MS;
              const isNew = Date.parse(item.createdAt) > mountedAt - 1000;
              const reply = item.replyToId ? byId.get(item.replyToId) : undefined;
              return (
                <Animated.View entering={isNew ? (reduced ? undefined : FadeInUp.springify().damping(18)) : undefined}>
                  <MessageBubble
                    message={item}
                    author={profiles.get(item.userId)}
                    isMine={item.userId === myId}
                    showAuthor={showAuthor}
                    replyTo={reply}
                    replyAuthor={reply ? profiles.get(reply.userId) : undefined}
                    myId={myId}
                    onReply={setReplyTo}
                    onLongPress={(m) => {
                      haptics.medium();
                      setMenu(m);
                    }}
                    onRetry={chat.resend}
                    onReact={(m, e) => chat.react(m.id, e)}
                  />
                </Animated.View>
              );
            }}
          />
        )}
      </View>

      <Animated.View style={composerPad}>
        <Composer
          replyTo={replyTo}
          replyName={name(replyTo)}
          challenge={challenge.data}
          onCancelReply={() => setReplyTo(null)}
          onTyping={chat.notifyTyping}
          disabled={!group}
          onSend={(body, extra) => {
            chat.send(body, { ...extra, replyToId: replyTo?.id });
            setReplyTo(null);
          }}
        />
      </Animated.View>

      <Sheet visible={!!menu} onClose={() => setMenu(null)} title="Message">
        <View style={styles.quick}>
          {QUICK.map((e) => (
            <AnimatedPressable
              key={e}
              scaleTo={1.2}
              haptic="selection"
              accessibilityLabel={`React ${e}`}
              style={[styles.quickItem, menu?.reactions[e]?.includes(myId) && styles.quickOn]}
              onPress={() => {
                if (menu) void chat.react(menu.id, e);
                setMenu(null);
              }}
            >
              <Text style={{ fontSize: 28, lineHeight: 34 }}>{e}</Text>
            </AnimatedPressable>
          ))}
        </View>
        <View style={{ gap: space.xs }}>
          <Button
            label="Reply"
            icon={CornerUpLeft}
            variant="secondary"
            fullWidth
            onPress={() => {
              setReplyTo(menu);
              setMenu(null);
            }}
          />
          {menu?.status === 'failed' && (
            <Button
              label="Retry sending"
              icon={RotateCcw}
              variant="danger"
              fullWidth
              onPress={() => {
                chat.resend(menu);
                setMenu(null);
              }}
            />
          )}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: layout.screenPadding, paddingVertical: space.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pad: { padding: layout.screenPadding },
  quick: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.lg },
  quickItem: { width: 50, height: 50, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  quickOn: { backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary },
});
