import { delay } from './api';
import type { ApiResponse } from './api';
import type { DailyPuzzle } from '../types';
import { DAILY_PUZZLES } from '../constants';

export const puzzleService = {
  getDailyPuzzle: async (): Promise<ApiResponse<DailyPuzzle>> => {
    await delay(400);
    const day = new Date().getDate();
    const puzzle = DAILY_PUZZLES[day % DAILY_PUZZLES.length];
    return { success: true, data: puzzle };
  },

  submitWord: async (
    puzzleId: string,
    word: string
  ): Promise<ApiResponse<{ valid: boolean; points: number }>> => {
    await delay(300);
    const puzzle = DAILY_PUZZLES.find(p => p.id === puzzleId);
    if (!puzzle) return { success: false, data: { valid: false, points: 0 }, message: 'Puzzle not found' };
    const clean = word.trim().toUpperCase();
    const valid = puzzle.validWords.includes(clean);
    return { success: true, data: { valid, points: valid ? clean.length * 10 : 0 } };
  },
};
