import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react';
import { useAppSelector } from '../../store';
import HintPanel from './HintPanel';
import RewardPreview from './RewardPreview';
import { HINT_COST_COINS, HINT_XP_PENALTY_PERCENT } from '../../constants/rewards';
import usePuzzleHints from '../../hooks/usePuzzleHints';

interface PuzzleStatsProps {
  disabled?: boolean;
  onHint: () => void;
  expanded: boolean;
  onToggle: () => void;
}

const PANEL_MAX_H = 'max-h-72';

export const PuzzleStats: React.FC<PuzzleStatsProps> = ({
  disabled = false,
  onHint,
  expanded,
  onToggle,
}) => {
  const puzzle = useAppSelector((state) => state.puzzle);
  const hints = usePuzzleHints();

  return (
    <div className="rounded-2xl border border-gold bg-jade text-gold dark:bg-black/10">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="text-gold" size={22} />
          <h2 className="text-lg font-bold">Puzzle Statistics</h2>
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (
        <div
          className={`${PANEL_MAX_H} space-y-5 overflow-y-auto border-t border-gold/10 p-5 [scrollbar-width:thin scrollbar-color:gold/30]`}
        >
          <HintPanel
            remainingHints={hints.remainingHints}
            hintCost={HINT_COST_COINS}
            rewardPenalty={HINT_XP_PENALTY_PERCENT}
            canPay={hints.canPay}
            disabled={disabled || !hints.canHint}
            onUseHint={onHint}
          />

          {puzzle.hintedWords.length > 0 && (
            <div className="rounded-xl border border-gold/20 p-5">
              <div className="text-sm uppercase opacity-70">Revealed Word</div>
              <p className="mt-3 text-xl font-bold uppercase tracking-[0.1em] text-parchment">
                {puzzle.hintedWords[puzzle.hintedWords.length - 1]}
              </p>
            </div>
          )}

          <RewardPreview />
        </div>
      )}
    </div>
  );
};

export default PuzzleStats;
