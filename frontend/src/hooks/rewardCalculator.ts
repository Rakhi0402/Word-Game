import {
  DIFFICULTY_CONFIG,
  PANGRAM_BONUS_XP,
  PANGRAM_BONUS_COINS,
  PERFECT_CLEAR_XP,
  PERFECT_CLEAR_COINS,
  DAY_STREAK_XP_PER,
  DAY_STREAK_COINS_PER,
  DAY_STREAK_BONUS_CAP,
  HINT_XP_PENALTY_PERCENT,
  getStarTier,
  type PuzzleDifficulty,
} from '../constants/rewards';

export interface RewardCalculation {
  xp: number;
  coins: number;
  baseXp: number;
  baseCoins: number;
  pangramBonus: number;
  pangramCoins: number;
  perfectBonus: number;
  perfectCoins: number;
  streakBonus: number;
  streakCoins: number;
  characterBonus: number;
  characterCoins: number;
  hintPenalty: number;
  achievement?: string;
}

interface RewardInput {
  difficulty: PuzzleDifficulty;
  pangramsFound: number;
  dayStreak: number;
  cardStars: number;
  hintsUsed: number;
  isPerfect: boolean;
}

export const calculateRewards = ({
  difficulty,
  pangramsFound,
  dayStreak,
  cardStars,
  hintsUsed,
  isPerfect,
}: RewardInput): RewardCalculation => {
  const fixed = DIFFICULTY_CONFIG[difficulty];
  const tier = getStarTier(cardStars || 1);

  const baseXp = fixed.baseXp;
  const baseCoins = fixed.baseCoins;
  const pangramBonus = pangramsFound * PANGRAM_BONUS_XP;
  const pangramCoins = pangramsFound * PANGRAM_BONUS_COINS;
  const perfectBonus = isPerfect ? PERFECT_CLEAR_XP : 0;
  const perfectCoins = isPerfect ? PERFECT_CLEAR_COINS : 0;
  const streakDays = Math.min(Math.max(dayStreak, 0), DAY_STREAK_BONUS_CAP);
  const streakBonus = streakDays * DAY_STREAK_XP_PER;
  const streakCoins = streakDays * DAY_STREAK_COINS_PER;
  const characterBonus = Math.round(baseXp * tier.xpBonus);
  const characterCoins = Math.round(baseCoins * tier.coinBonus);

  let xp =
    baseXp + pangramBonus + perfectBonus + streakBonus + characterBonus;
  const hintPenalty =
    hintsUsed > 0 ? Math.round(xp * (HINT_XP_PENALTY_PERCENT / 100)) : 0;
  xp = Math.max(0, xp - hintPenalty);

  const coins = baseCoins + pangramCoins + perfectCoins + streakCoins + characterCoins;

  const achievement =
    dayStreak >= 30
      ? '30 Day Streak'
      : pangramsFound > 0
        ? 'Pangram Hunter'
        : undefined;

  return {
    xp,
    coins,
    baseXp,
    baseCoins,
    pangramBonus,
    pangramCoins,
    perfectBonus,
    perfectCoins,
    streakBonus,
    streakCoins,
    characterBonus,
    characterCoins,
    hintPenalty,
    achievement,
  };
};
