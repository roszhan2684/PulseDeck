import { applyReaction, applyVote, totalReactions } from '@/domain/reactions';
import type { Submission } from '@/types/domain';

const sub = (id: string, extra: Partial<Submission> = {}): Submission => ({
  id,
  challengeId: 'c',
  userId: 'u',
  author: { id: 'u', username: 'u', displayName: 'U', avatarUrl: '', bio: '' },
  mediaType: 'photo',
  caption: '',
  createdAt: '',
  reactions: { '🔥': 2 },
  myReactions: [],
  voteCount: 0,
  ...extra,
});

describe('reactions', () => {
  it('toggle adds then removes', () => {
    const on = applyReaction(sub('s'), '🔥', 'toggle');
    expect(on.reactions['🔥']).toBe(3);
    expect(on.myReactions).toEqual(['🔥']);
    const off = applyReaction(on, '🔥', 'toggle');
    expect(off.reactions['🔥']).toBe(2);
    expect(off.myReactions).toEqual([]);
  });

  it('double-tap (add) is idempotent so rapid taps never undo a reaction', () => {
    const once = applyReaction(sub('s'), '🔥', 'add');
    const twice = applyReaction(once, '🔥', 'add');
    expect(twice).toBe(once);
    expect(twice.reactions['🔥']).toBe(3);
  });

  it('supports multiple reaction types per user', () => {
    const r = applyReaction(applyReaction(sub('s'), '😂', 'toggle'), '💀', 'toggle');
    expect(r.myReactions).toEqual(['😂', '💀']);
    expect(totalReactions(r)).toBe(4);
  });
});

describe('votes', () => {
  const subs = [sub('a', { voteCount: 1 }), sub('b', { voteCount: 2 })];
  it('casts a first vote', () => expect(applyVote(subs, null, 'a')[0].voteCount).toBe(2));
  it('moves an existing vote (one vote per user per challenge)', () => {
    const out = applyVote(subs, 'b', 'a');
    expect(out.map((s) => s.voteCount)).toEqual([2, 1]);
  });
  it('is a no-op when re-voting the same submission', () => expect(applyVote(subs, 'a', 'a')).toBe(subs));
});
