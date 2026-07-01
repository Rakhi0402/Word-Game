import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { submitWordSuccess, submitWordFailure } from '../store/puzzleSlice';
import { puzzleService } from '../services/puzzleService';

const usePuzzleSubmission = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);

  const handleSubmit = useCallback(async () => {
    if (!puzzle.activePuzzleId || !puzzle.currentWord.trim()) return false;

    const response = await puzzleService.submitWord(puzzle.activePuzzleId, puzzle.currentWord);

    if (!response.success || !response.data) {
      dispatch(submitWordFailure({ retainStreak: false }));
      return false;
    }

    const word = puzzle.currentWord.toUpperCase();
    const alreadyFound = puzzle.wordsFound.some((entry) => entry.text === word);

    if (alreadyFound) {
      dispatch(submitWordFailure({ retainStreak: true, reason: 'duplicate', word }));
      return "Already Found";
    }

    if (!response.data.valid) {
      const centerLetterIncluded = word.includes(puzzle.centerLetter.toUpperCase());
      if (!centerLetterIncluded) {
        dispatch(submitWordFailure({ retainStreak: true }));
        return false;
      }

      dispatch(submitWordFailure({ retainStreak: true, reason: 'invalid', word }));
      return false;
    }

    dispatch(submitWordSuccess({
      text: word,
      score: response.data.points,
      isPangram: response.data.isPangram ?? false,
    }));
    return "valid";
  }, [dispatch, puzzle.activePuzzleId, puzzle.currentWord, puzzle.centerLetter, puzzle.wordsFound]);

  return { handleSubmit };
};

export default usePuzzleSubmission;
