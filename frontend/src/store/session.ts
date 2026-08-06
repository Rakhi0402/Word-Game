import type { AppDispatch, RootState } from './index';
import { logout } from './authSlice';
import { replaceUser, setUserProfile, resetUser, setCharacterMultiplier } from './userSlice';
import {
  replaceCards,
  resetCards,
  getHintCapacity,
  getCharacterMultiplier,
  type CardsState,
} from './cardsSlice';
import { resetAchievements, setAchievements } from './achievementsSlice';
import { resetLeaderboard, updateUserScore } from './leaderboardSlice';
import { resetPuzzleState } from './puzzleSlice';
import { resetSettings } from './settingsSlice';
import {
  clearDailyCompletion,
  clearProgress,
  defaultProgress,
  loadProgress,
  saveProgressFromState,
  todayKey,
} from '../utils/mockProgress';

const applyProgress = (dispatch: AppDispatch, progress: ReturnType<typeof loadProgress>) => {
  const equipped = progress.equippedCardId;
  const multiplier = getCharacterMultiplier(equipped);
  dispatch(replaceUser({ ...progress.user, characterMultiplier: multiplier }));
  const cardsPayload: CardsState = {
    unlockedCardIds: progress.unlockedCardIds,
    inventory: progress.inventory,
    equippedCardId: equipped,
    availableHints: progress.availableHints || getHintCapacity(equipped),
    usedHints: progress.usedHints || 0,
    paidHintsUsedThisPuzzle: 0,
    rarityFilter: 'all',
    equippedCardExpiresAt: null,
    hintsDayKey: todayKey(),
  };
  dispatch(replaceCards(cardsPayload));
  dispatch(setCharacterMultiplier(multiplier));
  dispatch(setAchievements(progress.achievements));
  dispatch(resetLeaderboard(undefined));
  if (progress.user.username && progress.leaderboardScore > 0) {
    dispatch(
      updateUserScore({
        username: progress.user.username,
        score: progress.leaderboardScore,
        belt: progress.user.belt,
      })
    );
  }
};

export const clearSession = async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  const email = state.auth.email || state.user.email;
  if (email) saveProgressFromState(email, state);
  dispatch(logout(undefined));
  dispatch(resetPuzzleState(undefined));
};

export const hydrateSession = async (
  dispatch: AppDispatch,
  identity: { email: string; username: string }
) => {
  const progress = loadProgress(identity.email, identity.username);
  applyProgress(dispatch, progress);
  dispatch(setUserProfile({ username: identity.username, email: identity.email }));
};

export const resetProgression = async (dispatch: AppDispatch, getState: () => RootState) => {
  const state = getState();
  const email = state.auth.email || state.user.email;
  const username = state.auth.username || state.user.username || 'Young Panda';
  if (email) {
    clearProgress(email);
    clearDailyCompletion(email);
  }
  const fresh = defaultProgress(username, email || '');
  applyProgress(dispatch, fresh);
  dispatch(resetPuzzleState(undefined));
  dispatch(resetSettings(undefined));
};

export const factoryResetLocal = (dispatch: AppDispatch) => {
  dispatch(resetUser(undefined));
  dispatch(resetCards(undefined));
  dispatch(resetAchievements(undefined));
  dispatch(resetLeaderboard(undefined));
  dispatch(resetPuzzleState(undefined));
};
