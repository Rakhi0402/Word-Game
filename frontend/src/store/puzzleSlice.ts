import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DailyPuzzle, FoundWord } from '../types';
import { DIFFICULTY_CONFIG, wordStreakExtra, MAX_WORD_INPUT_LENGTH } from '../constants/rewards';

interface PuzzleState {
  activePuzzleId: string | null;
  letters: string[];
  centerLetter: string;
  outerLetters: string[];
  currentWord: string;
  validWords: string[];
  wordsFound: FoundWord[];
  hintedWords: string[];
  score: number;
  streak: number;
  completed: boolean;
  locked: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  xpReward: number;
  coinReward: number;
  totalValidWordsCount: number;
  requiredWordsToComplete: number;
  pangrams: string[];
  pangramsFound: string[];
  totalValidWords: number;
  lastRejectedWord: string | null;
  lastRejectedReason: 'duplicate' | 'invalid' | null;
  hintsUsedThisPuzzle: number;
  /** True = featured daily attempt (once/day); false = optional choice puzzle */
  isDailySession: boolean;
}

const initialState: PuzzleState = {
  activePuzzleId: null,
  letters: [],
  centerLetter: '',
  outerLetters: [],
  currentWord: '',
  validWords: [],
  wordsFound: [],
  hintedWords: [],
  score: 0,
  streak: 0,
  completed: false,
  locked: false,
  difficulty: 'Easy',
  xpReward: 0,
  coinReward: 0,
  totalValidWordsCount: 0,
  requiredWordsToComplete: 0,
  pangrams: [],
  pangramsFound: [],
  totalValidWords: 0,
  lastRejectedWord: null,
  lastRejectedReason: null,
  hintsUsedThisPuzzle: 0,
  isDailySession: true,
};

const shuffleArray = (array: string[]) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const puzzleSlice = createSlice({
  name: 'puzzle',
  initialState,
  reducers: {
    loadPuzzle: (
      state,
      action: PayloadAction<{ puzzle: DailyPuzzle; isDailySession?: boolean }>
    ) => {
      const puzzle = action.payload.puzzle;
      state.isDailySession = action.payload.isDailySession ?? false;
      state.activePuzzleId = puzzle.id;
      state.centerLetter = puzzle.centerLetter;
      const outer = puzzle.letters.filter((l) => l !== puzzle.centerLetter);
      state.outerLetters = shuffleArray(outer);
      state.letters = [puzzle.centerLetter, ...state.outerLetters];
      state.currentWord = '';
      state.validWords = puzzle.validWords;
      state.wordsFound = [];
      state.hintedWords = [];
      state.score = 0;
      state.streak = 0;
      state.completed = false;
      state.locked = false;
      state.difficulty = puzzle.difficulty;
      state.xpReward = puzzle.xpReward;
      state.coinReward = puzzle.coinReward;
      state.totalValidWordsCount = puzzle.validWords.length;
      const target = DIFFICULTY_CONFIG[puzzle.difficulty].targetWords;
      state.requiredWordsToComplete = Math.max(
        1,
        Math.min(Math.max(puzzle.validWords.length, 1), target)
      );
      const derivedPangrams = puzzle.pangrams?.length
        ? puzzle.pangrams
        : puzzle.validWords.filter((word) =>
            puzzle.letters.every((letter) => word.includes(letter))
          );
      state.pangrams = derivedPangrams;
      state.pangramsFound = [];
      state.totalValidWords = puzzle.validWords.length;
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
      state.hintsUsedThisPuzzle = 0;
    },
    selectLetter: (state, action: PayloadAction<string>) => {
      if (state.completed || state.locked) return;
      if (state.currentWord.length >= MAX_WORD_INPUT_LENGTH) {
        // #region agent log
        if (typeof fetch !== 'undefined') {
          fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Session-Id': '156feb',
            },
            body: JSON.stringify({
              sessionId: '156feb',
              runId: 'ui-fix',
              hypothesisId: 'H1',
              location: 'puzzleSlice.ts:selectLetter',
              message: 'blocked letter — at max input length',
              data: { len: state.currentWord.length, max: MAX_WORD_INPUT_LENGTH, letter: action.payload },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
        }
        // #endregion
        return;
      }
      state.currentWord += action.payload;
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
    },
    deleteLetter: (state) => {
      state.currentWord = state.currentWord.slice(0, -1);
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
    },
    clearWord: (state) => {
      state.currentWord = '';
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
    },
    shuffleLetters: (state) => {
      state.outerLetters = shuffleArray(state.outerLetters);
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
    },
    submitWordSuccess: (
      state,
      action: PayloadAction<FoundWord & { scoreBonusPercent?: number }>
    ) => {
      state.wordsFound.push({
        text: action.payload.text,
        score: action.payload.score,
        isPangram: action.payload.isPangram,
      });
      state.streak += 1;
      const streakExtra = wordStreakExtra(state.streak);
      const scoreBonus = action.payload.scoreBonusPercent ?? 0;
      const raw = action.payload.score + streakExtra;
      state.score += Math.round(raw * (1 + scoreBonus));
      if (action.payload.isPangram) {
        state.pangramsFound.push(action.payload.text);
      }
      state.currentWord = '';
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
      if (state.wordsFound.length >= state.requiredWordsToComplete) {
        state.completed = true;
      }
    },
    revealHint: (state) => {
      const remaining = state.validWords.filter(
        (word) =>
          !state.wordsFound.some((found) => found.text === word) &&
          !state.hintedWords.includes(word)
      );
      if (remaining.length === 0) return;
      const nextHint = remaining[Math.floor(Math.random() * remaining.length)];
      state.hintedWords.push(nextHint);
      state.hintsUsedThisPuzzle += 1;
    },
    submitWordFailure: (
      state,
      action: PayloadAction<{
        retainStreak: boolean;
        reason?: 'duplicate' | 'invalid' | null;
        word?: string | null;
      }>
    ) => {
      if (!action.payload.retainStreak) state.streak = 0;
      state.currentWord = '';
      state.lastRejectedReason = action.payload.reason ?? null;
      state.lastRejectedWord =
        action.payload.reason === 'duplicate' ? action.payload.word ?? null : null;
    },
    forceCompletePuzzle: (state) => {
      state.completed = true;
    },
    completePuzzle: (state) => {
      state.completed = true;
    },
    lockPuzzle: (state) => {
      state.locked = true;
    },
    restoreCompletedPuzzle: (
      state,
      action: PayloadAction<{
        puzzle: DailyPuzzle;
        wordsFound: FoundWord[];
        score: number;
        pangramsFound: string[];
        hintedWords: string[];
        streak: number;
        hintsUsedThisPuzzle?: number;
        isDailySession?: boolean;
      }>
    ) => {
      const puzzle = action.payload.puzzle;
      state.isDailySession = action.payload.isDailySession ?? true;
      state.activePuzzleId = puzzle.id;
      state.centerLetter = puzzle.centerLetter;
      const outer = puzzle.letters.filter((l) => l !== puzzle.centerLetter);
      state.outerLetters = outer;
      state.letters = [puzzle.centerLetter, ...outer];
      state.currentWord = '';
      state.validWords = puzzle.validWords;
      state.wordsFound = action.payload.wordsFound;
      state.hintedWords = action.payload.hintedWords;
      state.score = action.payload.score;
      state.streak = action.payload.streak;
      state.completed = true;
      state.locked = true;
      state.difficulty = puzzle.difficulty;
      state.xpReward = puzzle.xpReward;
      state.coinReward = puzzle.coinReward;
      state.totalValidWordsCount = puzzle.validWords.length;
      const target = DIFFICULTY_CONFIG[puzzle.difficulty].targetWords;
      state.requiredWordsToComplete = Math.max(
        1,
        Math.min(Math.max(puzzle.validWords.length, 1), target)
      );
      const derivedPangrams = puzzle.pangrams?.length
        ? puzzle.pangrams
        : puzzle.validWords.filter((word) =>
            puzzle.letters.every((letter) => word.includes(letter))
          );
      state.pangrams = derivedPangrams;
      state.pangramsFound = action.payload.pangramsFound;
      state.totalValidWords = puzzle.validWords.length;
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
      state.hintsUsedThisPuzzle = action.payload.hintsUsedThisPuzzle ?? 0;
    },
    resetPuzzleState: () => initialState,
  },
});

export const {
  loadPuzzle,
  selectLetter,
  deleteLetter,
  clearWord,
  shuffleLetters,
  submitWordSuccess,
  submitWordFailure,
  forceCompletePuzzle,
  completePuzzle,
  lockPuzzle,
  revealHint,
  restoreCompletedPuzzle,
  resetPuzzleState,
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
