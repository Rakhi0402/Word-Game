import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LeaderboardEntry, BeltColor } from '../types';
import { leaderboardService } from '../services/gameApi';
import { ApiClientError } from '../types/auth';
import { mapLeaderboardPage } from './applyServerState';
import type { AppDispatch, RootState } from './index';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserRank: number;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: LeaderboardState = {
  entries: [],
  currentUserRank: 0,
  page: 0,
  size: 20,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  loading: false,
  error: null,
};

export const fetchLeaderboard = createAsyncThunk<
  {
    entries: LeaderboardEntry[];
    currentUserRank: number;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  },
  { page?: number; size?: number } | undefined,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>('leaderboard/fetch', async (args, { rejectWithValue }) => {
  try {
    const page = args?.page ?? 0;
    const size = args?.size ?? 20;
    const data = await leaderboardService.getLeaderboard(page, size);
    const mapped = mapLeaderboardPage(data);
    return {
      ...mapped,
      page: data.page,
      size: data.size,
      totalElements: data.totalElements,
      totalPages: data.totalPages,
      hasNext: data.hasNext,
    };
  } catch (err) {
    const message =
      err instanceof ApiClientError
        ? err.message
        : 'Failed to load leaderboard from server.';
    return rejectWithValue(message);
  }
});

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setLeaderboard(
      state,
      action: PayloadAction<{ entries: LeaderboardEntry[]; currentUserRank?: number }>
    ) {
      state.entries = action.payload.entries;
      state.currentUserRank =
        action.payload.currentUserRank ??
        0;
      state.loading = false;
      state.error = null;
    },
    updateUserScore(
      state,
      action: PayloadAction<{ username: string; score: number; belt: BeltColor }>
    ) {
      // Optimistic cache only — authoritative ranking comes from GET /leaderboard
      const { username, score, belt } = action.payload;
      let entries = state.entries.filter((e) => e.username !== username);
      entries.push({ rank: 0, username, score, belt, avatar: 'User' });
      entries.sort((a, b) => b.score - a.score);
      state.entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));
      const idx = state.entries.findIndex((e) => e.username === username);
      state.currentUserRank = idx !== -1 ? idx + 1 : state.entries.length + 1;
    },
    resetLeaderboard(state) {
      state.entries = [];
      state.currentUserRank = 0;
      state.page = 0;
      state.totalElements = 0;
      state.totalPages = 0;
      state.hasNext = false;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.currentUserRank = action.payload.currentUserRank;
        state.page = action.payload.page;
        state.size = action.payload.size;
        state.totalElements = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.hasNext = action.payload.hasNext;
        state.error = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load leaderboard.';
      });
  },
});

export const { updateUserScore, resetLeaderboard, setLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
