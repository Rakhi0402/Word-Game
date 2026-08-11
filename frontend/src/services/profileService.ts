import { apiRequest } from './apiClient';
import type { ProfileResponse } from '../types/profile';
import type { AuthUser } from '../types/auth';

export const profileService = {
  getMe: () => apiRequest<AuthUser>('/api/v1/users/me', { method: 'GET' }),

  getProfile: () =>
    apiRequest<ProfileResponse>('/api/v1/users/me/profile', { method: 'GET' }),

  resetProgression: () =>
    apiRequest<AuthUser>('/api/v1/users/reset', { method: 'POST' }),
};
