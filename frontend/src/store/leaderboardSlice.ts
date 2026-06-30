import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LeaderboardEntry, BeltColor } from '../types';

interface LeaderboardState {
  entries: LeaderboardEntry[];
  currentUserRank: number;
}

const mockEntries: LeaderboardEntry[] = [
  { rank: 1, username: 'Grand Master Oogway', score: 3200, belt: 'Black', avatar: 'Oogway' },
  { rank: 2, username: 'Master Shifu',         score: 2400, belt: 'Black', avatar: 'Shifu' },
  { rank: 3, username: 'Master Tigress',        score: 1950, belt: 'Brown', avatar: 'Tigress' },
  { rank: 4, username: 'Master Viper',          score: 1250, belt: 'Blue',  avatar: 'Viper' },
  { rank: 5, username: 'Master Monkey',         score: 950,  belt: 'Green', avatar: 'Monkey' },
];

const initialState: LeaderboardState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_leaderboard');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return { entries: mockEntries, currentUserRank: 6 };
})();

const persist = (state: LeaderboardState) =>
  localStorage.setItem('kungfu_leaderboard', JSON.stringify(state));

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    updateUserScore(state, action: PayloadAction<{ username: string; score: number; belt: BeltColor }>) {
      const { username, score, belt } = action.payload;
      let entries = state.entries.filter(e => e.username !== username);
      entries.push({ rank: 0, username, score, belt, avatar: 'User' });
      entries.sort((a, b) => b.score - a.score);
      state.entries = entries.map((e, i) => ({ ...e, rank: i + 1 }));
      const idx = state.entries.findIndex(e => e.username === username);
      state.currentUserRank = idx !== -1 ? idx + 1 : state.entries.length + 1;
      persist(state);
    },
    resetLeaderboard(state) {
      state.entries = mockEntries;
      state.currentUserRank = 6;
      persist(state);
    },
  },
});

export const { updateUserScore, resetLeaderboard } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;
