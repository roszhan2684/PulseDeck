import { logger } from './logger';

export type ErrorKind =
  | 'network'
  | 'auth'
  | 'permission'
  | 'validation'
  | 'upload'
  | 'realtime'
  | 'server'
  | 'notFound'
  | 'empty';

export class AppError extends Error {
  constructor(
    public kind: ErrorKind,
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Human copy + recovery action for each error category. */
export const errorCopy: Record<ErrorKind, { title: string; message: string; action: string }> = {
  network: { title: 'You’re offline', message: 'Check your connection and we’ll pick up where you left off.', action: 'Try again' },
  auth: { title: 'Session expired', message: 'Sign in again to keep going.', action: 'Sign in' },
  permission: { title: 'No access', message: 'You need to be a member of this group to see this.', action: 'Go back' },
  validation: { title: 'Check that again', message: 'Something in the form needs a fix.', action: 'Fix it' },
  upload: { title: 'Upload failed', message: 'Your post is saved on this device. Retry when you’re ready.', action: 'Retry upload' },
  realtime: { title: 'Reconnecting…', message: 'Live updates paused. We’ll resync automatically.', action: 'Reconnect' },
  server: { title: 'Something broke', message: 'That’s on us. Give it another shot in a moment.', action: 'Try again' },
  notFound: { title: 'Not found', message: 'This may have been deleted or the link is wrong.', action: 'Go back' },
  empty: { title: 'Nothing yet', message: 'Be the first one here.', action: 'Refresh' },
};

export function toAppError(e: unknown, fallback: ErrorKind = 'server'): AppError {
  if (e instanceof AppError) return e;
  const msg = e instanceof Error ? e.message : String(e);
  const kind: ErrorKind = /network|fetch|timeout|offline/i.test(msg)
    ? 'network'
    : /jwt|auth|session|credentials/i.test(msg)
      ? 'auth'
      : /permission|row-level|policy|denied/i.test(msg)
        ? 'permission'
        : fallback;
  logger.error(`[${kind}]`, msg);
  return new AppError(kind, msg, e);
}
