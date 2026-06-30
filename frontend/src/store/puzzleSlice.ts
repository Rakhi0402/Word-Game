import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DailyPuzzle } from '../types';

interface PuzzleState {
  activePuzzleId: string | null;
  letters: string[]; // Shuffled display representation (first one is center, or we separate them)
  centerLetter: string;
  outerLetters: string[]; // Outer 6 letters
  currentWord: string;
  wordsFound: string[];
  score: number;
  streak: number;
  completed: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  xpReward: number;
  coinReward: number;
  totalValidWordsCount: number;
}

const initialState: PuzzleState = {
  activePuzzleId: null,
  letters: [],
  centerLetter: '',
  outerLetters: [],
  currentWord: '',
  wordsFound: [],
  score: 0,
  streak: 0,
  completed: false,
  difficulty: 'Easy',
  xpReward: 0,
  coinReward: 0,
  totalValidWordsCount: 0,
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
      // Extract outer letters (filter out center letter)
      const outer = puzzle.letters.filter(l => l !== puzzle.centerLetter);
      state.outerLetters = shuffleArray(outer);
      state.letters = [puzzle.centerLetter, ...state.outerLetters];
      state.currentWord = '';
      state.wordsFound = [];
      state.score = 0;
      state.streak = 0;
      state.completed = false;
      state.difficulty = puzzle.difficulty;
      state.xpReward = puzzle.xpReward;
      state.coinReward = puzzle.coinReward;
      state.totalValidWordsCount = puzzle.validWords.length;
    },
    selectLetter: (state, action: PayloadAction<string>) => {
      // Allow selected letters to build up
      state.currentWord += action.payload;
    },
    deleteLetter: (state) => {
      state.currentWord = state.currentWord.slice(0, -1);
    },
    clearWord: (state) => {
      state.currentWord = '';
    },
    shuffleLetters: (state) => {
      state.outerLetters = shuffleArray(state.outerLetters);
    },
    submitWordSuccess: (state, action: PayloadAction<{ word: string; points: number }>) => {
      state.wordsFound.push(action.payload.word);
      state.score += action.payload.points;
      state.streak += 1;
      state.currentWord = '';

      // Auto complete when 70% of words found or when all words found
      // (Let's make it 100% or at least 1 word for testing, let's say when wordsFound matches totalValidWordsCount)
      if (state.wordsFound.length >= state.totalValidWordsCount) {
        state.completed = true;
      }
    },
    submitWordFailure: (state, action: PayloadAction<{ retainStreak: boolean }>) => {
      if (!action.payload.retainStreak) {
        state.streak = 0;
      }
      state.currentWord = '';
    },
    forceCompletePuzzle: (state) => {
      state.completed = true;
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
  resetPuzzleState
} = puzzleSlice.actions;

export default puzzleSlice.reducer;
