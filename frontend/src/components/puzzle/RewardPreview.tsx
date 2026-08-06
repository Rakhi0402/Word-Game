import React from 'react';
import { Coins, Star, Sparkles, Award, Gem } from 'lucide-react';
import { useAppSelector } from '../../store';
import {
  DIFFICULTY_CONFIG,
  PANGRAM_BONUS_XP,
  DAY_STREAK_XP_PER,
  HINT_XP_PENALTY_PERCENT,
} from '../../constants/rewards';

export const RewardPreview: React.FC = () => {
  const puzzle = useAppSelector((state) => state.puzzle);
  const base = DIFFICULTY_CONFIG[puzzle.difficulty] ?? DIFFICULTY_CONFIG.Easy;

  const rows = [
    {
      icon: <Star size={18} className="text-yellow-400" />,
      label: 'Fixed Base XP',
      value: `+${base.baseXp}`,
    },
    {
      icon: <Coins size={18} className="text-yellow-500" />,
      label: 'Fixed Base Coins',
      value: `+${base.baseCoins}`,
    },
    {
      icon: <Sparkles size={18} className="text-purple-400" />,
      label: 'Pangram Bonus (each)',
      value: `+${PANGRAM_BONUS_XP} XP`,
    },
    {
      icon: <Award size={18} className="text-green-500" />,
      label: 'Day Streak Bonus',
      value: `+${DAY_STREAK_XP_PER} XP / day (cap 14)`,
    },
    {
      icon: <Gem size={18} className="text-cyan-400" />,
      label: 'Star-Tier Card Boost',
      value: '% of fixed base',
    },
  ];

  return (
    <div className="rounded-xl border border-gold/20 p-5">
      <h3 className="mb-4 text-lg font-bold">Reward Preview</h3>
      <div className="space-y-3">
        {rows.map((reward) => (
          <div
            key={reward.label}
            className="flex items-center justify-between rounded-lg border border-gold/10 bg-gold/5 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              {reward.icon}
              <span>{reward.label}</span>
            </div>
            <span className="font-bold">{reward.value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Completion = fixed base + pangram + perfect + day streak + star % of base. Any hint → −
        {HINT_XP_PENALTY_PERCENT}% XP. Profile XP & coins update only when the puzzle is completed.
      </p>
    </div>
  );
};

export default RewardPreview;
