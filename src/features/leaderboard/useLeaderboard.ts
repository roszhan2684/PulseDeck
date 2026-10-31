import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { rankEntries } from '@/domain/leaderboard';
import { qk, queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import type { LeaderboardMetric } from '@/types/domain';

/** Leaderboard with live updates pushed into the query cache. Ranking is derived, never stored. */
export function useLeaderboard(groupId: string | undefined, metric: LeaderboardMetric, live = true) {
  const query = useQuery({
    queryKey: qk.leaderboard(groupId ?? ''),
    queryFn: () => backend.leaderboard.get(groupId as string),
    enabled: !!groupId,
  });
  useEffect(() => {
    if (!groupId || !live) return;
    return backend.leaderboard.subscribe(groupId, (entries) => queryClient.setQueryData(qk.leaderboard(groupId), entries));
  }, [groupId, live]);
  const ranked = useMemo(() => rankEntries(query.data ?? [], metric), [query.data, metric]);
  return { ...query, ranked };
}
