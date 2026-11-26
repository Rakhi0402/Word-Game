import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { lockPuzzle } from '../store/puzzleSlice';
import { fetchDashboard } from '../store/dashboardSlice';
import { fetchProfile } from '../store/profileSlice';
import { achievementService } from '../services/gameApi';
import { CHARACTER_CARDS } from '../constants';
import { calculateRewards, type RewardCalculation } from './rewardCalculator';
import type { BeltUpResult } from '../store/userSlice';
import { todayKey } from '../services/cache';

interface CompletionResult {
  isCompleted: boolean;
  showCompletionModal: boolean;
  rewards: RewardCalculation | null;
  beltUps: BeltUpResult[];
  closeCompletionModal: () => void;
}

/**
 * Shows completion UI from server-awarded rewards (with local breakdown for the modal).
 * Does not mutate XP/coins/stats locally — refetch dashboard instead.
 */
export const usePuzzleCompletion = (): CompletionResult => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const user = useAppSelector((state) => state.user);
  const pendingRewards = useAppSelector((state) => state.puzzle.pendingServerRewards);
  const equipped = useAppSelector((state) => state.cards.equippedCardId);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewards, setRewards] = useState<RewardCalculation | null>(null);
  const hasShown = useRef(false);
  const lastPuzzleId = useRef<number | null>(null);

  useEffect(() => {
    if (puzzle.activePuzzleId !== lastPuzzleId.current) {
      lastPuzzleId.current = puzzle.activePuzzleId;
      hasShown.current = false;
      setShowCompletionModal(false);
      setRewards(null);
    }

    if (hasShown.current || !puzzle.completed) return;
    hasShown.current = true;

    const today = todayKey();
    const alreadyCountedToday = user.lastPuzzleDate === today;
    const dayStreakForBonus = alreadyCountedToday
      ? Math.max(user.dailyStreak, 1)
      : Math.max(user.dailyStreak, 0) + 1;

    const cardStars = CHARACTER_CARDS.find((c) => c.id === equipped)?.stars ?? 1;

    const isPerfect =
      puzzle.totalValidWordsCount > 0 &&
      puzzle.wordsFound.length >= puzzle.totalValidWordsCount;

    const calc = calculateRewards({
      difficulty: puzzle.difficulty,
      pangramsFound: puzzle.pangramsFound.length,
      dayStreak: dayStreakForBonus,
      cardStars: Number(cardStars) || 1,
      hintsUsed: puzzle.hintsUsedThisPuzzle,
      isPerfect,
    });

    const serverXp = pendingRewards?.xp ?? 0;
    const serverCoins = pendingRewards?.coins ?? 0;

    setRewards({
      ...calc,
      // Prefer authoritative server totals when present; keep calc for line-item breakdown.
      xp: serverXp > 0 ? serverXp : calc.xp,
      coins: serverCoins > 0 ? serverCoins : calc.coins,
      baseXp: calc.baseXp,
      baseCoins: calc.baseCoins,
    });

    dispatch(lockPuzzle(undefined));
    void (async () => {
      try {
        await achievementService.evaluate();
      } catch {
        /* server already evaluates on completion; this is a safety net */
      }
      await Promise.all([
        dispatch(fetchDashboard({ force: true })),
        dispatch(fetchProfile({ force: true })),
      ]);
    })();
    setShowCompletionModal(true);
  }, [
    dispatch,
    puzzle.completed,
    puzzle.activePuzzleId,
    puzzle.difficulty,
    puzzle.pangramsFound.length,
    puzzle.wordsFound.length,
    puzzle.totalValidWordsCount,
    puzzle.hintsUsedThisPuzzle,
    pendingRewards,
    user.lastPuzzleDate,
    user.dailyStreak,
    equipped,
  ]);

  return {
    isCompleted: puzzle.completed,
    showCompletionModal,
    rewards,
    beltUps: [],
    closeCompletionModal: () => setShowCompletionModal(false),
  };
};

export default usePuzzleCompletion;
