export interface RewardCalculation {
  xp: number;
  coins: number;
  pangramBonus: number;
  streakBonus: number;
  characterBonus: number;
  achievement?: string;
}

interface RewardInput {
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  pangramsFound: number;
  streak: number;
  characterMultiplier: number;
}

const BASE_REWARDS = {
  Easy: { xp: 100, coins: 50 },
  Medium: { xp: 175, coins: 100 },
  Hard: { xp: 300, coins: 175 },
  Expert: { xp: 450, coins: 275 },
};

export const calculateRewards = ({
  difficulty,
  pangramsFound,
  streak,
  characterMultiplier,
}: RewardInput): RewardCalculation => {
  const base = BASE_REWARDS[difficulty];

  const pangramBonus = pangramsFound * 75;
  const streakBonus = streak * 10;
  const characterBonus = Math.round(base.xp * characterMultiplier);

  const xp =
    base.xp +
    pangramBonus +
    streakBonus +
    characterBonus;

  const achievement =
    streak >= 30
      ? "30 Day Streak"
      : pangramsFound > 0
      ? "Pangram Hunter"
      : undefined;

  return {
    xp,
    coins: base.coins,
    pangramBonus,
    streakBonus,
    characterBonus,
    achievement,
  };
};