import type { Message } from '@/types/domain';

const byTime = (a: Message, b: Message) => Date.parse(a.createdAt) - Date.parse(b.createdAt);

/**
 * Merges a server-confirmed message into a list that may hold optimistic copies.
 * - replaces the optimistic copy with the same clientId
 * - ignores duplicates (same id), which happen when realtime and the insert response race
 */
export function mergeServerMessage(list: Message[], incoming: Message): Message[] {
  if (incoming.clientId) {
    const idx = list.findIndex((m) => m.clientId === incoming.clientId);
    if (idx >= 0) {
      const next = [...list];
      next[idx] = { ...incoming, status: 'sent' };
      return next;
    }
  }
  if (list.some((m) => m.id === incoming.id)) return list;
  return [...list, { ...incoming, status: incoming.status === 'sending' ? 'sent' : incoming.status }].sort(byTime);
}

export function setMessageStatus(list: Message[], clientId: string, status: Message['status']): Message[] {
  return list.map((m) => (m.clientId === clientId ? { ...m, status } : m));
}

export function toggleMessageReaction(list: Message[], messageId: string, emoji: string, userId: string): Message[] {
  return list.map((m) => {
    if (m.id !== messageId) return m;
    const users = m.reactions[emoji] ?? [];
    const next = users.includes(userId) ? users.filter((u) => u !== userId) : [...users, userId];
    return { ...m, reactions: { ...m.reactions, [emoji]: next } };
  });
}
