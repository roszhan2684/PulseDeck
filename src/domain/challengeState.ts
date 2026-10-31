import type { Challenge } from '@/types/domain';

/** UI phases for a challenge. `submitted` is an active challenge the viewer already answered. */
export type ChallengePhase = 'upcoming' | 'active' | 'submitted' | 'voting' | 'completed';

export function getChallengePhase(challenge: Challenge, now: number, hasSubmitted: boolean): ChallengePhase {
  if (now < Date.parse(challenge.startsAt)) return 'upcoming';
  if (now < Date.parse(challenge.submissionEndsAt)) return hasSubmitted ? 'submitted' : 'active';
  if (now < Date.parse(challenge.votingEndsAt)) return 'voting';
  return 'completed';
}

/** The deadline the countdown should target for a phase, or null when nothing is pending. */
export function phaseDeadline(challenge: Challenge, phase: ChallengePhase): string | null {
  switch (phase) {
    case 'upcoming':
      return challenge.startsAt;
    case 'active':
    case 'submitted':
      return challenge.submissionEndsAt;
    case 'voting':
      return challenge.votingEndsAt;
    default:
      return null;
  }
}

export const phaseCopy: Record<ChallengePhase, { label: string; cta: string | null; countdownLabel: string }> = {
  upcoming: { label: 'Starts soon', cta: null, countdownLabel: 'Drops in' },
  active: { label: 'Live now', cta: 'Answer the challenge', countdownLabel: 'Closes in' },
  submitted: { label: 'You’re in', cta: 'See the deck', countdownLabel: 'Voting in' },
  voting: { label: 'Voting open', cta: 'Vote for a winner', countdownLabel: 'Voting ends in' },
  completed: { label: 'Wrapped', cta: 'See results', countdownLabel: 'Ended' },
};

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, '0')}s`;
  return `${sec}s`;
}
