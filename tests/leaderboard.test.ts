import { applyScoreDelta, rankEntries } from '@/domain/leaderboard';
import type { LeaderboardEntry } from '@/types/domain';

const e = (userId: string, username: string, wins: number, reactions = 0): LeaderboardEntry => ({
  userId,
  profile: { id: userId, username, displayName: username, avatarUrl: '', bio: '' },
  wins,
  participation: 0,
  reactions,
  streak: 0,
});

describe('rankEntries', () => {
  const board = [e('a', 'ava', 2), e('m', 'maya', 3), e('t', 'tyler', 2), e('j', 'jordan', 0)];

  it('sorts by metric descending', () => {
    expect(rankEntries(board, 'wins').map((x) => x.userId)).toEqual(['m', 'a', 't', 'j']);
  });
  it('uses competition ranking for ties (1, 2, 2, 4)', () => {
    expect(rankEntries(board, 'wins').map((x) => x.rank)).toEqual([1, 2, 2, 4]);
  });
  it('breaks ties alphabetically by username for a stable order', () => {
    const r = rankEntries(board, 'wins');
    expect(r[1].profile.username).toBe('ava');
    expect(r[2].profile.username).toBe('tyler');
  });
  it('re-ranks when a live update changes scores', () => {
    const next = applyScoreDelta(board, 'j', 'wins', 5);
    expect(rankEntries(next, 'wins')[0].userId).toBe('j');
  });
  it('never lets scores go negative', () => {
    expect(applyScoreDelta(board, 'j', 'wins', -3).find((x) => x.userId === 'j')?.wins).toBe(0);
  });
  it('does not mutate the input', () => {
    const copy = JSON.stringify(board);
    rankEntries(board, 'reactions');
    expect(JSON.stringify(board)).toBe(copy);
  });
});
