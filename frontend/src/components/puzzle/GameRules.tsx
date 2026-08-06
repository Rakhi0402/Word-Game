import React from 'react';
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Target,
  Sparkles,
  Trophy,
  Shield,
  Lightbulb,
} from 'lucide-react';
import {
  DIFFICULTY_CONFIG,
  HINT_COST_COINS,
  HINT_XP_PENALTY_PERCENT,
  FREE_DAILY_HINTS,
  CHEST_DRAW_COST,
  BELT_PROGRESSION,
  STAR_TIER_REWARDS,
  PANGRAM_BONUS_XP,
  DAY_STREAK_XP_PER,
  MAX_PAID_HINTS_PER_PUZZLE,
} from '../../constants/rewards';

export const GameRules: React.FC<{
  expanded: boolean;
  onToggle: () => void;
}> = ({ expanded, onToggle }) => {
  return (
    <div className="rounded-xl border border-gold bg-wood text-gold/100 dark:bg-black/20">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="text-gold" size={22} />
          <h2 className="text-lg font-bold">Game Rules & Rewards</h2>
        </div>
        {expanded ? <ChevronUp /> : <ChevronDown />}
      </button>

      {expanded && (
        <div
          className="max-h-72 animate-in fade-in space-y-6 overflow-y-auto border-t border-gold/50 p-6 duration-300 [scrollbar-width:thin scrollbar-color:gold/30]"
          ref={(el) => {
            if (!el) return;
            // #region agent log
            fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Debug-Session-Id': '156feb',
              },
              body: JSON.stringify({
                sessionId: '156feb',
                runId: 'ui-fix',
                hypothesisId: 'H3',
                location: 'GameRules.tsx:panel',
                message: 'rules panel scroll metrics',
                data: {
                  clientHeight: el.clientHeight,
                  scrollHeight: el.scrollHeight,
                  overflowY: el.scrollHeight > el.clientHeight,
                },
                timestamp: Date.now(),
              }),
            }).catch(() => {});
            // #endregion
          }}
        >          <section>
            <div className="mb-2 flex items-center gap-2">
              <Target className="text-green-500" size={18} />
              <h3 className="font-semibold">Choose difficulty</h3>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>
                One scheduled daily scroll first each day (difficulty comes from the rotation /
                schedule), then up to 5 extra puzzles at a difficulty you choose.
              </li>
              <li>Words ≥4 letters, must use the center letter; letters are reusable.</li>
              <li>Harder tiers need more target words and pay higher fixed base XP/coins.</li>
            </ul>
            <div className="mt-3 overflow-hidden rounded-lg border border-gold/20">
              <table className="w-full text-sm">
                <thead className="bg-gold/10">
                  <tr>
                    <th className="p-2 text-left">Difficulty</th>
                    <th className="p-2 text-center">Target</th>
                    <th className="p-2 text-center">Base XP</th>
                    <th className="p-2 text-center">Base coins</th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(DIFFICULTY_CONFIG) as (keyof typeof DIFFICULTY_CONFIG)[]).map(
                    (diff) => (
                      <tr key={diff} className="border-t border-gold/10">
                        <td className="p-2">{diff}</td>
                        <td className="text-center">{DIFFICULTY_CONFIG[diff].targetWords}</td>
                        <td className="text-center">{DIFFICULTY_CONFIG[diff].baseXp}</td>
                        <td className="text-center">{DIFFICULTY_CONFIG[diff].baseCoins}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={18} />
              <h3 className="font-semibold">Score & complete</h3>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Score: 4→1, 5→5, 6+→length, pangram +7; word streak extras from the 3rd valid word.</li>
              <li>
                Completion settles fixed base + pangrams (+{PANGRAM_BONUS_XP} XP each) + day streak (+
                {DAY_STREAK_XP_PER} XP/day, cap 14) + star-tier % of base − hint penalty.
              </li>
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="text-yellow-500" size={18} />
              <h3 className="font-semibold">Hints</h3>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>{FREE_DAILY_HINTS} free hints per day (+1 while a 4★+ card is equipped).</li>
              <li>
                Buy more anytime for {HINT_COST_COINS} coins (soft cap {MAX_PAID_HINTS_PER_PUZZLE}{' '}
                paid / puzzle).
              </li>
              <li>
                Any hint used → −{HINT_XP_PENALTY_PERCENT}% of completion XP (coins package untouched).
              </li>
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="text-cyan-500" size={18} />
              <h3 className="font-semibold">Cards (star-tier)</h3>
            </div>
            <p className="mb-2 text-sm">Same stars = same rewards. Chest cost: {CHEST_DRAW_COST} coins.</p>
            <div className="overflow-hidden rounded-lg border border-gold/20">
              <table className="w-full text-xs">
                <thead className="bg-gold/10">
                  <tr>
                    <th className="p-2 text-left">★</th>
                    <th className="p-2 text-center">XP%</th>
                    <th className="p-2 text-center">Coin%</th>
                    <th className="p-2 text-center">Charges</th>
                    <th className="p-2 text-center">Shields</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(STAR_TIER_REWARDS).map((t) => (
                    <tr key={t.stars} className="border-t border-gold/10">
                      <td className="p-2">{t.stars}</td>
                      <td className="text-center">+{Math.round(t.xpBonus * 100)}%</td>
                      <td className="text-center">+{Math.round(t.coinBonus * 100)}%</td>
                      <td className="text-center">{t.charges}</td>
                      <td className="text-center">{t.streakShieldsOnEquip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm">
              Completing a puzzle spends 1 charge. At 0 → Spent Scroll until chest restore or streak
              milestone refill.
            </p>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Shield className="text-orange-500" size={18} />
              <h3 className="font-semibold">Day Streak & Shields</h3>
            </div>
            <ul className="ml-6 list-disc space-y-1 text-sm">
              <li>Day streak = consecutive calendar days with a completed puzzle.</li>
              <li>Streak Shields cover a missed day (not invalid words). Cap held at 5.</li>
              <li>Milestones at 3 / 7 / 14 / 30 days grant coins and card charge refills.</li>
            </ul>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={18} />
              <h3 className="font-semibold">Belts</h3>
            </div>
            <div className="overflow-hidden rounded-lg border border-gold/20">
              <table className="w-full text-xs">
                <thead className="bg-gold/10">
                  <tr>
                    <th className="p-2 text-left">Belt</th>
                    <th className="p-2 text-center">Min XP</th>
                    <th className="p-2 text-left">Rank-up</th>
                  </tr>
                </thead>
                <tbody>
                  {BELT_PROGRESSION.filter((b) => b.minXp > 0).map((b) => (
                    <tr key={b.belt} className="border-t border-gold/10">
                      <td className="p-2">{b.belt}</td>
                      <td className="text-center">{b.minXp}</td>
                      <td className="p-2">
                        +{b.rankUpCoins}c · {b.rankUpPerk}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default GameRules;
