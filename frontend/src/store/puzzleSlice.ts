import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DailyPuzzle, FoundWord } from '../types';
import { DIFFICULTY_CONFIG, MAX_WORD_INPUT_LENGTH } from '../constants/rewards';
import { isPangramFromLetters } from '../utils/pangram';

interface PuzzleState {
  activePuzzleId: number | null;
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
  /** Unused answer-key list (kept empty). Use totalPangrams for UI. */
  pangrams: string[];
  pangramsFound: string[];
  /** Safe pangram total from API (count only). */
  totalPangrams: number;
  totalValidWords: number;
  lastRejectedWord: string | null;
  lastRejectedReason: 'duplicate' | 'invalid' | null;
  hintsUsedThisPuzzle: number;
  /** True = featured daily attempt (once/day); false = optional choice puzzle */
  isDailySession: boolean;
  /** Authoritative rewards from last completing submit (server). */
  pendingServerRewards: { xp: number; coins: number } | null;
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
  totalPangrams: 0,
  totalValidWords: 0,
  lastRejectedWord: null,
  lastRejectedReason: null,
  hintsUsedThisPuzzle: 0,
  isDailySession: true,
  pendingServerRewards: null,
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
      const answers = (puzzle.validWords || []).map((w) => w.toUpperCase());
      state.validWords = answers;
      const letterPool = puzzle.letters || [];
      const pangramList = (puzzle.pangrams || []).map((w) => w.toUpperCase());
      const found = (puzzle.foundWords || []).map((text) => {
        const upper = text.toUpperCase();
        return {
          text: upper,
          score: 0,
          isPangram:
            pangramList.includes(upper) || isPangramFromLetters(upper, letterPool),
        };
      });
      state.wordsFound = found;
      state.hintedWords = [];
      state.score = puzzle.score ?? 0;
      state.streak = puzzle.streak ?? 0;
      state.completed = Boolean(puzzle.completed);
      state.locked = Boolean(puzzle.completed);
      state.difficulty = puzzle.difficulty;
      state.xpReward = puzzle.xpReward;
      state.coinReward = puzzle.coinReward;
      const ruleTarget = DIFFICULTY_CONFIG[puzzle.difficulty].targetWords;
      const target = Math.min(
        Math.max(1, puzzle.targetWordCount ?? ruleTarget),
        ruleTarget
      );
      state.requiredWordsToComplete = target;
      state.totalValidWordsCount = answers.length > 0 ? answers.length : target;
      state.totalValidWords = state.totalValidWordsCount;
      state.pangrams = pangramList;
      state.totalPangrams = Math.max(
        0,
        puzzle.pangramCount ?? pangramList.length
      );
      state.pangramsFound = found.filter((w) => w.isPangram).map((w) => w.text);
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
      state.hintsUsedThisPuzzle = puzzle.hintsUsed ?? 0;
      state.pendingServerRewards = null;
    },
    selectLetter: (state, action: PayloadAction<string>) => {
      if (state.completed || state.locked) return;
      if (state.currentWord.length >= MAX_WORD_INPUT_LENGTH) return;
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
      action: PayloadAction<
        FoundWord & {
          scoreBonusPercent?: number;
          serverCompleted?: boolean;
          xpAwarded?: number;
          coinsAwarded?: number;
        }
      >
    ) => {
      const text = (action.payload.text || '').trim();
      if (text) {
        state.wordsFound.push({
          text,
          score: action.payload.score,
          isPangram: action.payload.isPangram,
        });
        state.streak += 1;
        // Points include local streak / pangram estimate; server sync reconciles.
        state.score += action.payload.score;
        if (action.payload.isPangram) {
          state.pangramsFound.push(text);
        }
      }
      state.currentWord = '';
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;
      if (action.payload.serverCompleted) {
        state.completed = true;
        const xp = action.payload.xpAwarded ?? 0;
        const coins = action.payload.coinsAwarded ?? 0;
        // Never clobber a real award with a later idempotent 0-sync.
        if (
          xp > 0 ||
          coins > 0 ||
          !state.pendingServerRewards ||
          (state.pendingServerRewards.xp === 0 && state.pendingServerRewards.coins === 0)
        ) {
          state.pendingServerRewards = { xp, coins };
        }
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
    revealHintWord: (state, action: PayloadAction<string>) => {
      const word = action.payload.toUpperCase();
      if (!state.hintedWords.includes(word)) {
        state.hintedWords.push(word);
      }
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
      state.validWords = (action.payload.puzzle.validWords || []).map((w) =>
        w.toUpperCase()
      );
      state.pangrams = (action.payload.puzzle.pangrams || []).map((w) => w.toUpperCase());
      state.wordsFound = action.payload.wordsFound;
      state.hintedWords = action.payload.hintedWords;
      state.score = action.payload.score;
      state.streak = action.payload.streak;
      state.completed = true;
      state.locked = true;
      state.difficulty = puzzle.difficulty;
      state.xpReward = puzzle.xpReward;
      state.coinReward = puzzle.coinReward;
      const target = Math.min(
        Math.max(1, puzzle.targetWordCount ?? DIFFICULTY_CONFIG[puzzle.difficulty].targetWords),
        DIFFICULTY_CONFIG[puzzle.difficulty].targetWords
      );
      state.totalValidWordsCount = target;
      state.requiredWordsToComplete = target;
      state.pangrams = [];
      state.totalPangrams = Math.max(0, puzzle.pangramCount ?? 0);
      state.pangramsFound = action.payload.pangramsFound;
      state.totalValidWords = target;
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
  revealHintWord,
  restoreCompletedPuzzle,
  resetPuzzleState,
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
