import type { ReactionType, Submission } from '@/types/domain';

/**
 * Reaction rules: one reaction per type per user.
 * - `toggle` (long-press menu, chip tap) adds or removes.
 * - `add` (double-tap) only adds, so rapid double-taps never undo a reaction.
 */
export function applyReaction(sub: Submission, type: ReactionType, mode: 'toggle' | 'add'): Submission {
  const has = sub.myReactions.includes(type);
  if (has && mode === 'add') return sub;
  const delta = has ? -1 : 1;
  const count = Math.max(0, (sub.reactions[type] ?? 0) + delta);
  return {
    ...sub,
    reactions: { ...sub.reactions, [type]: count },
    myReactions: has ? sub.myReactions.filter((r) => r !== type) : [...sub.myReactions, type],
  };
}

export function totalReactions(sub: Pick<Submission, 'reactions'>): number {
  return Object.values(sub.reactions).reduce<number>((sum, n) => sum + (n ?? 0), 0);
}

/** One vote per user per challenge; voting for another submission moves the vote. */
export function applyVote(subs: Submission[], previousId: string | null, nextId: string): Submission[] {
  if (previousId === nextId) return subs;
  return subs.map((s) => {
    if (s.id === nextId) return { ...s, voteCount: s.voteCount + 1 };
    if (s.id === previousId) return { ...s, voteCount: Math.max(0, s.voteCount - 1) };
    return s;
  });
}
