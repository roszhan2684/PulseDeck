import { QueryClient } from '@tanstack/react-query';
import { AppError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => !(error instanceof AppError && ['permission', 'notFound', 'auth'].includes(error.kind)) && count < 2,
    },
    mutations: { retry: 0 },
  },
});

export const qk = {
  me: ['me'] as const,
  profile: (id: string) => ['profile', id] as const,
  stats: (id: string) => ['stats', id] as const,
  userSubmissions: (id: string) => ['userSubmissions', id] as const,
  groups: ['groups'] as const,
  group: (id: string) => ['group', id] as const,
  members: (id: string) => ['members', id] as const,
  currentChallenge: (groupId: string) => ['currentChallenge', groupId] as const,
  challenge: (id: string) => ['challenge', id] as const,
  history: (groupId: string) => ['history', groupId] as const,
  feed: (challengeId: string) => ['feed', challengeId] as const,
  myVote: (challengeId: string) => ['myVote', challengeId] as const,
  messages: (groupId: string) => ['messages', groupId] as const,
  leaderboard: (groupId: string) => ['leaderboard', groupId] as const,
  activity: (groupId: string) => ['activity', groupId] as const,
};
