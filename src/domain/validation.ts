export type ValidationResult = { ok: true } | { ok: false; message: string };

const ok: ValidationResult = { ok: true };
const fail = (message: string): ValidationResult => ({ ok: false, message });

export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return fail('Enter your email.');
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? ok : fail('That email doesn’t look right.');
}

export function validatePassword(pw: string): ValidationResult {
  if (pw.length < 8) return fail('Use at least 8 characters.');
  if (!/[0-9]/.test(pw) || !/[a-zA-Z]/.test(pw)) return fail('Mix letters and numbers.');
  return ok;
}

export function validateUsername(name: string): ValidationResult {
  const v = name.trim();
  if (v.length < 3) return fail('At least 3 characters.');
  if (v.length > 20) return fail('20 characters max.');
  if (!/^[a-z0-9._]+$/.test(v)) return fail('Lowercase letters, numbers, dots and underscores only.');
  if (/^[._]|[._]$/.test(v)) return fail('Can’t start or end with a dot or underscore.');
  return ok;
}

export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

export function validateInviteCode(code: string): ValidationResult {
  return /^[A-Z0-9]{6}$/.test(normalizeInviteCode(code)) ? ok : fail('Invite codes are 6 letters or numbers.');
}

export function validateGroupName(name: string): ValidationResult {
  const v = name.trim();
  if (v.length < 2) return fail('Give your group a name.');
  if (v.length > 32) return fail('32 characters max.');
  return ok;
}
