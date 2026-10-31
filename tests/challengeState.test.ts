import { formatCountdown, getChallengePhase, phaseDeadline } from '@/domain/challengeState';
import type { Challenge } from '@/types/domain';

const H = 3_600_000;
const now = Date.parse('2026-10-31T12:00:00Z');
const make = (start: number, sub: number, vote: number): Challenge => ({
  id: 'c',
  groupId: 'g',
  prompt: 'Show us your worst desk setup',
  description: '',
  emoji: '🖥️',
  startsAt: new Date(now + start * H).toISOString(),
  submissionEndsAt: new Date(now + sub * H).toISOString(),
  votingEndsAt: new Date(now + vote * H).toISOString(),
  status: 'active',
  createdBy: 'u',
});

describe('challenge state machine', () => {
  it('is upcoming before start', () => expect(getChallengePhase(make(1, 5, 8), now, false)).toBe('upcoming'));
  it('is active while submissions are open', () => expect(getChallengePhase(make(-1, 5, 8), now, false)).toBe('active'));
  it('is submitted once the viewer posted', () => expect(getChallengePhase(make(-1, 5, 8), now, true)).toBe('submitted'));
  it('moves to voting after submissions close, even if the viewer never posted', () =>
    expect(getChallengePhase(make(-6, -1, 3), now, false)).toBe('voting'));
  it('is completed after voting', () => expect(getChallengePhase(make(-9, -5, -1), now, true)).toBe('completed'));
  it('treats exact boundaries as the next phase', () => expect(getChallengePhase(make(-5, 0, 3), now, false)).toBe('voting'));

  it('targets the right deadline per phase', () => {
    const c = make(-1, 5, 8);
    expect(phaseDeadline(c, 'active')).toBe(c.submissionEndsAt);
    expect(phaseDeadline(c, 'voting')).toBe(c.votingEndsAt);
    expect(phaseDeadline(c, 'completed')).toBeNull();
  });
});

describe('formatCountdown', () => {
  it.each([
    [0, '0s'],
    [-5000, '0s'],
    [42_000, '42s'],
    [5 * 60_000 + 7000, '5m 07s'],
    [6 * H + 30 * 60_000, '6h 30m'],
    [50 * H, '2d 2h'],
  ])('%i ms → %s', (ms, out) => expect(formatCountdown(ms)).toBe(out));
});
