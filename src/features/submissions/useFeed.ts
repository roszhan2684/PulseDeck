import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { AppError, toAppError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { qk, queryClient } from '@/lib/queryClient';
import { backend } from '@/services/backend';
import type { CreateSubmissionInput } from '@/services/types';
import type { Challenge, Submission } from '@/types/domain';

export const useFeed = (challengeId?: string) =>
  useQuery({ queryKey: qk.feed(challengeId ?? ''), queryFn: () => backend.submissions.list(challengeId as string), enabled: !!challengeId });

export type UploadState =
  | { phase: 'idle' }
  | { phase: 'preparing' | 'uploading' | 'processing'; progress: number }
  | { phase: 'success'; submission: Submission }
  | { phase: 'failure'; error: AppError };

/**
 * Drives the submission upload state machine:
 * idle → preparing → uploading(progress) → processing → success | failure → (retry) → preparing …
 * The last input is kept so a failed upload can be retried without re-picking media.
 */
export function useSubmissionUpload(challenge?: Challenge) {
  const [state, setState] = useState<UploadState>({ phase: 'idle' });
  const lastInput = useRef<CreateSubmissionInput | null>(null);

  const submit = useCallback(
    async (input: CreateSubmissionInput) => {
      lastInput.current = input;
      haptics.medium();
      try {
        const submission = await backend.submissions.create(input, (phase, progress) => setState({ phase, progress }));
        setState({ phase: 'success', submission });
        haptics.success();
        queryClient.setQueryData<Submission[]>(qk.feed(input.challengeId), (old) => [
          ...(old ?? []).filter((s) => s.userId !== submission.userId),
          submission,
        ]);
        if (challenge) {
          void queryClient.invalidateQueries({ queryKey: qk.members(challenge.groupId) });
          void queryClient.invalidateQueries({ queryKey: qk.activity(challenge.groupId) });
          void queryClient.invalidateQueries({ queryKey: qk.leaderboard(challenge.groupId) });
        }
        void queryClient.invalidateQueries({ queryKey: ['userSubmissions'] });
      } catch (e) {
        haptics.error();
        setState({ phase: 'failure', error: toAppError(e, 'upload') });
      }
    },
    [challenge],
  );

  const retry = useCallback(() => {
    if (lastInput.current) void submit(lastInput.current);
  }, [submit]);

  return { state, submit, retry, reset: () => setState({ phase: 'idle' }) };
}
