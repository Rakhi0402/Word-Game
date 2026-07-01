import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";

export const GameRules: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gold/20 bg-parchment/20 dark:bg-black/10">

      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="text-gold" size={22} />
          <h2 className="text-lg font-bold">
            Game Rules & Rewards
          </h2>
        </div>

        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (

        <div className="border-t border-gold/10 p-6 space-y-6">

          {/* Objective */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-green-500" size={18}/>
              <h3 className="font-semibold">
                Objective
              </h3>
            </div>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Form valid words using only the seven puzzle letters.</li>
              <li>The center letter must appear in every submitted word.</li>
              <li>Letters may be reused multiple times.</li>
              <li>Every valid word increases your score and progress.</li>
            </ul>
          </section>

          {/* Difficulty */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-500" size={18}/>
              <h3 className="font-semibold">
                Daily Challenge Completion
              </h3>
            </div>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gold/10">
                <tr>
                  <th className="p-2 text-left">Difficulty</th>
                  <th className="p-2">Target Words</th>
                </tr>
              </thead>

              <tbody>

                <tr className="border-t">

                  <td className="p-2">Easy</td>

                  <td className="text-center">10</td>

                </tr>

                <tr className="border-t">

                  <td className="p-2">Medium</td>
                  <td className="text-center">15</td>
                </tr>
                <tr className="border-t">
                  <td className="p-2">Hard</td>
                  <td className="text-center">20</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Pangram */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles
                className="text-purple-500"
                size={18}
              />
              <h3 className="font-semibold">
                Pangram Bonus
              </h3>
            </div>
            <p className="text-sm">
              A Pangram is a word that uses every puzzle
              letter at least once.
            </p>
            <p className="mt-2 text-sm">
              Every daily puzzle contains at least one
              Pangram.
            </p>
            <p className="mt-2 text-sm font-medium text-purple-500">
              Finding a Pangram grants bonus XP,
              bonus coins and achievement progress.
            </p>
          </section>

          {/* Rewards */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Trophy
                className="text-yellow-500"
                size={18}
              />
              <h3 className="font-semibold">
                Rewards
              </h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>✔ XP for every valid word</li>
              <li>✔ Coins for puzzle completion</li>
              <li>✔ Pangram bonus rewards</li>
              <li>✔ Daily streak bonus</li>
              <li>✔ Achievement progress</li>
              <li>✔ Character Card bonus multipliers</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
export default GameRules;