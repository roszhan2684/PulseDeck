/* Developer-visible logging. Silent in production builds except errors. */
export const logger = {
  debug: (...args: unknown[]) => {
    if (__DEV__) console.log('[pulsedeck]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) console.warn('[pulsedeck]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[pulsedeck]', ...args);
  },
};
