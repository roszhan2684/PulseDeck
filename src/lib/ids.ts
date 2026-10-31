export const uid = (prefix = 'tmp') => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function inviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}
