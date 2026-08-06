import React from "react";
import { LetterWheelCanvas } from "./LetterWheelCanvas";

interface LetterWheelProps {
  centerLetter: string;
  outerLetters: string[];
  /** True only when the puzzle itself is completed/locked. */
  disabled?: boolean;
  /** True when current word is at max length (puzzle still playable). */
  maxLengthReached?: boolean;
  onLetterSelect: (letter: string) => void;
}

export const LetterWheel: React.FC<LetterWheelProps> = ({
  centerLetter,
  outerLetters,
  disabled = false,
  maxLengthReached = false,
  onLetterSelect,
}) => {
  const lettersBlocked = disabled || maxLengthReached;
  const overlayKind = disabled
    ? "completed"
    : maxLengthReached
      ? "maxLength"
      : "none";

  // #region agent log
  fetch("http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "156feb",
    },
    body: JSON.stringify({
      sessionId: "156feb",
      runId: "post-fix",
      hypothesisId: "H1",
      location: "LetterWheel.tsx:render",
      message: "LetterWheel overlay kind",
      data: { disabled, maxLengthReached, lettersBlocked, overlayKind },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
          ${lettersBlocked ? "opacity-70" : "shadow-lg hover:shadow-xl"}
        `}
      >
        <LetterWheelCanvas
          centerLetter={centerLetter}
          outerLetters={outerLetters}
          disabled={lettersBlocked}
          onLetterSelect={onLetterSelect}
        />

        {!lettersBlocked && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-jade px-3 py-1 text-xs font-medium text-parchment shadow">
            Click or Type
          </div>
        )}

        {overlayKind === "completed" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
            <div className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-lg">
              ✓ Puzzle Completed
            </div>
          </div>
        )}

        {overlayKind === "maxLength" && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/20">
            <div className="max-w-[11rem] rounded-lg bg-amber-700 px-3 py-2 text-center text-sm font-semibold text-white shadow-lg">
              Max word length exceeded
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LetterWheel;
