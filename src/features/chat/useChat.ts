import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { mergeServerMessage, setMessageStatus, toggleMessageReaction } from '@/domain/messages';
import { toAppError } from '@/lib/errors';
import { uid } from '@/lib/ids';
import { qk, queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import type { ConnectionStatus, SendMessageInput } from '@/services/types';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/store/toastStore';
import type { Message } from '@/types/domain';

const TYPING_TTL = 4000;

/**
 * Realtime group chat.
 * Server-confirmed rows and optimistic rows live in the same cache list but are
 * distinguished by `status` and reconciled through `clientId` (see domain/messages.ts).
 */
export function useChat(groupId: string | undefined) {
  const key = qk.messages(groupId ?? '');
  const userId = useAppStore((s) => s.userId);
  const messages = useQuery({ queryKey: key, queryFn: () => backend.chat.list(groupId as string), enabled: !!groupId });
  const [typing, setTyping] = useState<string[]>([]);
  const [connection, setConnection] = useState<ConnectionStatus>('connected');
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const lastTypingSent = useRef(0);

  const update = useCallback((fn: (list: Message[]) => Message[]) => queryClient.setQueryData<Message[]>(key, (old) => fn(old ?? [])), [key]);

  useEffect(() => {
    if (!groupId) return;
    let wasReconnecting = false;
    const typingTimers = timers.current;
    const unsubscribe = backend.chat.subscribe(groupId, {
      onMessage: (m) => update((list) => mergeServerMessage(list, m)),
      onTyping: (user, isTyping) => {
        if (user === userId) return;
        clearTimeout(typingTimers.get(user));
        setTyping((t) => (isTyping ? Array.from(new Set([...t, user])) : t.filter((u) => u !== user)));
        if (isTyping) typingTimers.set(user, setTimeout(() => setTyping((t) => t.filter((u) => u !== user)), TYPING_TTL));
      },
      onStatus: (s) => {
        setConnection(s);
        // After a reconnect, refetch so messages missed while offline are restored.
        if (s === 'connected' && wasReconnecting) void queryClient.invalidateQueries({ queryKey: qk.messages(groupId) });
        wasReconnecting = s === 'reconnecting';
      },
    });
    return () => {
      unsubscribe();
      typingTimers.forEach(clearTimeout);
    };
  }, [groupId, update, userId]);

  const deliver = useCallback(
    async (input: SendMessageInput) => {
      try {
        const confirmed = await backend.chat.send(input);
        update((list) => mergeServerMessage(list, { ...confirmed, clientId: input.clientId }));
      } catch (e) {
        toAppError(e, 'network');
        update((list) => setMessageStatus(list, input.clientId, 'failed'));
      }
    },
    [update],
  );

  const send = useCallback(
    (body: string, extra: Pick<SendMessageInput, 'replyToId' | 'challengeRef' | 'mediaUrl'> = {}) => {
      if (!groupId || !userId || (!body.trim() && !extra.mediaUrl)) return;
      const clientId = uid('c');
      const optimistic: Message = {
        id: clientId,
        clientId,
        groupId,
        userId,
        body: body.trim(),
        createdAt: new Date().toISOString(),
        status: 'sending',
        reactions: {},
        ...extra,
      };
      update((list) => [...list, optimistic]);
      void deliver({ clientId, groupId, body: optimistic.body, ...extra });
    },
    [deliver, groupId, update, userId],
  );

  const resend = useCallback(
    (msg: Message) => {
      if (!msg.clientId || !groupId) return;
      update((list) => setMessageStatus(list, msg.clientId as string, 'sending'));
      void deliver({ clientId: msg.clientId, groupId, body: msg.body, replyToId: msg.replyToId, challengeRef: msg.challengeRef, mediaUrl: msg.mediaUrl });
    },
    [deliver, groupId, update],
  );

  const react = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return;
      update((list) => toggleMessageReaction(list, messageId, emoji, userId));
      try {
        await backend.chat.react(messageId, emoji);
      } catch (e) {
        toAppError(e);
        update((list) => toggleMessageReaction(list, messageId, emoji, userId));
        toast.error('Reaction failed', 'We undid it. Try again.');
      }
    },
    [update, userId],
  );

  const notifyTyping = useCallback(() => {
    if (!groupId || Date.now() - lastTypingSent.current < 2000) return;
    lastTypingSent.current = Date.now();
    backend.chat.setTyping(groupId, true);
  }, [groupId]);

  return { ...messages, messages: messages.data ?? [], typing, connection, send, resend, react, notifyTyping };
}
