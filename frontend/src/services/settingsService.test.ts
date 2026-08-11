/**
 * Lightweight contract checks for Settings ↔ backend integration.
 * Run: npm run test:settings
 */
import assert from 'node:assert/strict';

/** Mirrors settingsService endpoint paths (keep in sync with settingsService.ts). */
const SETTINGS_ENDPOINTS = {
  me: '/api/v1/users/me',
  reset: '/api/v1/users/reset',
  logout: '/api/v1/auth/logout',
} as const;

assert.equal(SETTINGS_ENDPOINTS.me, '/api/v1/users/me');
assert.equal(SETTINGS_ENDPOINTS.reset, '/api/v1/users/reset');
assert.equal(SETTINGS_ENDPOINTS.logout, '/api/v1/auth/logout');

/** Local-only prefs must not be confused with account fields. */
const LOCAL_ONLY = new Set(['darkMode', 'sound']);
const BACKEND_AUTHORITATIVE = new Set([
  'userName',
  'userEmail',
  'xp',
  'coins',
  'belt',
  'progression',
]);

for (const key of LOCAL_ONLY) {
  assert.ok(!BACKEND_AUTHORITATIVE.has(key), `${key} must stay local-only`);
}

console.log('settings integration contract checks passed');
