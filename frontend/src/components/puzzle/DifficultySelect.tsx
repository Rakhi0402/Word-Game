import React from 'react';
import type { PuzzleDifficulty } from '../../types';
import { DIFFICULTY_CONFIG, MAX_CHOICE_PUZZLES_PER_DAY } from '../../constants/rewards';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface DifficultySelectProps {
  onSelect: (difficulty: PuzzleDifficulty) => void;
  disabled?: boolean;
  remainingToday?: number;
  mode?: 'first' | 'extra';
  onViewDaily?: () => void;
}

const ORDER: PuzzleDifficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];

const COLORS: Record<PuzzleDifficulty, string> = {
  Easy: 'from-emerald-700 to-emerald-900',
  Medium: 'from-amber-600 to-amber-900',
  Hard: 'from-red-700 to-red-950',
  Expert: 'from-fuchsia-700 to-purple-950',
};

export const DifficultySelect: React.FC<DifficultySelectProps> = ({
  onSelect,
  disabled = false,
  remainingToday = MAX_CHOICE_PUZZLES_PER_DAY,
  mode = 'extra',
  onViewDaily,
}) => (
  <Card variant="wood" className="mx-auto max-w-2xl space-y-6 p-6">
    <div className="text-center">
      <h2 className="font-martial text-2xl font-extrabold uppercase tracking-wider text-gold">
        {mode === 'extra' ? 'Extra Trials' : 'Choose Your Trial'}
      </h2>
      <p className="mt-2 text-sm text-parchment/70">
        {mode === 'extra'
          ? `Daily scroll complete. Up to ${MAX_CHOICE_PUZZLES_PER_DAY} extra puzzles today — ${remainingToday} left.`
          : 'Pick a difficulty. Fixed base XP & coins; equipped scrolls and streaks add bonuses.'}
      </p>
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {ORDER.map((diff) => {
        const cfg = DIFFICULTY_CONFIG[diff];
        return (
          <button
            key={diff}
            type="button"
            disabled={disabled || remainingToday <= 0}
            onClick={() => onSelect(diff)}
            className={`rounded-xl border-2 border-gold/40 bg-gradient-to-br ${COLORS[diff]} p-4 text-left text-parchment shadow-lg transition hover:scale-[1.02] hover:border-gold disabled:opacity-50`}
          >
            <div className="text-lg font-black uppercase tracking-widest">{diff}</div>
            <div className="mt-2 space-y-1 text-xs text-parchment/85">
              <p>
                Target words: <strong>{cfg.targetWords}</strong>
              </p>
              <p>
                Base XP: <strong>+{cfg.baseXp}</strong>
              </p>
              <p>
                Base coins: <strong>+{cfg.baseCoins}</strong>
              </p>
            </div>
          </button>
        );
      })}
    </div>
    <p className="text-center text-[11px] text-parchment/50">
      Difficulty locks for this attempt until you complete or abandon (no rewards).
    </p>
    {onViewDaily && (
      <div className="flex justify-center">
        <Button variant="outline" onClick={onViewDaily}>
          Review today&apos;s daily
        </Button>
      </div>
    )}
  </Card>
);

export default DifficultySelect;
