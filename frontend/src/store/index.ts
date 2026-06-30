import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import authReducer from './authSlice';
import userReducer from './userSlice';
import puzzleReducer from './puzzleSlice';
import cardsReducer from './cardsSlice';
import leaderboardReducer from './leaderboardSlice';
import achievementsReducer from './achievementsSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    puzzle: puzzleReducer,
    cards: cardsReducer,
    leaderboard: leaderboardReducer,
    achievements: achievementsReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
