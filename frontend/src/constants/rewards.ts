import type { BeltColor } from '../types';

export type PuzzleDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

/**
 * Daily featured puzzle is scheduled independently of player difficulty choice.
 * Mock: rotate pool by calendar date (any difficulty). Prod: fetch by date from DB / scheduler.
 *
 * Extra player-chosen puzzles allowed after the daily is done.
 */
export const MAX_CHOICE_PUZZLES_PER_DAY = 5;

/** Fixed base completion rewards by difficulty (canonical). */
export const DIFFICULTY_CONFIG: Record<
  PuzzleDifficulty,
  { targetWords: number; baseXp: number; baseCoins: number }
> = {
  Easy: { targetWords: 10, baseXp: 100, baseCoins: 30 },
  Medium: { targetWords: 15, baseXp: 150, baseCoins: 60 },
  Hard: { targetWords: 20, baseXp: 200, baseCoins: 80 },
  Expert: { targetWords: 25, baseXp: 250, baseCoins: 100 },
};

/** @deprecated Use DIFFICULTY_CONFIG — kept for gradual migration */
export const BASE_REWARDS = {
  Easy: { xp: DIFFICULTY_CONFIG.Easy.baseXp, coins: DIFFICULTY_CONFIG.Easy.baseCoins },
  Medium: { xp: DIFFICULTY_CONFIG.Medium.baseXp, coins: DIFFICULTY_CONFIG.Medium.baseCoins },
  Hard: { xp: DIFFICULTY_CONFIG.Hard.baseXp, coins: DIFFICULTY_CONFIG.Hard.baseCoins },
  Expert: { xp: DIFFICULTY_CONFIG.Expert.baseXp, coins: DIFFICULTY_CONFIG.Expert.baseCoins },
} as const;

export const PANGRAM_BONUS_XP = 50;
export const PANGRAM_BONUS_COINS = 10;
export const PERFECT_CLEAR_XP = 100;
export const PERFECT_CLEAR_COINS = 40;
export const DAY_STREAK_XP_PER = 15;
export const DAY_STREAK_COINS_PER = 5;
export const DAY_STREAK_BONUS_CAP = 14;
export const HINT_XP_PENALTY_PERCENT = 20;

export const FREE_DAILY_HINTS = 3;
export const HINT_COST_COINS = 50;
export const MAX_PAID_HINTS_PER_PUZZLE = 5;
export const DEFAULT_DAILY_HINTS = FREE_DAILY_HINTS;

export const CHEST_DRAW_COST = 100;
export const MAX_STREAK_SHIELDS = 5;
export const STARTING_COINS = 50;

export const MIN_WORD_LENGTH = 4;
/** Soft cap for the current-word field (letters reusable; UI scrolls beyond viewport). */
export const MAX_WORD_INPUT_LENGTH = 20;
export const PANGRAM_SCORE_FLAT = 7;

/** Per-word drip during play */
export const WORD_DRIP = {
  len4: { xp: 3, coins: 1 },
  len5to6: { xp: 5, coins: 2 },
  len7plus: { xp: 8, coins: 3 },
  pangramExtra: { xp: 20, coins: 8 },
} as const;

export interface StarTierRewards {
  stars: number;
  rarityBand: string;
  xpBonus: number;
  coinBonus: number;
  scoreBonus: number;
  freeHintExtra: number;
  charges: number;
  streakShieldsOnEquip: number;
}

/** Same stars → same mechanical rewards (XP/coin % of fixed base). */
export const STAR_TIER_REWARDS: Record<number, StarTierRewards> = {
  1: {
    stars: 1,
    rarityBand: 'Common',
    xpBonus: 0.1,
    coinBonus: 0.05,
    scoreBonus: 0.05,
    freeHintExtra: 0,
    charges: 5,
    streakShieldsOnEquip: 2,
  },
  2: {
    stars: 2,
    rarityBand: 'Common+',
    xpBonus: 0.1,
    coinBonus: 0.05,
    scoreBonus: 0.05,
    freeHintExtra: 0,
    charges: 5,
    streakShieldsOnEquip: 2,
  },
  3: {
    stars: 3,
    rarityBand: 'Rare',
    xpBonus: 0.15,
    coinBonus: 0.1,
    scoreBonus: 0.07,
    freeHintExtra: 0,
    charges: 4,
    streakShieldsOnEquip: 2,
  },
  4: {
    stars: 4,
    rarityBand: 'Epic',
    xpBonus: 0.2,
    coinBonus: 0.15,
    scoreBonus: 0.08,
    freeHintExtra: 1,
    charges: 3,
    streakShieldsOnEquip: 2,
  },
  5: {
    stars: 5,
    rarityBand: 'Legendary',
    xpBonus: 0.3,
    coinBonus: 0.2,
    scoreBonus: 0.1,
    freeHintExtra: 3,
    charges: 3,
    streakShieldsOnEquip: 3,
  },
};

export const getStarTier = (stars: number): StarTierRewards =>
  STAR_TIER_REWARDS[stars] ?? STAR_TIER_REWARDS[1];

export const DUPLICATE_REFUND_BY_STARS: Record<number, number> = {
  1: 20,
  2: 20,
  3: 35,
  4: 50,
  5: 60,
};

/** Chest rarity weights by star (sum ≈ 100) */
export const CHEST_STAR_WEIGHTS: { stars: number; weight: number }[] = [
  { stars: 1, weight: 45 },
  { stars: 3, weight: 30 },
  { stars: 4, weight: 18 },
  { stars: 5, weight: 7 },
];

export interface BeltLevelConfig {
  belt: BeltColor;
  minXp: number;
  title: string;
  colorClass: string;
  rankUpCoins: number;
  rankUpPerk: string;
}

export const BELT_PROGRESSION: BeltLevelConfig[] = [
  {
    belt: 'White',
    minXp: 0,
    title: 'Novice Disciple',
    colorClass: 'bg-slate-200 text-slate-800',
    rankUpCoins: 0,
    rankUpPerk: 'Start with 50 coins and Po (1★)',
  },
  {
    belt: 'Yellow',
    minXp: 500,
    title: 'Temple Initiate',
    colorClass: 'bg-yellow-400 text-yellow-900',
    rankUpCoins: 80,
    rankUpPerk: '+1 free hint charge next day',
  },
  {
    belt: 'Orange',
    minXp: 1000,
    title: 'Bamboo Striker',
    colorClass: 'bg-orange-500 text-white',
    rankUpCoins: 120,
    rankUpPerk: '+1 Day Streak Shield',
  },
  {
    belt: 'Green',
    minXp: 2500,
    title: 'Jade Defender',
    colorClass: 'bg-emerald-600 text-white',
    rankUpCoins: 200,
    rankUpPerk: 'Free chest summon',
  },
  {
    belt: 'Blue',
    minXp: 5000,
    title: 'Flowing Crane',
    colorClass: 'bg-blue-600 text-white',
    rankUpCoins: 300,
    rankUpPerk: 'Refill one exhausted card (highest stars first)',
  },
  {
    belt: 'Brown',
    minXp: 7000,
    title: 'Earth Tiger',
    colorClass: 'bg-amber-800 text-white',
    rankUpCoins: 500,
    rankUpPerk: '+2 Day Streak Shields',
  },
  {
    belt: 'Black',
    minXp: 10000,
    title: 'Dragon Master',
    colorClass: 'bg-slate-900 text-amber-400 border border-amber-400',
    rankUpCoins: 700,
    rankUpPerk: 'Permanent +1 daily free hint',
  },
];

export const STREAK_MILESTONES: {
  days: number;
  coins: number;
  refillStars: number;
  extraShield?: number;
}[] = [
  { days: 3, coins: 50, refillStars: 1 },
  { days: 7, coins: 100, refillStars: 3 },
  { days: 30, coins: 150, refillStars: 4 },
  { days: 50, coins: 250, refillStars: 5, extraShield: 1 },
];

export function spellingBeeWordPoints(word: string, isPangram: boolean): number {
  const len = word.length;
  let points = 0;
  if (len <= 4) points = 1;
  else if (len === 5) points = 5;
  else points = len;
  if (isPangram) points += PANGRAM_SCORE_FLAT;
  return points;
}

export function wordStreakExtra(currentStreakAfterSuccess: number): number {
  if (currentStreakAfterSuccess < 3) return 0;
  return currentStreakAfterSuccess - 2;
}

export function dripForWord(word: string, isPangram: boolean): { xp: number; coins: number } {
  const len = word.length;
  let base: { xp: number; coins: number } = WORD_DRIP.len4;
  if (len >= 7) base = WORD_DRIP.len7plus;
  else if (len >= 5) base = WORD_DRIP.len5to6;
  return {
    xp: base.xp + (isPangram ? WORD_DRIP.pangramExtra.xp : 0),
    coins: base.coins + (isPangram ? WORD_DRIP.pangramExtra.coins : 0),
  };
}
