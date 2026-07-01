import React from "react";
import { LetterWheelCanvas } from "./LetterWheelCanvas";

interface LetterWheelProps {
  centerLetter: string;
  outerLetters: string[];
  disabled?: boolean;
  onLetterSelect: (letter: string) => void;
}

export const LetterWheel: React.FC<LetterWheelProps> = ({
  centerLetter,
  outerLetters,
  disabled = false,
  onLetterSelect,
}) => {
  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          relative
          rounded-full
          border
          border-gold/20
          bg-parchment/30
          dark:bg-black/10
          backdrop-blur-sm
          p-3
          transition-all
          duration-300
          ${disabled ? "opacity-70" : "shadow-lg hover:shadow-xl"}
        `}
      >
        <LetterWheelCanvas
          centerLetter={centerLetter}
          outerLetters={outerLetters}
          disabled={disabled}
          onLetterSelect={onLetterSelect}
        />

        {!disabled && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-jade px-3 py-1 text-xs font-medium text-parchment shadow">
            Click or Type
          </div>
        )}

        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
            <div className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              ✓ Puzzle Completed
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LetterWheel;