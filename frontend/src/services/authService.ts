import { delay } from './api';
import type { ApiResponse } from './api';

interface AuthResponse { username: string; email: string; token: string }

export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    await delay();
    if (!email || !password)
      return { success: false, data: {} as AuthResponse, message: 'Please enter both email and password.' };
    try {
      const users: { username: string; email: string; password: string }[] =
        JSON.parse(localStorage.getItem('kungfu_registered_users') || '[]');
      const found = users.find(u => u.email === email && u.password === password);
      if (found) {
        return { success: true, data: { username: found.username, email: found.email, token: `mock-jwt-${found.username}` } };
      }
      // Auto-register on first use
      if (users.length === 0) {
        const auto = { username: email.split('@')[0], email, password };
        localStorage.setItem('kungfu_registered_users', JSON.stringify([auto]));
        return { success: true, data: { username: auto.username, email: auto.email, token: `mock-jwt-${auto.username}` } };
      }
      return { success: false, data: {} as AuthResponse, message: 'Invalid email or password.' };
    } catch (_) {
      return { success: false, data: {} as AuthResponse, message: 'An error occurred during login.' };
    }
  },

  register: async (username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    await delay();
    if (!username || !email || !password)
      return { success: false, data: {} as AuthResponse, message: 'All fields are required.' };
    try {
      const users: { username: string; email: string; password: string }[] =
        JSON.parse(localStorage.getItem('kungfu_registered_users') || '[]');
      if (users.some(u => u.email === email))
        return { success: false, data: {} as AuthResponse, message: 'Email already registered.' };
      users.push({ username, email, password });
      localStorage.setItem('kungfu_registered_users', JSON.stringify(users));
      return { success: true, data: { username, email, token: `mock-jwt-${username}` } };
    } catch (_) {
      return { success: false, data: {} as AuthResponse, message: 'Registration failed.' };
    }
  },
};
