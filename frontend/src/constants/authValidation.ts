/**
 * Shared auth validation — keep patterns in sync with backend AuthPatterns.java
 */

export const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{2,29}$/;
export const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)\S{8,40}$/;

export const USERNAME_MESSAGE =
  'Username must be 3–30 characters, start with a letter, and use only letters, numbers, or underscore';
export const EMAIL_MESSAGE = 'Enter a valid email address';
export const PASSWORD_MESSAGE =
  'Password must be 8–40 characters with at least one uppercase letter, one lowercase letter, and one number';
export const CONFIRM_PASSWORD_MESSAGE = 'Secret phrases (passwords) do not match.';

export type FieldResult = { ok: true } | { ok: false; message: string };

export function validateUsername(raw: string): FieldResult {
  const value = raw.trim();
  if (!value) return { ok: false, message: 'Username is required' };
  if (value.length < 3 || value.length > 30) {
    return { ok: false, message: 'Username must be between 3 and 30 characters' };
  }
  if (!USERNAME_PATTERN.test(value)) return { ok: false, message: USERNAME_MESSAGE };
  return { ok: true };
}

export function validateEmail(raw: string): FieldResult {
  const value = raw.trim().toLowerCase();
  if (!value) return { ok: false, message: 'Email is required' };
  if (!EMAIL_PATTERN.test(value)) return { ok: false, message: EMAIL_MESSAGE };
  return { ok: true };
}

export function validatePassword(raw: string): FieldResult {
  if (!raw) return { ok: false, message: 'Password is required' };
  if (/\s/.test(raw)) return { ok: false, message: PASSWORD_MESSAGE };
  if (!PASSWORD_PATTERN.test(raw)) return { ok: false, message: PASSWORD_MESSAGE };
  return { ok: true };
}

export function validateConfirmPassword(password: string, confirm: string): FieldResult {
  if (!confirm) return { ok: false, message: 'Please confirm your password' };
  if (password !== confirm) return { ok: false, message: CONFIRM_PASSWORD_MESSAGE };
  return { ok: true };
}

export function validateLoginForm(email: string, password: string) {
  const userEmail = validateEmail(email);
  const pwd = password ? ({ ok: true } as FieldResult) : ({ ok: false, message: 'Password is required' } as FieldResult);
  return {
    ok: userEmail.ok && pwd.ok,
    fieldErrors: {
      userEmail: userEmail.ok ? undefined : userEmail.message,
      password: pwd.ok ? undefined : pwd.message,
    },
  };
}

export function validateRegisterForm(
  username: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  const userName = validateUsername(username);
  const userEmail = validateEmail(email);
  const pwd = validatePassword(password);
  const confirm = validateConfirmPassword(password, confirmPassword);
  return {
    ok: userName.ok && userEmail.ok && pwd.ok && confirm.ok,
    fieldErrors: {
      userName: userName.ok ? undefined : userName.message,
      userEmail: userEmail.ok ? undefined : userEmail.message,
      password: pwd.ok ? undefined : pwd.message,
      confirmPassword: confirm.ok ? undefined : confirm.message,
    },
  };
}
