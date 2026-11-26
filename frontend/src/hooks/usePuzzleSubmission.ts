import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { submitWordSuccess, submitWordFailure } from '../store/puzzleSlice';
import { puzzleService } from '../services/puzzleService';
import { ApiClientError } from '../types/auth';
import { validateWordLocally } from '../utils/localPuzzleValidate';

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
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncInFlightRef = useRef(false);
  const pendingSyncRef = useRef<{
    puzzleId: number | string;
    foundWords: string[];
    score: number;
    streak: number;
  } | null>(null);

  const flushSync = useCallback(async () => {
    if (syncInFlightRef.current) return null;
    const pending = pendingSyncRef.current;
    if (!pending) return null;
    pendingSyncRef.current = null;
    syncInFlightRef.current = true;
    try {
      // syncProgress creates the session idempotently — do not call startSession first
      // (that races with sync and hits uk(user_id, puzzle_id)).
      const data = await puzzleService.syncProgress(
        pending.puzzleId,
        pending.foundWords,
        pending.score,
        pending.streak
      );
      if (data.completed) {
        dispatch(
          submitWordSuccess({
            text: '',
            score: 0,
            isPangram: false,
            serverCompleted: true,
            xpAwarded: data.xpAwarded ?? 0,
            coinsAwarded: data.coinsAwarded ?? 0,
          })
        );
      }
      return data;
    } catch {
      return null;
    } finally {
      syncInFlightRef.current = false;
      // If another sync was queued while we were in flight, flush it.
      if (pendingSyncRef.current) {
        void flushSync();
      }
    }
  }, [dispatch]);

  const queueSync = useCallback(
    (puzzleId: number | string, foundWords: string[], score: number, streak: number, immediate: boolean) => {
      pendingSyncRef.current = { puzzleId, foundWords, score, streak };
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (immediate) {
        return flushSync();
      }
      syncTimerRef.current = setTimeout(() => {
        void flushSync();
      }, 800);
      return Promise.resolve(null);
    },
    [flushSync]
  );

  const handleSubmit = useCallback(async (): Promise<string | false> => {
    if (!puzzle.activePuzzleId || !puzzle.currentWord.trim() || puzzle.completed) {
      return false;
    }
    if (submittingRef.current) return false;
    submittingRef.current = true;

    try {
      const hasLocalList = (puzzle.validWords?.length ?? 0) > 0;

      if (hasLocalList) {
        const result = validateWordLocally({
          raw: puzzle.currentWord,
          letters: puzzle.letters,
          centerLetter: puzzle.centerLetter,
          validWords: puzzle.validWords,
          pangrams: puzzle.pangrams,
          alreadyFound: puzzle.wordsFound.map((w) => w.text),
          streak: puzzle.streak,
        });

        if (!result.ok) {
          dispatch(
            submitWordFailure({
              retainStreak: result.reason === 'duplicate',
              reason: result.reason === 'duplicate' ? 'duplicate' : 'invalid',
              word: puzzle.currentWord.toUpperCase().trim(),
            })
          );
          return REASON_MESSAGES[result.reason] || 'Invalid Word';
        }

        const nextFound = [...puzzle.wordsFound.map((w) => w.text), result.word];
        const nextScore = puzzle.score + result.points;
        const nextStreak = puzzle.streak + 1;
        const willComplete = nextFound.length >= puzzle.requiredWordsToComplete;

        dispatch(
          submitWordSuccess({
            text: result.word,
            score: result.points,
            isPangram: result.isPangram,
            scoreBonusPercent: 0,
            serverCompleted: false,
            xpAwarded: 0,
            coinsAwarded: 0,
          })
        );

        await queueSync(
          puzzle.activePuzzleId,
          nextFound,
          nextScore,
          nextStreak,
          willComplete
        );

        return 'valid';
      }

      // Fallback: no answer list — per-word server submit
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
    puzzle.validWords,
    puzzle.pangrams,
    puzzle.letters,
    puzzle.centerLetter,
    puzzle.streak,
    puzzle.score,
    puzzle.requiredWordsToComplete,
    queueSync,
  ]);

  return { handleSubmit };
};

export default usePuzzleSubmission;
