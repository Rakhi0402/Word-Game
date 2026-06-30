import { createSlice } from '@reduxjs/toolkit';
import type { Dispatch } from 'redux';
import type { Achievement, UserStats } from '../types';
import { DEFAULT_ACHIEVEMENTS } from '../constants';
import { addXp, addCoins, incrementAchievementsCount } from './userSlice';

interface AchievementsState {
  achievements: Achievement[];
}

const initialState: AchievementsState = (() => {
  try {
    const saved = localStorage.getItem('kungfu_achievements');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return { achievements: DEFAULT_ACHIEVEMENTS };
})();

import type { PayloadAction } from '@reduxjs/toolkit';

const achievementsSlice = createSlice({
  name: 'achievements',
  initialState,
  reducers: {
    setAchievements(state, action: PayloadAction<Achievement[]>) {
      state.achievements = action.payload;
      localStorage.setItem('kungfu_achievements', JSON.stringify(state));
    },
    resetAchievements(state) {
      state.achievements = DEFAULT_ACHIEVEMENTS;
      localStorage.setItem('kungfu_achievements', JSON.stringify(state));
    },
  },
});

export const evaluateAchievements = (payload: { stats: UserStats; xp: number }) => {
  return (dispatch: Dispatch, getState: () => { achievements: AchievementsState }) => {
    const { stats, xp } = payload;
    const state = getState();
    const currentAchievements = state.achievements.achievements;
    let changed = false;

    const updatedAchievements = currentAchievements.map((ach) => {
      if (ach.unlocked) return ach;

      let progress = ach.progress;
      if (ach.id === 'first_word') progress = stats.wordsFound;
      else if (ach.id === 'puzzle_master') progress = stats.puzzlesCompleted;
      else if (ach.id === 'collector') progress = stats.cardsCollected;
      else if (ach.id === 'streak_warrior') progress = Math.max(progress, Math.floor(stats.highestScore / 10));
      else if (ach.id === 'gold_belter') progress = xp;

      const unlocked = progress >= ach.target;
      if (unlocked || progress !== ach.progress) {
        changed = true;
        return { ...ach, progress: Math.min(progress, ach.target), unlocked };
      }
      return ach;
    });

    if (!changed) return;

    dispatch(achievementsSlice.actions.setAchievements(updatedAchievements));

    updatedAchievements.forEach((ach, index) => {
      const prev = currentAchievements[index];
      if (!prev.unlocked && ach.unlocked) {
        dispatch(addXp(ach.rewardXp));
        dispatch(addCoins(ach.rewardCoins));
        dispatch(incrementAchievementsCount());
      }
    });
  };
};

export const { resetAchievements } = achievementsSlice.actions;
export default achievementsSlice.reducer;
export type { AchievementsState };
