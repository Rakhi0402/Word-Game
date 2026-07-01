import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart3,
} from "lucide-react";

import { useAppSelector } from "../../store";
import HintPanel from "./HintPanel";
import RewardPreview from "./RewardPreview";

interface PuzzleStatsProps {
  disabled?: boolean;
  onHint: () => void;
}

export const PuzzleStats: React.FC<PuzzleStatsProps> = ({
  disabled = false,
  onHint,
}) => {
  const puzzle = useAppSelector((state) => state.puzzle);
  const cards = useAppSelector((state) => state.cards);

  const [expanded, setExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date();

      tomorrow.setHours(24, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();

      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);

      setTimeLeft(`${hrs}h ${mins}m`);
    };

    updateTimer();

    const timer = setInterval(updateTimer, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-2xl border border-gold text-gold bg-jade dark:bg-black/10">
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="text-gold" size={22} />
          <h2 className="text-lg font-bold">
            Puzzle Statistics
          </h2>
        </div>

        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-gold/10 p-5">  
        {/* Countdown */}

          <div className="rounded-xl border border-gold/20 p-5">
            <div className="flex items-center gap-2">
              <Clock size={18} />
              <span className="font-semibold">
                Next Puzzle
              </span>
            </div>

            <p className="mt-2 text-2xl font-bold">
              {timeLeft}
            </p>
          </div>    
         <HintPanel
            remainingHints={
              Math.max(
                0,
                cards.availableHints - cards.usedHints
              )
            }
            hintCost={25}
            rewardPenalty={15}
            disabled={disabled}
            onUseHint={onHint}
          />

          {puzzle.hintedWords.length > 0 && (
            <div className="rounded-xl border border-gold/20 p-5">
              <div className="text-sm uppercase opacity-70">
                Revealed Word
              </div>

              <p className="mt-3 text-xl font-bold tracking-[0.1em] uppercase text-jade-dark">
                {
                  puzzle.hintedWords[
                    puzzle.hintedWords.length - 1
                  ]
                }
              </p>
            </div>
          )}
            {/* Rewards */}
          <RewardPreview />

        </div>
      )}
    </div>
  );
};

export default PuzzleStats;