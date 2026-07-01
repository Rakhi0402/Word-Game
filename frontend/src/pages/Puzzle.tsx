import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../store";
import { loadPuzzle, selectLetter, deleteLetter, clearWord, shuffleLetters } from "../store/puzzleSlice";

import { puzzleService } from "../services/puzzleService";

import { PuzzleHeader } from "../components/puzzle/puzzleHeader";
import { PuzzleInput } from "../components/puzzle/puzzleInput";
import { PuzzleStats } from "../components/puzzle/puzzleStats";
import { FoundWords } from "../components/puzzle/FoundWords";
import { GameRules } from "../components/puzzle/GameRules";
import { CompletionModal } from "../components/puzzle/CompletionModal";

import { usePuzzleKeyboard } from "../hooks/usePuzzleKeyboard";
import usePuzzleSubmission from "../hooks/usePuzzleSubmission";
import usePuzzleHints from "../hooks/usePuzzleHints";
import usePuzzleCompletion from "../hooks/usePuzzleCompletion";

export const Puzzle: React.FC = () => {
  const dispatch = useAppDispatch();
  const puzzle = useAppSelector((state) => state.puzzle);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPuzzle = async () => {
      setLoading(true);

      const response = await puzzleService.getDailyPuzzle();

      if (response.success && response.data) {
        dispatch(loadPuzzle(response.data));
      }

      setLoading(false);
    };

    fetchPuzzle();
  }, [dispatch]);

  const submission = usePuzzleSubmission();
  const hints = usePuzzleHints();
  const completion = usePuzzleCompletion();

  usePuzzleKeyboard({
    enabled: !puzzle.completed,
    validLetters: puzzle.letters,
    onLetterSelect: (letter) => dispatch(selectLetter(letter)),
    onBackspace: () => dispatch(deleteLetter()),
    onClear: () => dispatch(clearWord()),
    onSubmit: submission.handleSubmit,
    onShuffle: () => dispatch(shuffleLetters()),
    onHint: hints.handleRevealHint,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        Loading Daily Puzzle...
      </div>
    );
  }

  if (!puzzle.activePuzzleId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-3 font-bold text-red-500">
          Failed to load puzzle.
        </h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PuzzleHeader />

      <div className="grid gap-6 lg:grid-cols-12">      

        {/* Main Game */}
        <main className="lg:col-span-6">
          <PuzzleInput
            disabled={puzzle.completed}
            onSubmit={submission.handleSubmit}
            onHint={hints.handleRevealHint}
          />
        </main>
        <aside className="space-y-6 lg:col-span-6">
          <PuzzleStats
            onHint={hints.handleRevealHint}
            disabled={puzzle.completed}
          />
          <GameRules />
        </aside>
      </div>

      <FoundWords />


      <CompletionModal
        isOpen={completion.showCompletionModal}
        difficulty={puzzle.difficulty}
        wordsFound={puzzle.wordsFound.length}
        targetWords={puzzle.requiredWordsToComplete}
        pangramsFound={puzzle.pangramsFound.length}
        totalPangrams={puzzle.pangrams.length}
        score={puzzle.score}
        rewards={completion.rewards}
        onContinue={completion.closeCompletionModal}
      />
    </div>
  );
};

export default Puzzle;