import type { LeaderboardEntry, LeaderboardMetric, RankedEntry } from '@/types/domain';

export const METRIC_LABELS: Record<LeaderboardMetric, string> = {
  wins: 'Weekly wins',
  participation: 'Participation',
  reactions: 'Reactions',
  streak: 'Streak',
};

/** Sorts by metric (desc), ties broken by username, using standard competition ranking (1, 2, 2, 4). */
export function rankEntries(entries: LeaderboardEntry[], metric: LeaderboardMetric): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b[metric] - a[metric] || a.profile.username.localeCompare(b.profile.username),
  );
  let rank = 0;
  return sorted.map((entry, i) => {
    if (i === 0 || entry[metric] !== sorted[i - 1][metric]) rank = i + 1;
    return { ...entry, rank, score: entry[metric] };
  });
}

export function applyScoreDelta(
  entries: LeaderboardEntry[],
  userId: string,
  metric: LeaderboardMetric,
  delta: number,
): LeaderboardEntry[] {
  return entries.map((e) => (e.userId === userId ? { ...e, [metric]: Math.max(0, e[metric] + delta) } : e));
}
