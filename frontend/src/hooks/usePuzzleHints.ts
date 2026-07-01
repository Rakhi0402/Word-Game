import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { consumeHint } from '../store/cardsSlice';
import { deductCoins } from '../store/userSlice';
import { revealHint } from '../store/puzzleSlice';

const usePuzzleHints = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const cards = useAppSelector((state) => state.cards);
  const user = useAppSelector((state) => state.user);

  const remainingHints = Math.max(0, cards.availableHints - cards.usedHints);

  const handleRevealHint = useCallback(() => {
    if (user.coins < 25 || puzzle.completed || remainingHints <= 0) return;

    dispatch(deductCoins(25));
    dispatch(consumeHint());
    dispatch(revealHint());
  }, [dispatch, puzzle.completed, remainingHints, user.coins]);

  return { handleRevealHint, remainingHints };
};

export default usePuzzleHints;
