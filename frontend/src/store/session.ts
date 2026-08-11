import type { AppDispatch, RootState } from './index';
import { logout } from './authSlice';
import { resetUser } from './userSlice';
import { resetCards } from './cardsSlice';
import { resetAchievements } from './achievementsSlice';
import { resetLeaderboard } from './leaderboardSlice';
import { resetPuzzleState } from './puzzleSlice';
import { clearDashboard, fetchDashboard } from './dashboardSlice';
import { clearProfile, fetchProfile } from './profileSlice';
import { settingsService } from '../services/settingsService';

/** Clear obsolete local game-state keys so they cannot override the server. */
export const clearLegacyGameStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (
        key === 'kungfu_user' ||
        key === 'kungfu_cards' ||
        key === 'kungfu_achievements' ||
        key === 'kungfu_leaderboard' ||
        key.startsWith('kungfu_progress_') ||
        key.startsWith('kungfu_daily_done_') ||
        key.startsWith('kungfu_puzzle_cleared_')
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    /* ignore */
  }
};

/**
 * Load authoritative game state from the backend into Redux caches.
 */
export const hydrateSession = async (dispatch: AppDispatch, _identity?: { email: string; username: string }) => {
  clearLegacyGameStorage();
  await dispatch(fetchDashboard());
};

export const clearSession = async (dispatch: AppDispatch, _getState?: () => RootState) => {
  dispatch(logout(undefined));
  dispatch(resetPuzzleState(undefined));
  dispatch(clearDashboard());
  dispatch(clearProfile());
  dispatch(resetUser(undefined));
  dispatch(resetCards(undefined));
  dispatch(resetAchievements(undefined));
  dispatch(resetLeaderboard(undefined));
  clearLegacyGameStorage();
};

export const resetProgression = async (dispatch: AppDispatch) => {
  await settingsService.resetProgression();
  await Promise.all([dispatch(fetchDashboard()), dispatch(fetchProfile())]);
  dispatch(resetPuzzleState(undefined));
};

export const factoryResetLocal = (dispatch: AppDispatch) => {
  dispatch(resetUser(undefined));
  dispatch(resetCards(undefined));
  dispatch(resetAchievements(undefined));
  dispatch(resetLeaderboard(undefined));
  dispatch(resetPuzzleState(undefined));
  dispatch(clearDashboard());
  dispatch(clearProfile());
  clearLegacyGameStorage();
};
