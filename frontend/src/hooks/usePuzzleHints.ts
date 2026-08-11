import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { consumeFreeHint, recordPaidHint } from '../store/cardsSlice';
import { puzzleService } from '../services/puzzleService';
import { fetchDashboard } from '../store/dashboardSlice';
import { revealHintWord } from '../store/puzzleSlice';
import { HINT_COST_COINS, MAX_PAID_HINTS_PER_PUZZLE } from '../constants/rewards';
import { ApiClientError } from '../types/auth';

const usePuzzleHints = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const cards = useAppSelector((state) => state.cards);
  const user = useAppSelector((state) => state.user);

  const freeRemaining = Math.max(0, cards.availableHints - cards.usedHints);
  const paidUsed = cards.paidHintsUsedThisPuzzle;
  const canPay = user.coins >= HINT_COST_COINS && paidUsed < MAX_PAID_HINTS_PER_PUZZLE;
  const canHint = !puzzle.completed && Boolean(puzzle.activePuzzleId) && (freeRemaining > 0 || canPay);

  const handleRevealHint = useCallback(async () => {
    if (puzzle.completed || !puzzle.activePuzzleId) return;

    try {
      const hint = await puzzleService.revealHint(puzzle.activePuzzleId);
      if (freeRemaining > 0) {
        dispatch(consumeFreeHint(undefined));
      } else {
        dispatch(recordPaidHint(undefined));
      }
      dispatch(revealHintWord(hint));
      void dispatch(fetchDashboard());
    } catch (err) {
      alert(err instanceof ApiClientError ? err.message : 'Hint unavailable.');
    }
  }, [dispatch, puzzle.completed, puzzle.activePuzzleId, freeRemaining]);

  return {
    handleRevealHint,
    remainingHints: freeRemaining,
    hintCost: HINT_COST_COINS,
    canHint,
    canPay,
    paidUsed,
  };
};

export default usePuzzleHints;
