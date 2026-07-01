import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import {
  clearWord,
  shuffleLetters,
  selectLetter,
} from "../../store/puzzleSlice";

import { Button } from "../ui/Button";
import { LetterWheel } from "./LetterWheel";

import {
  Trash2,
  RotateCw,
  Check,
  Info,
  Lightbulb,
} from "lucide-react";

interface PuzzleInputProps {
  disabled: boolean;
  onSubmit: (word: string) => Promise<string | boolean> | string | boolean;
  onHint: () => void;
}

export const PuzzleInput: React.FC<PuzzleInputProps> = ({
  disabled,
  onSubmit,
  onHint,
}) => {
  const dispatch = useAppDispatch();

  const puzzle = useAppSelector((state) => state.puzzle);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error" | "warning"; message: string } | null>(null);

  const handleLetterClick = (letter: string) => {
    if (disabled) return;
    setFeedback(null);
    dispatch(selectLetter(letter));
  };

  const handleSubmit = async () => {
    if (disabled || !puzzle.currentWord.trim()) return;

    const result = await onSubmit(puzzle.currentWord);

    if (result === false) {
      setFeedback({ tone: "error", message: "Already Found" });
      return;
    }

    if (typeof result === "string") {
      setFeedback({ tone: result === "valid" ? "success" : "error", message: result === "valid" ? "✓ Valid Word+10 XP" : "Already Found" });
      return;
    }

    setFeedback({ tone: "success", message: "✓ Valid Word+10 XP" });
  };

  return (
    <div className="space-y-5">

      {/* Current Word */}
      <div className={`rounded-xl border-2 p-4 text-center transition-all duration-300 ${
        puzzle.lastRejectedReason === "duplicate"
          ? "border-red-400 bg-red-500/20 shadow-[0_0_0_2px_rgba(248,113,113,0.35)] animate-pulse"
          : "border-gold bg-jade"
      }`}>
        <h3 className="text-xs uppercase tracking-widest text-parchment/70">
          Current Word
        </h3>
        <p className="mt-2 text-3xl font-black tracking-[0.4em] uppercase text-parchment">
          {puzzle.currentWord || "____"}
        </p>
      </div>

      {/* Letter Wheel */}
      <LetterWheel
        centerLetter={puzzle.centerLetter}
        outerLetters={puzzle.outerLetters}
        onLetterSelect={handleLetterClick}
        disabled={disabled}
      />

      {/* Controls */}
      <div className="flex flex-wrap justify-center gap-3">

    {/* Clear */}

    <div className="group relative">
      <Button
        variant="danger"
        disabled={disabled}
        onClick={() => dispatch(clearWord())}
      >
        <Trash2 className="h-5 w-5" />
      </Button>

      <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
        <div className="font-semibold">Clear Word</div>
        <div className="mt-1 text-gold">
          Shortcut: <kbd className="rounded bg-black/20 px-1">Esc</kbd>
        </div>
      </div>
    </div>

    {/* Shuffle */}

    <div className="group relative ">
      <Button
        variant="primary"
        disabled={disabled}
        onClick={() => dispatch(shuffleLetters())}
      >
        <RotateCw className="h-5 w-5" />
      </Button>

      <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
        <div className="font-semibold">Shuffle Letters</div>
        <div className="mt-1 text-gold">
          Shortcut: <kbd className="rounded bg-black/20 px-1">R</kbd>
        </div>
      </div>
    </div>

    {/* Hint */}

    <div className="group relative">
      <Button
        variant="secondary"
        disabled={disabled}
        onClick={() => {
          setFeedback(null);
          onHint();
        }}
      >
        <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
        Hint
      </Button>

      <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
        <div className="font-semibold">Reveal Hint</div>
        <div className="mt-1 text-gold">
          Shortcut: <kbd className="rounded bg-black/20 px-1">H</kbd>
        </div>
      </div>
    </div>

    {/* Submit */}

    <div className="group relative">
      <Button
        variant="primary"
        disabled={disabled}
        onClick={handleSubmit}
        className="px-8"
      >
        <Check className="mr-2 h-5 w-5" />
        Submit
      </Button>

      <div className="pointer-events-none absolute -top-16 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-gold/20 bg-jade px-3 py-2 text-xs text-parchment shadow-lg group-hover:block">
        <div className="font-semibold">Submit Word</div>
        <div className="mt-1 text-gold">
          Shortcut: <kbd className="rounded bg-black/20 px-1">Enter</kbd>
        </div>
      </div>
    </div>

    </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-300 ${
            feedback.tone === "success"
              ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300"
              : feedback.tone === "warning"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
          } ${feedback.message === "Already Found" ? "animate-pulse" : ""}`}
        >
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 rounded-lg border border-gold/15 bg-jade/55 px-4 py-2 text-xs text-white dark:text-gray-300">
      <Info size={14} className="text-gold" />
      <span>
        Click letters or use your keyboard (A–Z). Hover over the controls to see their keyboard shortcuts.
      </span>
    </div>

      {/* Completed Banner */}
      {disabled && (
        <div className="rounded-xl border border-green-500 bg-green-100 p-4 text-center dark:bg-green-900/20">
          <h4 className="font-bold text-green-700 dark:text-green-300">
            ✅ Daily Puzzle Completed
          </h4>
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">
            Come back tomorrow for the next challenge.
          </p>
        </div>
      )}

    </div>
  );
};