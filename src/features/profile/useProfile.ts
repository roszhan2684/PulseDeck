import { useMutation, useQuery } from '@tanstack/react-query';
import { qk, queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import { toast } from '@/store/toastStore';
import type { Profile } from '@/types/domain';

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: backend.profiles.me });
export const useProfile = (id: string) => useQuery({ queryKey: qk.profile(id), queryFn: () => backend.profiles.get(id) });
export const useProfileStats = (id?: string) =>
  useQuery({ queryKey: qk.stats(id ?? ''), queryFn: () => backend.profiles.stats(id as string), enabled: !!id });
export const useUserSubmissions = (id?: string) =>
  useQuery({ queryKey: qk.userSubmissions(id ?? ''), queryFn: () => backend.profiles.submissions(id as string), enabled: !!id });

export function useUpdateProfile() {
  return useMutation({
    mutationFn: backend.profiles.update,
    onMutate: async (patch) => {
      const prev = queryClient.getQueryData<Profile>(qk.me);
      if (prev) queryClient.setQueryData<Profile>(qk.me, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.me, ctx.prev);
      toast.error('Profile not saved', 'We restored your previous details.');
    },
    onSuccess: (p) => {
      queryClient.setQueryData(qk.me, p);
      queryClient.setQueryData(qk.profile(p.id), p);
    },
  });
}
