import { delay } from './api';
import type { ApiResponse } from './api';
import type { UserStats } from '../types';

export const profileService = {
  getStats: async (): Promise<ApiResponse<UserStats>> => {
    await delay(300);
    return {
      success: true,
      data: { wordsFound: 0, cardsCollected: 1, achievementsEarned: 0, highestScore: 0, daysPlayed: 0, puzzlesCompleted: 0 },
    };
  },
};
