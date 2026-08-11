import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { lockPuzzle } from '../store/puzzleSlice';
import { fetchDashboard } from '../store/dashboardSlice';
import type { RewardCalculation } from './rewardCalculator';
import type { BeltUpResult } from '../store/userSlice';

interface CompletionResult {
  isCompleted: boolean;
  showCompletionModal: boolean;
  rewards: RewardCalculation | null;
  beltUps: BeltUpResult[];
  closeCompletionModal: () => void;
}

/**
 * Shows completion UI from server-awarded rewards.
 * Does not mutate XP/coins/stats locally — refetch dashboard instead.
 */
export const usePuzzleCompletion = (): CompletionResult => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const pendingRewards = useAppSelector((state) => state.puzzle.pendingServerRewards);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewards, setRewards] = useState<RewardCalculation | null>(null);
  const hasShown = useRef(false);
  const lastPuzzleId = useRef<string | null>(null);

  useEffect(() => {
    if (puzzle.activePuzzleId !== lastPuzzleId.current) {
      lastPuzzleId.current = puzzle.activePuzzleId;
      hasShown.current = false;
      setShowCompletionModal(false);
      setRewards(null);
    }

    if (hasShown.current || !puzzle.completed) return;
    hasShown.current = true;

    const awarded = pendingRewards;
    setRewards({
      xp: awarded?.xp ?? 0,
      coins: awarded?.coins ?? 0,
      baseXp: awarded?.xp ?? 0,
      baseCoins: awarded?.coins ?? 0,
      pangramBonus: 0,
      pangramCoins: 0,
      perfectBonus: 0,
      perfectCoins: 0,
      streakBonus: 0,
      streakCoins: 0,
      characterBonus: 0,
      characterCoins: 0,
      hintPenalty: 0,
    });

    dispatch(lockPuzzle(undefined));
    void dispatch(fetchDashboard());
    setShowCompletionModal(true);
  }, [dispatch, puzzle.completed, puzzle.activePuzzleId, pendingRewards]);

  return {
    isCompleted: puzzle.completed,
    showCompletionModal,
    rewards,
    beltUps: [],
    closeCompletionModal: () => setShowCompletionModal(false),
  };
};

export default usePuzzleCompletion;
