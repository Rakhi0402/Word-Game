import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchDashboard } from '../store/dashboardSlice';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { CHARACTER_CARDS, BELT_LEVELS } from '../constants';
import { Trophy, Star, Sparkles, BookOpen, Flame, Award } from 'lucide-react';

export const Home: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const dashboard = useAppSelector((s) => s.dashboard);
  const user = useAppSelector((s) => s.user);
  const cards = useAppSelector((s) => s.cards);

  useEffect(() => {
    // Force once on Home so a newly assigned daily puzzle is visible after DB bootstrap.
    void dispatch(fetchDashboard({ force: true }));
    // Warm IDB: daily puzzle + difficulty pools (Spelling Bee–style local play).
    void import('../services/puzzleService').then(({ puzzleService }) => {
      void puzzleService.getDailyPuzzle({ force: true }).catch(() => undefined);
      for (const d of ['Easy', 'Medium', 'Hard', 'Expert'] as const) {
        void puzzleService.warmPuzzlePool(d).catch(() => undefined);
      }
    });
  }, [dispatch]);

  const data = dashboard.data;
  const training = data?.training;
  const streak = data?.streak;
  const stats = data?.statistics ?? user.stats;
  const active = data?.activeCard;
  const daily = data?.dailyQuest;

  const equippedCard =
    (active && {
      id: active.cardId,
      name: active.name,
      image: active.image || CHARACTER_CARDS.find((c) => c.id === active.cardId)?.image || '',
      stars: active.stars,
      bonuses: active.bonuses || [],
    }) ||
    CHARACTER_CARDS.find((c) => c.id === cards.equippedCardId) ||
    CHARACTER_CARDS[0];

  const beltName = training?.belt || user.belt;
  const activeBelt = BELT_LEVELS.find((b) => b.belt === beltName) || BELT_LEVELS[0];
  const xpProgress = training?.xpProgress ?? 0;
  const xpSpan = Math.max(
    1,
    (training?.xpForNextBelt ?? user.xpNeeded) - (training?.xpForCurrentBelt ?? 0)
  );
  const achievementsCount =
    data?.achievementsUnlocked ??
    data?.statistics.achievementsEarned ??
    0;

  if (dashboard.loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-parchment/70">
        Loading dojo dashboard…
      </div>
    );
  }

  if (dashboard.error && !data) {
    return (
      <div className="space-y-4 rounded-xl border border-red-400/40 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-200">{dashboard.error}</p>
        <Button variant="primary" onClick={() => void dispatch(fetchDashboard())}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h2 className="text-3xl font-extrabold text-black text-gold-glow dark:text-gold uppercase font-martial tracking-wider">
            Dojo Dashboard
          </h2>
          <p className="text-sm text-jade-dark/80 dark:text-parchment/70 font-medium">
            Welcome back,{' '}
            <span className="font-bold text-black text-gold-glow">
              {(data?.profile.userName || user.username).toUpperCase()}
            </span>
            . Sharpen your mind for today&apos;s words.
          </p>
        </div>
        <div className="flex items-center space-x-2 rounded-xl bg-gold/10 border border-black/80 tpx-3 py-1.5 text-xs text-black text-gold-glow dark:text-gold dark:border-gold/80 animate-lantern">
          <Flame className="h-4 w-4 fill-gold" />
          <span className="font-bold uppercase tracking-wider">
            {streak?.current ?? user.dailyStreak ?? user.streak} Day Streak
            {(streak?.streakShields ?? user.streakShields) > 0
              ? ` · ${streak?.streakShields ?? user.streakShields} Shields`
              : ''}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="wood" className="md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-gold/20 pb-3 mb-4">
              <h3 className="text-lg font-bold tracking-widest text-gold uppercase font-martial flex items-center gap-2">
                <Award className="h-5 w-5" /> Training Rank
              </h3>
              <span className={`px-3 py-0.5 rounded text-xs font-extrabold tracking-widest ${activeBelt.colorClass}`}>
                {beltName} Belt
              </span>
            </div>

            <p className="text-sm font-semibold text-parchment/90 mb-1">
              Current Rank:{' '}
              <span className="text-gold text-gold-glow font-bold">
                {training?.rank || user.rank}
              </span>
            </p>
            <p className="text-xs text-parchment/60 mb-6">
              Advance your training by finding words in Daily Scroll Quests.
            </p>

            <ProgressBar
              value={xpProgress}
              max={xpSpan}
              label="XP Progress to Next Belt"
              color="gold"
              className="text-parchment"
            />
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-parchment/50 font-mono border-t border-gold/15 pt-4">
            <span>Dojo Level: {training?.dojoLevel ?? BELT_LEVELS.findIndex((b) => b.belt === beltName) + 1}</span>
            <span>Total XP Earned: {training?.xp ?? user.xp}</span>
          </div>
        </Card>

        <Card variant="jade" className="flex flex-col items-center text-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-gold uppercase border-b border-gold/20 pb-2 w-full mb-4 font-martial">
              Active Partner
            </h3>

            <img
              src={equippedCard.image}
              alt={equippedCard.name}
              className="h-32 w-28 object-cover rounded-xl border-2 border-gold shadow-lg bg-jade-dark mx-auto transform hover:scale-105 transition-transform"
            />

            <h4 className="font-extrabold text-gold text-gold-glow mt-3 text-sm tracking-wider uppercase font-martial">
              {equippedCard.name}
            </h4>

            <div className="flex justify-center space-x-0.5 my-1 text-gold">
              {Array.from({ length: equippedCard.stars }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-gold" />
              ))}
            </div>

            <div className="mt-3 space-y-1 text-left">
              {equippedCard.bonuses.map((bonus, idx) => (
                <p
                  key={idx}
                  className="rounded border border-gold/10 bg-jade-dark/50 px-2 py-1 text-[10px] font-medium text-parchment/90"
                >
                  {bonus}
                </p>
              ))}
              {(active || cards.equippedCardId) && (
                <p className="rounded border border-gold/20 px-2 py-1 text-[10px] font-bold text-gold">
                  Charges:{' '}
                  {active?.chargesRemaining ??
                    (cards.equippedCardId && cards.inventory[cards.equippedCardId]?.chargesRemaining) ??
                    0}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => navigate('/collection')}
            className="mt-5"
          >
            Change Card
          </Button>
        </Card>
      </div>

      <Card variant="parchment" className="border border-gold/30 shadow-xl overflow-hidden relative">
        <div className="absolute right-[-20px] bottom-[-20px] text-8xl opacity-15 rotate-12 select-none">
          📜
        </div>
        <div className="flex flex-col justify-between items-center gap-4 sm:flex-row">
          <div className="space-y-1.5 text-center sm:text-left">
            <Badge rarity="legendary" className="mb-2">
              Daily Quest
            </Badge>
            <h3 className="text-xl font-extrabold text-gold-dark dark:text-gold uppercase tracking-widest font-martial">
              Dragon Scroll Anagram
            </h3>
            <p className="text-xs text-jade-dark/70 dark:text-parchment/70 max-w-lg leading-relaxed">
              {daily?.completed
                ? 'Today’s featured quest is complete. Great work, warrior.'
                : daily?.available === false && !daily?.puzzleId
                  ? 'Today’s scroll is not ready yet. Check back soon.'
                  : 'Unlock the secrets of today’s letter scroll. Assemble hidden words from the wheel to earn XP, gold coins, and unlock legendary characters!'}
              {daily?.difficulty ? ` · ${daily.difficulty}` : ''}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/puzzle')}
            className="shrink-0 animate-lantern 8s ease-in-out infinite"
            disabled={daily?.completed === true}
          >
            {daily?.completed
              ? 'Completed'
              : daily?.available === false && !daily?.puzzleId
                ? 'Prepare Quest ➔'
                : 'Enter Quest ➔'}
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Words Decoded', value: stats.wordsFound, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Scrolls Collected', value: stats.cardsCollected, icon: Sparkles, color: 'text-purple-500' },
          { label: 'Achievements', value: achievementsCount, icon: Trophy, color: 'text-gold' },
          { label: 'Highest Word Score', value: stats.highestScore, icon: Star, color: 'text-amber-500' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              variant="jade"
              className="flex flex-col items-center justify-center p-4 text-center border border-gold/15"
            >
              <Icon className={`h-6 w-6 mb-2 ${stat.color}`} />
              <span className="text-2xl font-extrabold text-white dark:text-parchment tracking-wider">
                {stat.value}
              </span>
              <span className="text-[10px] font-bold text-white/60 dark:text-parchment/60 uppercase tracking-widest mt-1">
                {stat.label}
              </span>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
