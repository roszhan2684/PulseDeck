import { useMutation, useQuery } from '@tanstack/react-query';
import { applyReaction, applyVote } from '@/domain/reactions';
import { errorCopy, toAppError } from '@/lib/errors';
import { qk, queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import { toast } from '@/store/toastStore';
import type { ReactionType, Submission } from '@/types/domain';

/** Optimistic reactions: update the feed cache immediately, roll back and explain on failure. */
export function useReact(challengeId: string) {
  const key = qk.feed(challengeId);
  return useMutation({
    mutationFn: (v: { submissionId: string; type: ReactionType; mode: 'toggle' | 'add' }) =>
      backend.submissions.react(v.submissionId, v.type, v.mode),
    onMutate: async ({ submissionId, type, mode }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<Submission[]>(key);
      queryClient.setQueryData<Submission[]>(key, (old) => old?.map((s) => (s.id === submissionId ? applyReaction(s, type, mode) : s)));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(key, ctx.prev);
      const err = toAppError(e);
      toast.error('Reaction didn’t stick', errorCopy[err.kind].message);
    },
  });
}

export const useMyVote = (challengeId: string) =>
  useQuery({ queryKey: qk.myVote(challengeId), queryFn: () => backend.submissions.myVote(challengeId) });

export function useVote(challengeId: string) {
  return useMutation({
    mutationFn: (submissionId: string) => backend.submissions.vote(challengeId, submissionId),
    onMutate: async (submissionId) => {
      await queryClient.cancelQueries({ queryKey: qk.feed(challengeId) });
      const prevFeed = queryClient.getQueryData<Submission[]>(qk.feed(challengeId));
      const prevVote = queryClient.getQueryData<string | null>(qk.myVote(challengeId)) ?? null;
      queryClient.setQueryData<Submission[]>(qk.feed(challengeId), (old) => old && applyVote(old, prevVote, submissionId));
      queryClient.setQueryData(qk.myVote(challengeId), submissionId);
      return { prevFeed, prevVote };
    },
    onError: (e, _v, ctx) => {
      queryClient.setQueryData(qk.feed(challengeId), ctx?.prevFeed);
      queryClient.setQueryData(qk.myVote(challengeId), ctx?.prevVote ?? null);
      const err = toAppError(e);
      toast.error('Vote not counted', err.kind === 'validation' ? err.message : errorCopy[err.kind].message);
    },
  });
}
