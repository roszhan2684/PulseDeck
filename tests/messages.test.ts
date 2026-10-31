import { mergeServerMessage, setMessageStatus, toggleMessageReaction } from '@/domain/messages';
import type { Message } from '@/types/domain';

const msg = (id: string, minute: number, extra: Partial<Message> = {}): Message => ({
  id,
  groupId: 'g',
  userId: 'u',
  body: id,
  createdAt: new Date(Date.UTC(2026, 9, 31, 12, minute)).toISOString(),
  status: 'sent',
  reactions: {},
  ...extra,
});

describe('optimistic message reconciliation', () => {
  const optimistic = msg('c_1', 5, { clientId: 'c_1', status: 'sending' });

  it('replaces the optimistic copy with the server row (same clientId)', () => {
    const server = msg('m_99', 5, { clientId: 'c_1' });
    const out = mergeServerMessage([msg('m1', 1), optimistic], server);
    expect(out).toHaveLength(2);
    expect(out[1]).toMatchObject({ id: 'm_99', status: 'sent' });
  });

  it('ignores realtime echoes of a message already confirmed (no duplicates)', () => {
    const server = msg('m_99', 5, { clientId: 'c_1' });
    const once = mergeServerMessage([optimistic], server);
    const twice = mergeServerMessage(once, { ...server, clientId: undefined });
    expect(twice).toHaveLength(1);
  });

  it('inserts messages from others in chronological order', () => {
    const out = mergeServerMessage([msg('m1', 1), msg('m3', 3)], msg('m2', 2));
    expect(out.map((m) => m.id)).toEqual(['m1', 'm2', 'm3']);
  });

  it('marks failed sends and lets them be retried', () => {
    const failed = setMessageStatus([optimistic], 'c_1', 'failed');
    expect(failed[0].status).toBe('failed');
    expect(setMessageStatus(failed, 'c_1', 'sending')[0].status).toBe('sending');
  });

  it('toggles a user reaction on and off', () => {
    const on = toggleMessageReaction([msg('m1', 1)], 'm1', '🔥', 'me');
    expect(on[0].reactions['🔥']).toEqual(['me']);
    expect(toggleMessageReaction(on, 'm1', '🔥', 'me')[0].reactions['🔥']).toEqual([]);
  });
});
