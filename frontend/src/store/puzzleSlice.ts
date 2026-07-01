import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DailyPuzzle, FoundWord } from '../types';

interface PuzzleState {
  activePuzzleId: string | null;
  letters: string[]; // Shuffled display representation (first one is center, or we separate them)
  centerLetter: string;
  outerLetters: string[]; // Outer 6 letters
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
};

// Fisher-Yates shuffle helper
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
    loadPuzzle: (state, action: PayloadAction<DailyPuzzle>) => {
      const puzzle = action.payload;
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
      const targetMap = {
        Easy: 10,
        Medium: 15,
        Hard: 20,
        Expert: 25,
      } as const;
      state.requiredWordsToComplete = Math.min(
        puzzle.validWords.length,
        targetMap[puzzle.difficulty]
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
    },
    selectLetter: (state, action: PayloadAction<string>) => {
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
    submitWordSuccess: (state, action: PayloadAction<FoundWord>) => {
      state.wordsFound.push(action.payload);
      const pangramBonus = action.payload.isPangram ? 75 : 0;
      state.score += action.payload.score + pangramBonus;
      if (action.payload.isPangram) {
        state.pangramsFound.push(action.payload.text);
      }
      state.streak += 1;
      state.currentWord = '';
      state.lastRejectedWord = null;
      state.lastRejectedReason = null;

      if (state.wordsFound.length >= state.requiredWordsToComplete) {
        state.completed = true;
      }
    },
    revealHint: (state) => {
      const remainingHints = state.validWords.filter(
        (word) =>
          !state.wordsFound.some((found) => found.text === word) &&
          !state.hintedWords.includes(word)
      );
      if (remainingHints.length === 0) return;
      const nextHint = remainingHints[
        Math.floor(Math.random() * remainingHints.length)
      ];
      state.hintedWords.push(nextHint);
    },
    submitWordFailure: (state, action: PayloadAction<{ retainStreak: boolean; reason?: 'duplicate' | 'invalid' | null; word?: string | null }>) => {
      if (!action.payload.retainStreak) {
        state.streak = 0;
      }
      state.currentWord = '';
      state.lastRejectedReason = action.payload.reason ?? null;
      state.lastRejectedWord = action.payload.reason === 'duplicate' ? action.payload.word ?? null : null;
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
    resetPuzzleState: () => initialState
  }
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
  resetPuzzleState,
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
