import { delay } from './api';
import type { ApiResponse } from './api';
import type { DailyPuzzle, PuzzleDifficulty } from '../types';
import { DAILY_PUZZLES } from '../constants';
import { DIFFICULTY_CONFIG, MIN_WORD_LENGTH, spellingBeeWordPoints } from '../constants/rewards';

const puzzlesByDifficulty = (difficulty: PuzzleDifficulty): DailyPuzzle[] =>
  DAILY_PUZZLES.filter((p) => p.difficulty === difficulty);

/** Stable day index for mock rotation (same UTC calendar day → same puzzle). */
const calendarDayIndex = (date = new Date()): number => {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor(utc / 86_400_000);
};

const withDifficultyRewards = (puzzle: DailyPuzzle): DailyPuzzle => {
  const cfg = DIFFICULTY_CONFIG[puzzle.difficulty];
  return {
    ...puzzle,
    xpReward: cfg.baseXp,
    coinReward: cfg.baseCoins,
  };
};

export const puzzleService = {
  /**
   * Featured daily puzzle for today.
   * Mock: rotates through `DAILY_PUZZLES` by calendar date (any difficulty).
   * Prod: replace with GET /puzzles/daily?date=… from DB scheduling.
   */
  getDailyPuzzle: async (): Promise<ApiResponse<DailyPuzzle>> => {
    await delay(250);
    if (DAILY_PUZZLES.length === 0) {
      return { success: false, data: {} as DailyPuzzle, message: 'No daily puzzles configured' };
    }
    const puzzle = DAILY_PUZZLES[calendarDayIndex() % DAILY_PUZZLES.length];
    return { success: true, data: withDifficultyRewards(puzzle) };
  },

  getPuzzleById: async (puzzleId: string): Promise<ApiResponse<DailyPuzzle>> => {
    await delay(100);
    const puzzle = DAILY_PUZZLES.find((p) => p.id === puzzleId);
    if (!puzzle) {
      return { success: false, data: {} as DailyPuzzle, message: 'Puzzle not found' };
    }
    return { success: true, data: withDifficultyRewards(puzzle) };
  },

  /** Optional extra puzzles — player picks difficulty after daily is done. */
  getPuzzleByDifficulty: async (
    difficulty: PuzzleDifficulty
  ): Promise<ApiResponse<DailyPuzzle>> => {
    await delay(250);
    const pool = puzzlesByDifficulty(difficulty);
    if (pool.length === 0) {
      return { success: false, data: {} as DailyPuzzle, message: 'No puzzle for difficulty' };
    }
    // Rotate extras within the difficulty pool so repeats feel less stale
    const puzzle = pool[calendarDayIndex() % pool.length];
    return { success: true, data: withDifficultyRewards(puzzle) };
  },

  submitWord: async (
    puzzleId: string,
    word: string
  ): Promise<
    ApiResponse<{
      valid: boolean;
      points: number;
      isPangram: boolean;
      reason?: 'too_short' | 'missing_center' | 'bad_letters' | 'not_in_dict' | 'duplicate' | null;
    }>
  > => {
    await delay(150);
    const puzzle = DAILY_PUZZLES.find((p) => p.id === puzzleId);
    if (!puzzle) {
      return {
        success: false,
        data: { valid: false, points: 0, isPangram: false },
        message: 'Puzzle not found',
      };
    }

    const clean = word.trim().toUpperCase();
    if (clean.length < MIN_WORD_LENGTH) {
      return {
        success: true,
        data: { valid: false, points: 0, isPangram: false, reason: 'too_short' },
      };
    }
    if (!clean.includes(puzzle.centerLetter.toUpperCase())) {
      return {
        success: true,
        data: { valid: false, points: 0, isPangram: false, reason: 'missing_center' },
      };
    }
    const letterSet = new Set(puzzle.letters.map((l) => l.toUpperCase()));
    if ([...clean].some((ch) => !letterSet.has(ch))) {
      return {
        success: true,
        data: { valid: false, points: 0, isPangram: false, reason: 'bad_letters' },
      };
    }

    const valid = puzzle.validWords.includes(clean);
    if (!valid) {
      return {
        success: true,
        data: { valid: false, points: 0, isPangram: false, reason: 'not_in_dict' },
      };
    }

    const isPangram =
      puzzle.pangrams?.includes(clean) ||
      puzzle.letters.every((letter) => clean.includes(letter.toUpperCase()));

    return {
      success: true,
      data: {
        valid: true,
        points: spellingBeeWordPoints(clean, Boolean(isPangram)),
        isPangram: Boolean(isPangram),
        reason: null,
      },
    };
  },
};
