import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import { calculateRewards, type RewardCalculation } from "./rewardCalculator";
import {
  completePuzzle,
  lockPuzzle,
} from "../store/puzzleSlice";
import {
  addCoins,
  addXp,
  addWordsFound,
  incrementPuzzlesCompleted,
  updateHighestScore,
} from "../store/userSlice";

interface CompletionResult {
  isCompleted: boolean;
  showCompletionModal: boolean;
  rewards: RewardCalculation | null;
  closeCompletionModal: () => void;
}

export const usePuzzleCompletion = (): CompletionResult => {
  const dispatch = useAppDispatch();

  const puzzle = useAppSelector((state) => state.puzzle);
  const user = useAppSelector((state) => state.user);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewards, setRewards] = useState<RewardCalculation | null>(null);
  const hasAppliedCompletion = useRef(false);
  const lastPuzzleId = useRef<string | null>(null);

  useEffect(() => {
    if (puzzle.activePuzzleId !== lastPuzzleId.current) {
      lastPuzzleId.current = puzzle.activePuzzleId;
      hasAppliedCompletion.current = false;
      setShowCompletionModal(false);
      setRewards(null);
    }

    if (hasAppliedCompletion.current || puzzle.locked) return;

    const completed =
      puzzle.wordsFound.length >= puzzle.requiredWordsToComplete;

    if (!completed) return;

    hasAppliedCompletion.current = true;

    const calculatedRewards = calculateRewards({
      difficulty: puzzle.difficulty,
      pangramsFound: puzzle.pangramsFound.length,
      streak: user.dailyStreak,
      characterMultiplier: user.characterMultiplier,
    });

    setRewards(calculatedRewards);

    dispatch(addXp(calculatedRewards.xp));
    dispatch(addCoins(calculatedRewards.coins));
    dispatch(addWordsFound(puzzle.wordsFound.length));
    dispatch(updateHighestScore(puzzle.score));
    dispatch(incrementPuzzlesCompleted());

    dispatch(completePuzzle());
    dispatch(lockPuzzle());

    /*
      Backend Integration

      POST /api/puzzle/complete

      {
        puzzleId,
        userId,
        wordsFound,
        pangramsFound,
        rewards
      }

      Backend should return:
      - updated XP
      - updated Coins
      - updated Streak
      - unlocked Achievements
      - unlocked Badges
      - Leaderboard Rank
    */

    setShowCompletionModal(true);
  }, [
    dispatch,
    puzzle.activePuzzleId,
    puzzle.locked,
    puzzle.wordsFound.length,
    puzzle.requiredWordsToComplete,
    puzzle.difficulty,
    puzzle.pangramsFound,
    puzzle.score,
    user.dailyStreak,
    user.characterMultiplier,
  ]);

  return {
    isCompleted: puzzle.completed,
    showCompletionModal,
    rewards,
    closeCompletionModal: () => setShowCompletionModal(false),
  };
};

export default usePuzzleCompletion;