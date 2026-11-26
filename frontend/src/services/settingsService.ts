import { apiRequest, readStoredAuth } from './apiClient';
import type { AuthUser } from '../types/auth';
import { invalidateAfterReset, invalidateOnLogout } from './cache/invalidateGameCache';

/**
 * Account / settings operations against the Spring Boot API.
 * UI preferences (dark mode, sound) remain client-local — see settingsSlice.
 */
export const settingsService = {
  getCurrentUser: () =>
    apiRequest<AuthUser>('/api/v1/users/me', { method: 'GET' }),

  /** Wipe belt/XP/cards/stats for the authenticated user (PostgreSQL). */
  resetProgression: async () => {
    const result = await apiRequest<AuthUser>('/api/v1/users/reset', { method: 'POST' });
    await invalidateAfterReset();
    return result;
  },

  logout: async () => {
    const userId = readStoredAuth()?.userId;
    try {
      await apiRequest<null>('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      await invalidateOnLogout(userId);
    }
  },
};
