import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { dashboardService } from '../services/dashboardService';
import type { DashboardResponse } from '../types/dashboard';
import { ApiClientError } from '../types/auth';
import { applyServerSnapshot } from './applyServerState';
import type { AppDispatch, RootState } from './index';

interface DashboardState {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  fromCache: boolean;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
  fromCache: false,
};

/**
 * Single dashboard request (read-through IndexedDB/session cache).
 * Inventory / achievements / leaderboard load on their own pages to avoid fan-out.
 */
export const fetchDashboard = createAsyncThunk<
  DashboardResponse,
  { force?: boolean } | void,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>('dashboard/fetch', async (arg, { dispatch, rejectWithValue }) => {
  try {
    const force = Boolean(arg && typeof arg === 'object' && arg.force);
    const dashboard = await dashboardService.getDashboard({ force });
    applyServerSnapshot(dispatch, { dashboard });
    return dashboard;
  } catch (err) {
    const message =
      err instanceof ApiClientError
        ? err.message
        : 'Failed to load dashboard from server.';
    return rejectWithValue(message);
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard(state) {
      state.data = null;
      state.error = null;
      state.lastFetchedAt = null;
      state.loading = false;
      state.fromCache = false;
    },
    setDashboardData(state, action: PayloadAction<DashboardResponse>) {
      state.data = action.payload;
      state.lastFetchedAt = new Date().toISOString();
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetchedAt = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load dashboard.';
      });
  },
});

export const { clearDashboard, setDashboardData } = dashboardSlice.actions;
export default dashboardSlice.reducer;
