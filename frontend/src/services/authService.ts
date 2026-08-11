import { apiRequest } from './apiClient';
import type { AuthResponseData, RegisterResponseData } from '../types/auth';

export const authService = {
  register: (userName: string, userEmail: string, password: string) =>
    apiRequest<RegisterResponseData>('/api/v1/auth/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        userName: userName.trim(),
        userEmail: userEmail.trim().toLowerCase(),
        password,
      }),
    }),

  login: (userEmail: string, password: string) =>
    apiRequest<AuthResponseData>('/api/v1/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        userEmail: userEmail.trim().toLowerCase(),
        password,
      }),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<AuthResponseData>('/api/v1/auth/refresh', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ refreshToken }),
    }),

  logout: () =>
    apiRequest<null>('/api/v1/auth/logout', {
      method: 'POST',
    }).catch(() => null),

  me: () => apiRequest<import('../types/auth').AuthUser>('/api/v1/users/me', { method: 'GET' }),
};
