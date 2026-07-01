import React from "react";
import {
  Lightbulb,
  Coins,
  Eye,
  CircleHelp,
} from "lucide-react";
import { Button } from "../ui/Button";

interface HintPanelProps {
  remainingHints: number;
  hintCost: number;
  rewardPenalty: number;
  disabled?: boolean;
  onUseHint: () => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  remainingHints,
  hintCost,
  rewardPenalty,
  disabled = false,
  onUseHint,
}) => {
  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/20 p-5 dark:bg-black/10">
      <div className="mb-4 flex items-center gap-2">
        <Lightbulb className="text-yellow-500" size={22} />
        <h2 className="text-lg font-bold">Hint System</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-gold/20 p-3">
          <span>Remaining Hints</span>
          <span className="font-bold">
            {remainingHints}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gold/20 p-3">
          <div className="flex items-center gap-2">
            <Coins
              className="text-yellow-500"
              size={18}
            />
            <span>Hint Cost</span>
          </div>

          <span className="font-bold">
            {hintCost} Coins
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-gold/20 p-3">
          <div className="flex items-center gap-2">
            <CircleHelp
              className="text-orange-500"
              size={18}
            />
            <span>Reward Penalty</span>
          </div>

          <span className="font-bold text-red-500">
            -{rewardPenalty}% XP
          </span>
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={
            disabled || remainingHints === 0
          }
          onClick={onUseHint}
        >
          <Eye className="mr-2 h-4 w-4" />
          Reveal Target Word
        </Button>

        <p className="text-xs text-gray-500">
          Using a hint reveals one undiscovered target
          word. Hint usage decreases the final reward
          but does not affect puzzle completion.
        </p>
      </div>
    </div>
  );
};

export default HintPanel;