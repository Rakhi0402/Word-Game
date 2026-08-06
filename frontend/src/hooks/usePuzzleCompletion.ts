import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { store } from '../store';
import { calculateRewards, type RewardCalculation } from './rewardCalculator';
import { completePuzzle, lockPuzzle } from '../store/puzzleSlice';
import {
  addCoins,
  addPangramsFound,
  addXp,
  addWordsFound,
  claimBeltReward,
  claimStreakMilestone,
  getUnclaimedBeltUps,
  incrementPerfectPuzzles,
  incrementPuzzlesCompleted,
  setDailyStreak,
  setLastPuzzleMeta,
  updateHighestScore,
  addStreakShields,
  addFreeChestToken,
  addBonusFreeHintsNextDay,
  setPermanentExtraDailyHint,
  incrementChoicePuzzlesToday,
} from '../store/userSlice';
import {
  consumeCardChargeOnComplete,
  refillExhaustedByStars,
  refillHighestExhausted,
  refillCardCharges,
} from '../store/cardsSlice';
import { evaluateAchievements } from '../store/achievementsSlice';
import { updateUserScore } from '../store/leaderboardSlice';
import { CHARACTER_CARDS } from '../constants';
import { STREAK_MILESTONES } from '../constants/rewards';
import {
  isTodaysDailyCompleted,
  markDailyCompleted,
  saveProgressFromState,
  todayKey,
  wasYesterdayCompleted,
} from '../utils/mockProgress';
import type { BeltUpResult } from '../store/userSlice';

interface CompletionResult {
  isCompleted: boolean;
  showCompletionModal: boolean;
  rewards: RewardCalculation | null;
  beltUps: BeltUpResult[];
  closeCompletionModal: () => void;
}

export const usePuzzleCompletion = (): CompletionResult => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);
  const user = useAppSelector((state) => state.user);
  const cards = useAppSelector((state) => state.cards);
  const authEmail = useAppSelector((state) => state.auth.email);

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [rewards, setRewards] = useState<RewardCalculation | null>(null);
  const [beltUps, setBeltUps] = useState<BeltUpResult[]>([]);
  const hasAppliedCompletion = useRef(false);
  const lastPuzzleId = useRef<string | null>(null);

  useEffect(() => {
    if (puzzle.activePuzzleId !== lastPuzzleId.current) {
      lastPuzzleId.current = puzzle.activePuzzleId;
      hasAppliedCompletion.current = false;
      setShowCompletionModal(false);
      setRewards(null);
      setBeltUps([]);
    }

    if (hasAppliedCompletion.current || puzzle.locked) return;

    const email = authEmail || user.email;
    // Daily already settled for this puzzle — don't re-apply rewards on review
    if (
      puzzle.isDailySession &&
      email &&
      puzzle.activePuzzleId &&
      isTodaysDailyCompleted(email, puzzle.activePuzzleId)
    ) {
      return;
    }

    // Never auto-complete empty / invalid targets
    if (puzzle.requiredWordsToComplete <= 0 || puzzle.wordsFound.length === 0) return;

    const completed = puzzle.wordsFound.length >= puzzle.requiredWordsToComplete;
    if (!completed) return;

    hasAppliedCompletion.current = true;

    const card = CHARACTER_CARDS.find((c) => c.id === cards.equippedCardId);
    const cardStars = card?.stars ?? 1;

    let nextDayStreak = user.dailyStreak;
    if (puzzle.isDailySession) {
      nextDayStreak = 1;
      if (email && wasYesterdayCompleted(email)) {
        nextDayStreak = user.dailyStreak + 1;
      } else if (user.dailyStreak > 0) {
        nextDayStreak = user.dailyStreak + 1;
      }
    }

    const isPerfect = puzzle.wordsFound.length >= puzzle.totalValidWords;
    const hintsUsed =
      puzzle.hintsUsedThisPuzzle ||
      cards.usedHints + cards.paidHintsUsedThisPuzzle;

    const calculated = calculateRewards({
      difficulty: puzzle.difficulty,
      pangramsFound: puzzle.pangramsFound.length,
      dayStreak: nextDayStreak,
      cardStars,
      hintsUsed,
      isPerfect,
    });

    setRewards(calculated);

    const prevXp = user.xp;
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'rewards-post',hypothesisId:'R2',location:'usePuzzleCompletion.ts:settle',message:'completion-only user XP/coins grant',data:{prevXp,prevCoins:user.coins,grantXp:calculated.xp,grantCoins:calculated.coins,sessionScore:puzzle.score,wordsThisPuzzle:puzzle.wordsFound.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    dispatch(addXp(calculated.xp));
    dispatch(addCoins(calculated.coins));
    dispatch(addWordsFound(puzzle.wordsFound.length));
    dispatch(addPangramsFound(puzzle.pangramsFound.length));
    if (isPerfect) dispatch(incrementPerfectPuzzles(undefined));
    dispatch(updateHighestScore(puzzle.score));
    dispatch(incrementPuzzlesCompleted({ countDay: puzzle.isDailySession }));
    if (puzzle.isDailySession) {
      dispatch(setDailyStreak(nextDayStreak));
    }
    dispatch(
      setLastPuzzleMeta({ date: todayKey(), difficulty: puzzle.difficulty })
    );
    if (!puzzle.isDailySession) {
      dispatch(incrementChoicePuzzlesToday(todayKey()));
    }

    const ups = getUnclaimedBeltUps(prevXp, prevXp + calculated.xp, user.claimedBeltRewards);
    ups.forEach((up) => {
      dispatch(addCoins(up.coins));
      dispatch(claimBeltReward(up.belt));
      if (up.belt === 'Yellow') dispatch(addBonusFreeHintsNextDay(1));
      if (up.belt === 'Orange') dispatch(addStreakShields(1));
      if (up.belt === 'Green') dispatch(addFreeChestToken(1));
      if (up.belt === 'Blue') dispatch(refillHighestExhausted(undefined));
      if (up.belt === 'Brown') dispatch(addStreakShields(2));
      if (up.belt === 'Black') dispatch(setPermanentExtraDailyHint(undefined));
    });
    setBeltUps(ups);

    if (puzzle.isDailySession) {
      STREAK_MILESTONES.forEach((m) => {
        if (
          nextDayStreak >= m.days &&
          !user.claimedStreakMilestones.includes(m.days)
        ) {
          dispatch(addCoins(m.coins));
          dispatch(claimStreakMilestone(m.days));
          const hadExhausted = cards.unlockedCardIds.some((id) => {
            const c = CHARACTER_CARDS.find((x) => x.id === id);
            return c?.stars === m.refillStars && cards.inventory[id]?.status === 'exhausted';
          });
          if (hadExhausted) {
            dispatch(refillExhaustedByStars(m.refillStars));
          } else {
            const pool = cards.unlockedCardIds.filter((id) => {
              const c = CHARACTER_CARDS.find((x) => x.id === id);
              return c?.stars === m.refillStars && cards.inventory[id]?.status === 'available';
            });
            if (pool.length > 0) {
              const id = pool[Math.floor(Math.random() * pool.length)];
              const amount = m.days === 7 ? 2 : m.days === 30 ? 1 : undefined;
              dispatch(refillCardCharges({ cardId: id, amount }));
            } else if (m.days === 3) {
              dispatch(addFreeChestToken(1));
            }
          }
          if (m.extraShield) dispatch(addStreakShields(m.extraShield));
        }
      });
    }

    dispatch(consumeCardChargeOnComplete(undefined));

    const nextStats = {
      ...user.stats,
      wordsFound: user.stats.wordsFound + puzzle.wordsFound.length,
      puzzlesCompleted: user.stats.puzzlesCompleted + 1,
      highestScore: Math.max(user.stats.highestScore, puzzle.score),
      daysPlayed: user.stats.daysPlayed + (puzzle.isDailySession ? 1 : 0),
      pangramsFound: user.stats.pangramsFound + puzzle.pangramsFound.length,
      perfectPuzzles: user.stats.perfectPuzzles + (isPerfect ? 1 : 0),
    };

    dispatch(
      evaluateAchievements({
        stats: nextStats,
        xp: prevXp + calculated.xp,
        bestWordStreak: puzzle.streak,
        dayStreak: nextDayStreak,
        pangramsFound: nextStats.pangramsFound,
        perfectPuzzles: nextStats.perfectPuzzles,
      })
    );

    dispatch(
      updateUserScore({
        username: user.username,
        score: prevXp + calculated.xp,
        belt: user.belt,
      })
    );

    dispatch(completePuzzle(undefined));
    dispatch(lockPuzzle(undefined));

    if (email) {
      if (puzzle.isDailySession && puzzle.activePuzzleId) {
        markDailyCompleted(email, {
          puzzleId: puzzle.activePuzzleId,
          date: todayKey(),
          difficulty: puzzle.difficulty,
          wordsFound: puzzle.wordsFound,
          score: puzzle.score,
          pangramsFound: puzzle.pangramsFound,
          hintedWords: puzzle.hintedWords,
          streak: puzzle.streak,
          hintsUsedThisPuzzle: hintsUsed,
        });
      }
      queueMicrotask(() => saveProgressFromState(email, store.getState()));
    }

    setShowCompletionModal(true);
  }, [dispatch, puzzle, user, cards, authEmail]);

  return {
    isCompleted: puzzle.completed,
    showCompletionModal,
    rewards,
    beltUps,
    closeCompletionModal: () => setShowCompletionModal(false),
  };
};

export default usePuzzleCompletion;
