import { delay } from './api';
import type { ApiResponse } from './api';
import { mockHashPassword } from '../utils/mockProgress';

interface AuthResponse { username: string; email: string; token: string }

interface StoredUser {
  username: string;
  email: string;
  passwordHash: string;
}

const USERS_KEY = 'kungfu_registered_users';

const readUsers = (): StoredUser[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as Array<StoredUser & { password?: string }>;
    // Migrate legacy plaintext passwords once
    return raw.map((u) => {
      if (u.passwordHash) return { username: u.username, email: u.email, passwordHash: u.passwordHash };
      if (u.password) {
        return { username: u.username, email: u.email, passwordHash: mockHashPassword(u.password) };
      }
      return { username: u.username, email: u.email, passwordHash: '' };
    });
  } catch {
    return [];
  }
};

const writeUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    await delay(300);
    if (!email || !password) {
      return { success: false, data: {} as AuthResponse, message: 'Please enter both email and password.' };
    }
    const users = readUsers();
    writeUsers(users); // persist any migration
    const hash = mockHashPassword(password);
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hash);
    if (found) {
      return {
        success: true,
        data: { username: found.username, email: found.email, token: `mock-jwt-${found.username}` },
      };
    }
    return { success: false, data: {} as AuthResponse, message: 'Invalid email or password.' };
  },

  register: async (username: string, email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    await delay(300);
    if (!username || !email || !password) {
      return { success: false, data: {} as AuthResponse, message: 'All fields are required.' };
    }
    const users = readUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, data: {} as AuthResponse, message: 'Email already registered.' };
    }
    users.push({ username, email, passwordHash: mockHashPassword(password) });
    writeUsers(users);
    return {
      success: true,
      data: { username, email, token: `mock-jwt-${username}` },
    };
  },
};
