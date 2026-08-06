import React from 'react';
import { Coins, Star, Sparkles, Flame, Trophy, Award } from 'lucide-react';

interface RewardSummaryProps {
  xp: number;
  coins: number;
  baseXp?: number;
  baseCoins?: number;
  pangramBonus: number;
  pangramCoins?: number;
  perfectBonus?: number;
  streakBonus: number;
  streakCoins?: number;
  characterBonus: number;
  characterCoins?: number;
  hintPenalty?: number;
  achievement?: string;
  beltUps?: { belt: string; title: string; coins: number; perk: string }[];
}

export const RewardSummary: React.FC<RewardSummaryProps> = ({
  xp,
  coins,
  baseXp,
  baseCoins,
  pangramBonus,
  pangramCoins = 0,
  perfectBonus = 0,
  streakBonus,
  streakCoins = 0,
  characterBonus,
  characterCoins = 0,
  hintPenalty = 0,
  achievement,
  beltUps = [],
}) => {
  const rewards = [
    ...(baseXp != null
      ? [{ icon: <Star className="text-yellow-500" size={18} />, label: 'Difficulty Base XP', value: `+${baseXp}` }]
      : []),
    ...(baseCoins != null
      ? [{ icon: <Coins className="text-yellow-400" size={18} />, label: 'Difficulty Base Coins', value: `+${baseCoins}` }]
      : []),
    { icon: <Sparkles className="text-purple-500" size={18} />, label: 'Pangram Bonus', value: `+${pangramBonus} XP / +${pangramCoins}c` },
    ...(perfectBonus > 0
      ? [{ icon: <Trophy className="text-amber-400" size={18} />, label: 'Perfect Clear', value: `+${perfectBonus} XP` }]
      : []),
    { icon: <Flame className="text-orange-500" size={18} />, label: 'Day Streak Bonus', value: `+${streakBonus} XP / +${streakCoins}c` },
    { icon: <Award className="text-cyan-500" size={18} />, label: 'Star-Tier Card Bonus', value: `+${characterBonus} XP / +${characterCoins}c` },
    { icon: <Star className="text-yellow-500" size={18} />, label: 'Total XP', value: `+${xp}` },
    { icon: <Coins className="text-yellow-400" size={18} />, label: 'Total Coins', value: `+${coins}` },
  ];

  if (hintPenalty > 0) {
    rewards.splice(-2, 0, {
      icon: <Sparkles className="text-red-400" size={18} />,
      label: 'Hint Penalty',
      value: `-${hintPenalty} XP`,
    });
  }

  return (
    <div className="space-y-3">
      {rewards.map((reward) => (
        <div
          key={reward.label}
          className="flex items-center justify-between rounded-lg border border-gold/20 bg-gold/5 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            {reward.icon}
            <span>{reward.label}</span>
          </div>
          <span className="font-bold">{reward.value}</span>
        </div>
      ))}

      {beltUps.map((up) => (
        <div
          key={up.belt}
          className="rounded-lg border border-gold bg-gold/15 p-4"
        >
          <p className="font-bold text-gold">
            Belt Up — {up.belt}: {up.title}
          </p>
          <p className="mt-1 text-sm">
            +{up.coins} coins · {up.perk}
          </p>
        </div>
      ))}

      {achievement && (
        <div className="mt-4 rounded-lg border border-green-400 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-green-500" size={20} />
            <span className="font-semibold">Highlight</span>
          </div>
          <p className="mt-2 font-bold text-green-500">{achievement}</p>
        </div>
      )}
    </div>
  );
};

export default RewardSummary;
