import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { submitWordSuccess, submitWordFailure } from '../store/puzzleSlice';
import { puzzleService } from '../services/puzzleService';
import { ApiClientError } from '../types/auth';

const REASON_MESSAGES: Record<string, string> = {
  too_short: 'Too short (min 4 letters)',
  missing_center: 'Must use center letter',
  bad_letters: 'Uses letters not in the puzzle',
  not_in_dict: 'Not in word list',
  duplicate: 'Already Found',
};

const usePuzzleSubmission = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async (): Promise<string | false> => {
    if (!puzzle.activePuzzleId || !puzzle.currentWord.trim() || puzzle.completed) {
      return false;
    }
    if (submittingRef.current) return false;
    submittingRef.current = true;

    try {
      const word = puzzle.currentWord.toUpperCase().trim();
      const alreadyFound = puzzle.wordsFound.some((entry) => entry.text === word);
      if (alreadyFound) {
        dispatch(submitWordFailure({ retainStreak: true, reason: 'duplicate', word }));
        return REASON_MESSAGES.duplicate;
      }

      const response = await puzzleService.submitWord(puzzle.activePuzzleId, word);
      if (!response.success || !response.data) {
        dispatch(submitWordFailure({ retainStreak: false, reason: 'invalid', word }));
        return 'Invalid Word';
      }

      if (!response.data.valid) {
        const reason = response.data.reason || (response.data.duplicate ? 'duplicate' : 'not_in_dict');
        dispatch(
          submitWordFailure({
            retainStreak: reason === 'duplicate',
            reason: reason === 'duplicate' ? 'duplicate' : 'invalid',
            word,
          })
        );
        return REASON_MESSAGES[reason] || 'Invalid Word';
      }

      // Points come from the server — do not apply client card score bonus on top.
      dispatch(
        submitWordSuccess({
          text: word,
          score: response.data.points,
          isPangram: response.data.isPangram ?? false,
          scoreBonusPercent: 0,
          serverCompleted: Boolean(response.data.completed),
          xpAwarded: response.data.xpAwarded ?? 0,
          coinsAwarded: response.data.coinsAwarded ?? 0,
        })
      );

      return 'valid';
    } catch (err) {
      dispatch(submitWordFailure({ retainStreak: false, reason: 'invalid', word: puzzle.currentWord }));
      if (err instanceof ApiClientError) {
        return err.message || 'Invalid Word';
      }
      return 'Invalid Word';
    } finally {
      submittingRef.current = false;
    }
  }, [
    dispatch,
    puzzle.activePuzzleId,
    puzzle.currentWord,
    puzzle.wordsFound,
    puzzle.completed,
  ]);

  return { handleSubmit };
};

export default usePuzzleSubmission;
