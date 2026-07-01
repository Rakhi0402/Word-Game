import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Sparkles,
  Trophy,
} from "lucide-react";
//import GameRulesExtra  from "./GameRulesExtra";

export const GameRules: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gold/20 bg-wood dark:bg-black/20 text-gold/100">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="text-gold" size={22} />
          <h2 className="text-lg font-bold">Game Rules & Rewards</h2>
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (
        <div className="animate-in fade-in duration-300 space-y-6 border-t border-gold/50 p-6">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Target className="text-green-500" size={18} />
              <h3 className="font-semibold">Objective</h3>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Form valid words using only the seven puzzle letters.</li>
              <li>The center letter is mandatory in every word.</li>
              <li>Letters may be reused multiple times.</li>
              <li>Every valid target word increases your score and progress.</li>
              <li>Each daily puzzle can only be completed once per user.</li>
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Target className="text-blue-500" size={18} />
              <h3 className="font-semibold">Daily Challenge Completion</h3>
            </div>

            <div className="overflow-hidden rounded-lg border border-gold/20">
              <table className="w-full text-sm">
                <thead className="bg-gold/10">
                  <tr>
                    <th className="p-2 text-left">Difficulty</th>
                    <th className="p-2 text-center">Target Words</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gold/10">
                    <td className="p-2">Easy</td>
                    <td className="text-center">10</td>
                  </tr>
                  <tr className="border-t border-gold/10">
                    <td className="p-2">Medium</td>
                    <td className="text-center">15</td>
                  </tr>
                  <tr className="border-t border-gold/10">
                    <td className="p-2">Hard</td>
                    <td className="text-center">20</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={18} />
              <h3 className="font-semibold">Pangram Bonus</h3>
            </div>
            <p className="text-sm">
              A Pangram is a word that uses all seven puzzle letters at least once.
            </p>
            <p className="mt-2 text-sm">
              Every daily puzzle contains at least one Pangram.
            </p>
            <p className="mt-2 text-sm font-medium text-purple-500">
              Finding a Pangram awards bonus XP, bonus coins, achievement progress and special rewards.
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} />
              <h3 className="font-semibold">Reward System</h3>
            </div>
            <ul className="space-y-2 text-sm">
              <li>✔ XP for every valid target word.</li>
              <li>✔ Completion rewards after reaching the daily target.</li>
              <li>✔ Pangram bonus rewards.</li>
              <li>✔ Daily streak bonus rewards.</li>
              <li>✔ Character Card bonus multipliers.</li>
              <li>✔ Achievement and badge progress.</li>
            </ul>
          </section>

          {/* <GameRulesExtra /> */}
        </div>
      )}
    </div>
  );
};

export default GameRules;