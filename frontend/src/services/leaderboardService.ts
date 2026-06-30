import { delay } from './api';
import type { ApiResponse } from './api';
import type { LeaderboardEntry } from '../types';

export const leaderboardService = {
  getLeaderboard: async (): Promise<ApiResponse<LeaderboardEntry[]>> => {
    await delay(300);
    return { success: true, data: [] };
  },
};
