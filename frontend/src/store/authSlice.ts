import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  email: string | null;
  username: string | null;
}

const initialState: AuthState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_auth');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return { isAuthenticated: false, token: null, email: null, username: null };
})();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ email: string; username: string; token: string }>) {
      state.isAuthenticated = true;
      state.email = action.payload.email;
      state.username = action.payload.username;
      state.token = action.payload.token;
      localStorage.setItem('kungfu_auth', JSON.stringify(state));
    },
    logout(state) {
      state.isAuthenticated = false;
      state.email = null;
      state.username = null;
      state.token = null;
      localStorage.removeItem('kungfu_auth');
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
