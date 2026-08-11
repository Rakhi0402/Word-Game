import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { dashboardService } from '../services/dashboardService';
import { achievementService, cardService, leaderboardService } from '../services/gameApi';
import type { DashboardResponse } from '../types/dashboard';
import { ApiClientError } from '../types/auth';
import { applyServerSnapshot } from './applyServerState';
import type { AppDispatch, RootState } from './index';

interface DashboardState {
  data: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
};

export const fetchDashboard = createAsyncThunk<
  DashboardResponse,
  void,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>('dashboard/fetch', async (_, { dispatch, rejectWithValue }) => {
  try {
    const [dashboard, inventory, achievements, leaderboard] = await Promise.all([
      dashboardService.getDashboard(),
      cardService.getInventory().catch(() => ({ cards: [], equippedCardId: null })),
      achievementService.getAchievements().catch(() => []),
      leaderboardService.getLeaderboard(0, 20).catch(() => null),
    ]);

    applyServerSnapshot(dispatch, {
      dashboard,
      inventory,
      achievements,
      leaderboard: leaderboard ?? undefined,
    });

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
