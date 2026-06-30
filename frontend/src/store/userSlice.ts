import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, BeltColor } from '../types';
import { BELT_LEVELS } from '../constants';

const defaultUser: User = {
  username: 'Young Panda',
  email: '',
  belt: 'White',
  xp: 0,
  xpNeeded: 100,
  coins: 50,
  streak: 1,
  rank: 'Novice Disciple',
  stats: { wordsFound: 0, cardsCollected: 1, achievementsEarned: 0, highestScore: 0, daysPlayed: 0, puzzlesCompleted: 0 },
};

const initialState: User = (() => {
  try {
    const saved = localStorage.getItem('kungfu_user');
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return defaultUser;
})();

const evaluateBelt = (xp: number): { belt: BeltColor; rank: string; xpNeeded: number } => {
  let activeBelt = BELT_LEVELS[0];
  for (let i = 0; i < BELT_LEVELS.length; i++) {
    if (xp >= BELT_LEVELS[i].minXp) activeBelt = BELT_LEVELS[i];
    else break;
  }
  const idx = BELT_LEVELS.indexOf(activeBelt);
  const nextBelt = BELT_LEVELS[idx + 1] || activeBelt;
  return { belt: activeBelt.belt, rank: activeBelt.title, xpNeeded: nextBelt.minXp };
};

const persist = (state: User) => localStorage.setItem('kungfu_user', JSON.stringify(state));

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserProfile(state, action: PayloadAction<{ username: string; email: string }>) {
      state.username = action.payload.username;
      state.email = action.payload.email;
      persist(state);
    },
    addXp(state, action: PayloadAction<number>) {
      state.xp += action.payload;
      const info = evaluateBelt(state.xp);
      state.belt = info.belt;
      state.rank = info.rank;
      state.xpNeeded = info.xpNeeded;
      persist(state);
    },
    addCoins(state, action: PayloadAction<number>) {
      state.coins += action.payload;
      persist(state);
    },
    deductCoins(state, action: PayloadAction<number>) {
      state.coins = Math.max(0, state.coins - action.payload);
      persist(state);
    },
    incrementWordsFound(state) {
      state.stats.wordsFound += 1;
      persist(state);
    },
    updateHighestScore(state, action: PayloadAction<number>) {
      if (action.payload > state.stats.highestScore) state.stats.highestScore = action.payload;
      persist(state);
    },
    incrementCardsCount(state) {
      state.stats.cardsCollected += 1;
      persist(state);
    },
    incrementAchievementsCount(state) {
      state.stats.achievementsEarned += 1;
      persist(state);
    },
    incrementPuzzlesCompleted(state) {
      state.stats.puzzlesCompleted += 1;
      state.stats.daysPlayed += 1;
      persist(state);
    },
    incrementStreak(state) {
      state.streak += 1;
      persist(state);
    },
    resetUser: () => {
      localStorage.removeItem('kungfu_user');
      return defaultUser;
    },
  },
});

export const {
  setUserProfile, addXp, addCoins, deductCoins,
  incrementWordsFound, updateHighestScore, incrementCardsCount,
  incrementAchievementsCount, incrementPuzzlesCompleted, incrementStreak, resetUser,
} = userSlice.actions;

export { evaluateBelt };
export default userSlice.reducer;
