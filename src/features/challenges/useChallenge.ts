import { useQuery } from '@tanstack/react-query';
import { getChallengePhase, phaseDeadline, type ChallengePhase } from '@/domain/challengeState';
import { useNow } from '@/hooks/useNow';
import { qk } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import { useAppStore } from '@/store/appStore';
import type { Challenge, Submission } from '@/types/domain';

export const useCurrentChallenge = (groupId?: string) =>
  useQuery({ queryKey: qk.currentChallenge(groupId ?? ''), queryFn: () => backend.challenges.current(groupId as string), enabled: !!groupId });

export const useChallenge = (id: string) => useQuery({ queryKey: qk.challenge(id), queryFn: () => backend.challenges.get(id) });

/** Live phase + remaining time for a challenge. Ticks every second. */
export function useChallengePhase(challenge: Challenge | null | undefined, feed: Submission[] | undefined) {
  const now = useNow(1000);
  const userId = useAppStore((s) => s.userId);
  if (!challenge) return { phase: null as ChallengePhase | null, remainingMs: 0, mySubmission: undefined };
  const mySubmission = feed?.find((s) => s.userId === userId);
  const phase = getChallengePhase(challenge, now, !!mySubmission);
  const deadline = phaseDeadline(challenge, phase);
  return { phase, remainingMs: deadline ? Date.parse(deadline) - now : 0, mySubmission };
}
