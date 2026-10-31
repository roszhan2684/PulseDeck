import { normalizeInviteCode, validateEmail, validateGroupName, validateInviteCode, validatePassword, validateUsername } from '@/domain/validation';

describe('validation', () => {
  it.each(['jordan.rivera', 'maya_t', 'ava2026'])('accepts username %s', (u) => expect(validateUsername(u).ok).toBe(true));
  it.each(['ab', 'Jordan', 'has space', '.dot', 'under_', 'x'.repeat(21)])('rejects username %s', (u) => expect(validateUsername(u).ok).toBe(false));
  it('validates email', () => {
    expect(validateEmail('jordan@pulsedeck.app').ok).toBe(true);
    expect(validateEmail('jordan@').ok).toBe(false);
    expect(validateEmail('   ').ok).toBe(false);
  });
  it('requires 8+ chars with letters and numbers', () => {
    expect(validatePassword('short1').ok).toBe(false);
    expect(validatePassword('longpassword').ok).toBe(false);
    expect(validatePassword('tacos4life').ok).toBe(true);
  });
  it('normalizes invite codes as users type them', () => {
    expect(normalizeInviteCode('4bfam-1 ')).toBe('4BFAM1');
    expect(validateInviteCode('4bfam1').ok).toBe(true);
    expect(validateInviteCode('4BF').ok).toBe(false);
  });
  it('bounds group names', () => {
    expect(validateGroupName(' ').ok).toBe(false);
    expect(validateGroupName('Apartment 4B').ok).toBe(true);
    expect(validateGroupName('x'.repeat(33)).ok).toBe(false);
  });
});
