import React from "react";
import {
  Coins,
  Star,
  Sparkles,
  Flame,
  Trophy,
  Award,
} from "lucide-react";

interface RewardSummaryProps {
  xp: number;
  coins: number;
  pangramBonus: number;
  streakBonus: number;
  characterBonus: number;
  achievement?: string;
}

export const RewardSummary: React.FC<RewardSummaryProps> = ({
  xp,
  coins,
  pangramBonus,
  streakBonus,
  characterBonus,
 achievement,
}) => {
  const rewards = [
    { icon: <Star className="text-yellow-500" size={18} />, label: "XP Earned", value: `+${xp}` },
    { icon: <Coins className="text-yellow-400" size={18} />, label: "Coins Earned", value: `+${coins}` },
    { icon: <Sparkles className="text-purple-500" size={18} />, label: "Pangram Bonus", value: `+${pangramBonus} XP` },
    { icon: <Flame className="text-orange-500" size={18} />, label: "Streak Bonus", value: `+${streakBonus} XP` },
    { icon: <Award className="text-cyan-500" size={18} />, label: "Character Bonus", value: `+${characterBonus} XP` },
  ];

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

      {achievement && (
        <div className="mt-4 rounded-lg border border-green-400 bg-green-500/10 p-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-green-500" size={20} />
            <span className="font-semibold">Achievement Unlocked</span>
          </div>
          <p className="mt-2 font-bold text-green-500">{achievement}</p>
        </div>
      )}
    </div>
  );
};

export default RewardSummary;