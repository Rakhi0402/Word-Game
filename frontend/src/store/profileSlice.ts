import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { profileService } from '../services/profileService';
import { cardService } from '../services/gameApi';
import type { ProfileResponse } from '../types/profile';
import { ApiClientError } from '../types/auth';
import { applyProfileSnapshot } from './applyServerState';
import type { AppDispatch, RootState } from './index';

interface ProfileState {
  data: ProfileResponse | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
  lastFetchedAt: null,
};

export const fetchProfile = createAsyncThunk<
  ProfileResponse,
  void,
  { dispatch: AppDispatch; state: RootState; rejectValue: string }
>('profile/fetch', async (_, { dispatch, rejectWithValue }) => {
  try {
    const [profile, inventory] = await Promise.all([
      profileService.getProfile(),
      cardService.getInventory().catch(() => ({ cards: [], equippedCardId: null })),
    ]);
    applyProfileSnapshot(dispatch, { profile, inventory });
    return profile;
  } catch (err) {
    const message =
      err instanceof ApiClientError
        ? err.message
        : 'Failed to load profile from server.';
    return rejectWithValue(message);
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile(state) {
      state.data = null;
      state.error = null;
      state.lastFetchedAt = null;
      state.loading = false;
    },
    setProfileData(state, action: PayloadAction<ProfileResponse>) {
      state.data = action.payload;
      state.lastFetchedAt = new Date().toISOString();
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetchedAt = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load profile.';
      });
  },
});

export const { clearProfile, setProfileData } = profileSlice.actions;
export default profileSlice.reducer;
