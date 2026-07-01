import React from "react";
import { CheckCircle2, Sparkles, Share2 } from "lucide-react";
import { Button } from "../ui/Button";
import { RewardSummary } from "./RewardSummary";
import type { RewardCalculation } from "../../hooks/rewardCalculator";

interface CompletionModalProps {
  isOpen: boolean;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  wordsFound: number;
  targetWords: number;
  pangramsFound: number;
  totalPangrams: number;
  score: number;
  rewards: RewardCalculation | null;
  onContinue: () => void;
  onShare?: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  difficulty,
  wordsFound,
  targetWords,
  pangramsFound,
  totalPangrams,
  score,
  rewards,
  onContinue,
  onShare,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="text-center">
          <CheckCircle2
            className="mx-auto text-green-500"
            size={60}
          />

          <h2 className="mt-4 text-3xl font-bold">
            Daily Puzzle Complete!
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Congratulations! Your rewards have been calculated.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div className="rounded-lg border border-gold/20 p-4 text-center">
            <p className="text-xs uppercase text-gray-500">
              Difficulty
            </p>
            <p className="mt-2 text-xl font-bold">
              {difficulty}
            </p>
          </div>

          <div className="rounded-lg border border-gold/20 p-4 text-center">
            <p className="text-xs uppercase text-gray-500">
              Score
            </p>
            <p className="mt-2 text-xl font-bold">
              {score}
            </p>
          </div>

          <div className="rounded-lg border border-gold/20 p-4 text-center">
            <p className="text-xs uppercase text-gray-500">
              Words Found
            </p>
            <p className="mt-2 text-xl font-bold">
              {wordsFound}/{targetWords}
            </p>
          </div>

          <div className="rounded-lg border border-gold/20 p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Sparkles
                size={18}
                className="text-purple-500"
              />
              <span className="text-xs uppercase text-gray-500">
                Pangrams
              </span>
            </div>

            <p className="mt-2 text-xl font-bold">
              {pangramsFound}/{totalPangrams}
            </p>
          </div>
        </div>

        {rewards && (
          <div className="mt-6">
            <RewardSummary
              xp={rewards.xp}
              coins={rewards.coins}
              pangramBonus={rewards.pangramBonus}
              streakBonus={rewards.streakBonus}
              characterBonus={rewards.characterBonus}
              achievement={rewards.achievement}
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">

          {onShare && (
            <Button
              variant="outline"
              onClick={onShare}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          <Button
            variant="primary"
            onClick={onContinue}
          >
            Continue
          </Button>

        </div>
      </div>
    </div>
  );
};

export default CompletionModal;