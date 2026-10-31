import { useMutation, useQuery } from '@tanstack/react-query';
import { qk, queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import { useAppStore } from '@/store/appStore';
import { toast } from '@/store/toastStore';
import type { Group } from '@/types/domain';

export const useMyGroups = () => useQuery({ queryKey: qk.groups, queryFn: backend.groups.mine });

/** The group the app is focused on: the persisted selection, or the first group the user belongs to. */
export function useSelectedGroup() {
  const selectedId = useAppStore((s) => s.selectedGroupId);
  const groups = useMyGroups();
  const group = groups.data?.find((g) => g.id === selectedId) ?? groups.data?.[0] ?? null;
  return { group, groups: groups.data ?? [], isLoading: groups.isLoading, error: groups.error, refetch: groups.refetch };
}

export const useGroup = (id: string) => useQuery({ queryKey: qk.group(id), queryFn: () => backend.groups.get(id) });
export const useMembers = (id?: string) =>
  useQuery({ queryKey: qk.members(id ?? ''), queryFn: () => backend.groups.members(id as string), enabled: !!id });
export const useActivity = (id?: string) =>
  useQuery({ queryKey: qk.activity(id ?? ''), queryFn: () => backend.groups.activity(id as string), enabled: !!id });
export const useChallengeHistory = (id?: string) =>
  useQuery({ queryKey: qk.history(id ?? ''), queryFn: () => backend.challenges.history(id as string), enabled: !!id });

const onJoined = (g: Group) => {
  queryClient.setQueryData<Group[]>(qk.groups, (old) => (old?.some((x) => x.id === g.id) ? old : [...(old ?? []), g]));
  useAppStore.getState().selectGroup(g.id);
  void queryClient.invalidateQueries({ queryKey: qk.groups });
};

export const useCreateGroup = () => useMutation({ mutationFn: backend.groups.create, onSuccess: onJoined });
export const useJoinGroup = () => useMutation({ mutationFn: backend.groups.join, onSuccess: onJoined });

export function useLeaveGroup() {
  return useMutation({
    mutationFn: backend.groups.leave,
    onSuccess: (_v, id) => {
      queryClient.setQueryData<Group[]>(qk.groups, (old) => old?.filter((g) => g.id !== id));
      if (useAppStore.getState().selectedGroupId === id) useAppStore.getState().selectGroup(null);
    },
  });
}

/** Optimistic rename with rollback. */
export function useRenameGroup(id: string) {
  return useMutation({
    mutationFn: (name: string) => backend.groups.rename(id, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: qk.group(id) });
      const prev = queryClient.getQueryData<Group>(qk.group(id));
      if (prev) queryClient.setQueryData<Group>(qk.group(id), { ...prev, name });
      return { prev };
    },
    onError: (_e, _n, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qk.group(id), ctx.prev);
      toast.error('Couldn’t rename group', 'Your change was undone.');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.groups }),
  });
}
