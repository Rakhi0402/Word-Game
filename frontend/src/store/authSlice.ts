import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import { AUTH_STORAGE_KEY, configureApiClient } from '../services/apiClient';
import type { AuthUser } from '../types/auth';
import { ApiClientError } from '../types/auth';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  /** Legacy fields used by existing game screens */
  email: string | null;
  username: string | null;
  token: string | null;
}

const loadInitial = (): AuthState => {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<AuthState>;
      if (parsed.accessToken && parsed.isAuthenticated) {
        return {
          user: parsed.user ?? null,
          accessToken: parsed.accessToken,
          refreshToken: parsed.refreshToken ?? null,
          isAuthenticated: true,
          loading: false,
          error: null,
          email: parsed.email ?? parsed.user?.userEmail ?? null,
          username: parsed.username ?? parsed.user?.userName ?? null,
          token: parsed.accessToken,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    email: null,
    username: null,
    token: null,
  };
};

const persist = (state: AuthState) => {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
      email: state.email,
      username: state.username,
      token: state.accessToken,
    })
  );
};

const applySession = (
  state: AuthState,
  payload: {
    user: AuthUser;
    accessToken: string;
    refreshToken?: string | null;
  }
) => {
  state.user = payload.user;
  state.accessToken = payload.accessToken;
  state.refreshToken = payload.refreshToken ?? state.refreshToken;
  state.isAuthenticated = true;
  state.email = payload.user.userEmail;
  state.username = payload.user.userName;
  state.token = payload.accessToken;
  state.error = null;
  state.loading = false;
  persist(state);
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (
    input: { userName: string; userEmail: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      return await authService.register(input.userName, input.userEmail, input.password);
    } catch (err) {
      if (err instanceof ApiClientError) {
        const friendly =
          err.status === 409
            ? err.message || 'That username or email is already registered.'
            : err.status === 400
              ? err.message || 'Please check your details and try again.'
              : err.message || 'Registration failed. Try again.';
        return rejectWithValue({
          message: friendly,
          fieldErrors: err.fieldErrors,
          status: err.status,
        });
      }
      return rejectWithValue({ message: 'Registration failed. Check your connection and try again.' });
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (input: { userEmail: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.login(input.userEmail, input.password);
    } catch (err) {
      if (err instanceof ApiClientError) {
        return rejectWithValue({
          message: err.message,
          fieldErrors: err.fieldErrors,
          status: err.status,
        });
      }
      return rejectWithValue({ message: 'Login failed. Try again.' });
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.me();
    } catch (err) {
      if (err instanceof ApiClientError) {
        return rejectWithValue({ message: err.message, status: err.status });
      }
      return rejectWithValue({ message: 'Failed to load profile' });
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    loginSuccess(
      state,
      action: PayloadAction<{
        email: string;
        username: string;
        token: string;
        refreshToken?: string | null;
        user?: AuthUser;
      }>
    ) {
      const user =
        action.payload.user ??
        ({
          userId: '',
          userName: action.payload.username,
          userEmail: action.payload.email,
        } satisfies AuthUser);
      applySession(state, {
        user,
        accessToken: action.payload.token,
        refreshToken: action.payload.refreshToken ?? null,
      });
    },
    setTokens(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string | null }>
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.token = action.payload.accessToken;
      persist(state);
    },
    clearAuthError(state) {
      state.error = null;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.email = null;
      state.username = null;
      state.token = null;
      state.error = null;
      state.loading = false;
      localStorage.removeItem(AUTH_STORAGE_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message?: string } | undefined;
        state.error = payload?.message || 'Registration failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        applySession(state, {
          user: action.payload.user,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload as { message?: string } | undefined;
        state.error = payload?.message || 'Login failed';
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.email = action.payload.userEmail;
        state.username = action.payload.userName;
        persist(state);
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        const payload = action.payload as { status?: number } | undefined;
        if (payload?.status === 401) {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.email = null;
          state.username = null;
          state.token = null;
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.email = null;
        state.username = null;
        state.token = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.email = null;
        state.username = null;
        state.token = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
      });
  },
});

export const { loginSuccess, logout, setTokens, clearAuthError } = authSlice.actions;
export default authSlice.reducer;

/** Wire apiClient callbacks once the store exists (called from store/index). */
export function bindAuthApiClient(store: {
  dispatch: (a: unknown) => unknown;
  getState: () => { auth: AuthState };
}) {
  configureApiClient({
    onTokensUpdated: (tokens) => {
      store.dispatch(setTokens(tokens));
    },
    onUnauthorized: () => {
      store.dispatch(logout());
    },
  });
}
