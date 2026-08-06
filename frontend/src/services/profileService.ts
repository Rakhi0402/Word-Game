import { delay } from './api';
import type { ApiResponse } from './api';
import type { UserStats } from '../types';

export const profileService = {
  getStats: async (): Promise<ApiResponse<UserStats>> => {
    await delay(200);
    return {
      success: true,
      data: {
        wordsFound: 0,
        cardsCollected: 1,
        achievementsEarned: 0,
        highestScore: 0,
        daysPlayed: 0,
        puzzlesCompleted: 0,
        pangramsFound: 0,
        perfectPuzzles: 0,
        hintsUsed: 0,
        hintsBought: 0,
      },
    };
  },

  /** Mock reset — actual Redux wipe is done by callers via resetProgression. */
  reset: async (): Promise<ApiResponse<{ reset: boolean }>> => {
    await delay(400);
    return { success: true, data: { reset: true }, message: 'Progression reset.' };
  },
};
