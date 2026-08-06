import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  consumeFreeHint,
  recordPaidHint,
} from '../store/cardsSlice';
import { deductCoins, incrementHintsBought, incrementHintsUsed } from '../store/userSlice';
import { revealHint } from '../store/puzzleSlice';
import { HINT_COST_COINS, MAX_PAID_HINTS_PER_PUZZLE } from '../constants/rewards';

const usePuzzleHints = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const cards = useAppSelector((state) => state.cards);
  const user = useAppSelector((state) => state.user);

  const freeRemaining = Math.max(0, cards.availableHints - cards.usedHints);
  const paidUsed = cards.paidHintsUsedThisPuzzle;
  const canPay = user.coins >= HINT_COST_COINS && paidUsed < MAX_PAID_HINTS_PER_PUZZLE;
  const canHint = !puzzle.completed && (freeRemaining > 0 || canPay);

  const handleRevealHint = useCallback(() => {
    if (puzzle.completed) return;

    const remainingWords = puzzle.validWords.filter(
      (w) =>
        !puzzle.wordsFound.some((f) => f.text === w) && !puzzle.hintedWords.includes(w)
    );
    if (remainingWords.length === 0) return;

    if (freeRemaining > 0) {
      dispatch(consumeFreeHint(undefined));
      dispatch(revealHint(undefined));
      dispatch(incrementHintsUsed(undefined));
      return;
    }

    if (canPay) {
      dispatch(deductCoins(HINT_COST_COINS));
      dispatch(recordPaidHint(undefined));
      dispatch(revealHint(undefined));
      dispatch(incrementHintsUsed(undefined));
      dispatch(incrementHintsBought(undefined));
    }
  }, [
    dispatch,
    puzzle.completed,
    puzzle.validWords,
    puzzle.wordsFound,
    puzzle.hintedWords,
    freeRemaining,
    canPay,
  ]);

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
