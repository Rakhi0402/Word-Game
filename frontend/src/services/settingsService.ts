import { apiRequest } from './apiClient';
import type { AuthUser } from '../types/auth';

/**
 * Account / settings operations against the Spring Boot API.
 * UI preferences (dark mode, sound) remain client-local — see settingsSlice.
 */
export const settingsService = {
  getCurrentUser: () =>
    apiRequest<AuthUser>('/api/v1/users/me', { method: 'GET' }),

  /** Wipe belt/XP/cards/stats for the authenticated user (PostgreSQL). */
  resetProgression: () =>
    apiRequest<AuthUser>('/api/v1/users/reset', { method: 'POST' }),

  logout: () =>
    apiRequest<null>('/api/v1/auth/logout', { method: 'POST' }),
};
