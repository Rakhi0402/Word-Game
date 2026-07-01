import React from "react";
import { Award, Flame, Trophy, Sparkles } from "lucide-react";
import { useAppSelector } from "../../store";
import { Card } from "../ui/Card";

export const PuzzleHeader: React.FC = () => {
  const puzzle = useAppSelector((state) => state.puzzle);

  const completion =
    (puzzle.wordsFound.length /
      (puzzle.requiredWordsToComplete || 1)) *
    100;

  const difficultyColor = {
    Easy: "bg-green-600",
    Medium: "bg-yellow-500",
    Hard: "bg-red-600",
    Expert: "bg-fuchsia-600",
  }[puzzle.difficulty];

  return (
    <div className="space-y-4">

      {/* Difficulty + Daily Goal */}
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black text-gold-glow dark:text-gold Uppercase font-martial tracking-wider">
            Daily Puzzle
          </h1>
          <p className="text-sm text-jade-400">
            Goal: {puzzle.wordsFound.length} /{" "}
            {puzzle.requiredWordsToComplete} Words
          </p>
        </div>
        <span
          className={`${difficultyColor} text-white px-4 py-2 rounded-full font-semibold`}
        >
          {puzzle.difficulty}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full bg-white rounded-full h-3">
        <div
          className="bg-gold h-3 rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(completion, 100)}%`,
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
        <Card className="text-center p-3 border-gold/50 ">
          <Award className="mx-auto mb-2 text-yellow-400" />
          <p className="text-xl font-bold">
            {puzzle.score}
          </p>
          <p className="text-xs uppercase">
            Score
          </p>
        </Card>
        <Card className="text-center p-3 border-gold/50">
          <Flame className="mx-auto mb-2 text-orange-500" />
          <p className="text-xl font-bold">
            {puzzle.streak}
          </p>

          <p className="text-xs uppercase">
            Streak
          </p>

        </Card>

        <Card className="text-center p-3 border-gold/50">

          <Trophy className="mx-auto mb-2 text-green-500" />

          <p className="text-xl font-bold">
            {Math.round(completion)}%
          </p>

          <p className="text-xs uppercase">
            Complete
          </p>

        </Card>

        <Card className="text-center p-3 border-gold/50">
          <Sparkles className="mx-auto mb-2 text-purple-500" />
          <p className="text-xl font-bold">
            {puzzle.pangramsFound.length}/
            {puzzle.pangrams.length}
          </p>
          <p className="text-xs uppercase">
            Pangrams
          </p>
        </Card>
      </div>
    </div>
  );
};