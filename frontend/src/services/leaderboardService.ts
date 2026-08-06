import { delay } from './api';
import type { ApiResponse } from './api';
import type { LeaderboardEntry } from '../types';

/** Mock service — pages should prefer Redux leaderboard slice. */
export const leaderboardService = {
  getLeaderboard: async (): Promise<ApiResponse<LeaderboardEntry[]>> => {
    await delay(200);
    return { success: true, data: [] };
  },
};
