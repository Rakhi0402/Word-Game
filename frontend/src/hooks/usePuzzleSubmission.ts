import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { submitWordSuccess, submitWordFailure } from '../store/puzzleSlice';
import { getScoreBonus } from '../store/cardsSlice';
import { puzzleService } from '../services/puzzleService';

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
  const equippedCardId = useAppSelector((state) => state.cards.equippedCardId);
  const submittingRef = useRef(false);

  const handleSubmit = useCallback(async (): Promise<string | false> => {
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '156feb',
      },
      body: JSON.stringify({
        sessionId: '156feb',
        runId: 'rewards-post',
        hypothesisId: 'R1',
        location: 'usePuzzleSubmission.ts:entry',
        message: 'submit — no mid-play XP/coin drip to user',
        data: { word: puzzle.currentWord, sessionScoreBefore: puzzle.score },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
        const reason = response.data.reason || 'not_in_dict';
        dispatch(
          submitWordFailure({
            retainStreak: reason === 'duplicate',
            reason: reason === 'duplicate' ? 'duplicate' : 'invalid',
            word,
          })
        );
        return REASON_MESSAGES[reason] || 'Invalid Word';
      }

      const scoreBonusPercent = getScoreBonus(equippedCardId);
      dispatch(
        submitWordSuccess({
          text: word,
          score: response.data.points,
          isPangram: response.data.isPangram ?? false,
          scoreBonusPercent,
        })
      );

      // Profile XP / coins / wordsFound apply only on puzzle completion.
      return 'valid';
    } finally {
      submittingRef.current = false;
    }
  }, [
    dispatch,
    puzzle.activePuzzleId,
    puzzle.currentWord,
    puzzle.wordsFound,
    puzzle.completed,
    puzzle.score,
    equippedCardId,
  ]);

  return { handleSubmit };
};

export default usePuzzleSubmission;
