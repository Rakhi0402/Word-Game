import React from "react";
import {
  Coins,
  Star,
  Gem,
  Sparkles,
  Award,
} from "lucide-react";

import { useAppSelector } from "../../store";

export const RewardPreview: React.FC = () => {
  const puzzle = useAppSelector((state) => state.puzzle);

  const rewards = {
    Easy: {
      xp: 100,
      coins: 50,
      completion: 25,
      pangram: 75,
    },
    Medium: {
      xp: 175,
      coins: 100,
      completion: 50,
      pangram: 150,
    },
    Hard: {
      xp: 300,
      coins: 175,
      completion: 100,
      pangram: 250,
    },
    Expert: {
      xp: 450,
      coins: 300,
      completion: 150,
      pangram: 350,
    },
  }[puzzle.difficulty];

  const cards = [
    {
      icon: <Star size={18} className="text-yellow-400" />,
      label: "XP",
      value: `+${rewards.xp}`,
    },
    {
      icon: <Coins size={18} className="text-yellow-500" />,
      label: "Coins",
      value: `+${rewards.coins}`,
    },
    {
      icon: <Sparkles size={18} className="text-purple-400" />,
      label: "Pangram Bonus",
      value: `+${rewards.pangram}`,
    },
    {
      icon: <Award size={18} className="text-green-500" />,
      label: "Completion Bonus",
      value: `+${rewards.completion}`,
    },
    {
      icon: <Gem size={18} className="text-cyan-400" />,
      label: "Character Boost",
      value: "Variable",
    },
  ];

  return (
    <div className="rounded-xl border border-gold/20 p-5">

      <h3 className="mb-4 text-lg font-bold">
        Reward Preview
      </h3>

      <div className="space-y-3">

        {cards.map((reward) => (
          <div
            key={reward.label}
            className="flex items-center justify-between rounded-lg border border-gold/10 bg-gold/5 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              {reward.icon}
              <span>{reward.label}</span>
            </div>

            <span className="font-bold">
              {reward.value}
            </span>
          </div>
        ))}

      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Final rewards are calculated after puzzle completion and
        include character card multipliers, streak bonuses,
        achievements, and special event bonuses.
      </p>

    </div>
  );
};

export default RewardPreview;