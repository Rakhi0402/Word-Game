import type { PuzzleDifficulty } from './rewards';
import { DIFFICULTY_CONFIG, getStarTier, STAR_TIER_REWARDS } from './rewards';

export const GAME_RULES_SUMMARY = {
  minWordLength: 4,
  lettersReusable: true,
  centerRequired: true,
  onePuzzlePerDay: true,
  difficulties: Object.keys(DIFFICULTY_CONFIG) as PuzzleDifficulty[],
};

export const starTierList = Object.values(STAR_TIER_REWARDS);

export function describeStarTier(stars: number): string[] {
  const t = getStarTier(stars);
  return [
    `+${Math.round(t.xpBonus * 100)}% XP on difficulty base`,
    `+${Math.round(t.coinBonus * 100)}% coins on difficulty base`,
    `+${Math.round(t.scoreBonus * 100)}% puzzle score`,
    `${t.charges} puzzle charges`,
    t.freeHintExtra > 0 ? `+${t.freeHintExtra} free hint / day while equipped` : 'No extra free hints',
    t.streakShieldsOnEquip > 0
      ? `+${t.streakShieldsOnEquip} Day Streak Shield(s) on equip`
      : 'No Day Streak Shields on equip',
  ];
}
