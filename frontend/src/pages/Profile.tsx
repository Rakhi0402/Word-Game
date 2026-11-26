import React, { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchProfile } from '../store/profileSlice';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CHARACTER_CARDS, BELT_LEVELS, DEFAULT_ACHIEVEMENTS } from '../constants';
import { playerAvatarUrl } from '../utils/playerAvatar';
import {
  Zap,
  Scroll,
  Sparkles,
  Flame,
  Shield,
  Trophy,
  Award,
  Calendar,
  BookOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user);
  const auth = useAppSelector((state) => state.auth);
  const cards = useAppSelector((state) => state.cards);
  const achievementsState = useAppSelector((state) => state.achievements);
  const profile = useAppSelector((state) => state.profile);
  const displayAchievements =
    achievementsState.achievements.length > 0
      ? achievementsState.achievements
      : DEFAULT_ACHIEVEMENTS;
  const completedAchievements = displayAchievements.filter((a) => a.unlocked).length;

  useEffect(() => {
    void dispatch(fetchProfile({ force: true }));
  }, [dispatch]);

  const data = profile.data;
  const progression = data?.progression;
  const streak = data?.streak;
  const stats = data?.statistics ?? user.stats;

  const equippedCardId = data?.equippedCard?.id ?? cards.equippedCardId;
  const equippedCard =
    CHARACTER_CARDS.find((c) => c.id === equippedCardId) || CHARACTER_CARDS[0];
  const profileAvatar = playerAvatarUrl(
    data?.user.id ?? auth.user?.userId,
    data?.user.userName ?? user.username
  );
  const beltName = progression?.belt || user.belt;
  const activeBelt = BELT_LEVELS.find((b) => b.belt === beltName) || BELT_LEVELS[0];
  const [isStreakCalendarOpen, setIsStreakCalendarOpen] = useState(true);
  const equippedCharges =
    data?.equippedCard?.chargesRemaining ??
    (equippedCardId ? cards.inventory[equippedCardId]?.chargesRemaining : null);

  const xpProgress = progression?.xpProgress ?? 0;
  const xpSpan = Math.max(
    1,
    (progression?.xpForNextBelt ?? user.xpNeeded) - (progression?.xpForCurrentBelt ?? 0)
  );
  const displayXp = progression?.xp ?? user.xp;
  const displayRank = progression?.rank ?? user.rank;
  const displayUsername = data?.user.userName ?? user.username;
  const dailyStreak = streak?.daily ?? user.dailyStreak ?? user.streak;
  const currentStreak = streak?.current ?? user.streak;
  const streakShields = streak?.shields ?? user.streakShields;
  const dojoLevel = progression?.dojoLevel ?? BELT_LEVELS.findIndex((b) => b.belt === beltName) + 1;

  const trainingDaySet = useMemo(() => {
    const set = new Set(streak?.recentTrainingDays ?? []);
    if (streak?.lastCompletedDate) set.add(streak.lastCompletedDate);
    return set;
  }, [streak?.recentTrainingDays, streak?.lastCompletedDate]);

  /** Full calendar month — every day of the current month. */
  const monthCalendar = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay(); // 0=Sun
    const blanks = Array.from({ length: firstWeekday }, (_, i) => ({
      key: `blank-${i}`,
      blank: true as const,
    }));
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNumber = i + 1;
      const date = new Date(year, month, dayNumber);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
      return {
        key,
        blank: false as const,
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        dayNumber,
        isToday: dayNumber === now.getDate(),
        isActive: trainingDaySet.has(key),
      };
    });
    return {
      title: now.toLocaleDateString('en', { month: 'long', year: 'numeric' }),
      cells: [...blanks, ...days],
    };
  }, [trainingDaySet]);

  const renderAchievementIcon = (iconName: string) => {
    const iconProps = { className: 'h-6 w-6 text-gold' };
    switch (iconName) {
      case 'Zap':
        return <Zap {...iconProps} />;
      case 'Scroll':
        return <Scroll {...iconProps} />;
      case 'Sparkles':
        return <Sparkles {...iconProps} />;
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'Shield':
        return <Shield {...iconProps} />;
      default:
        return <Award {...iconProps} />;
    }
  };

  if (profile.loading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-parchment/70">
        Loading disciple profile…
      </div>
    );
  }

  if (profile.error && !data) {
    return (
      <div className="space-y-4 rounded-xl border border-red-400/40 bg-red-950/30 p-6 text-center">
        <p className="text-sm text-red-200">{profile.error}</p>
        <Button variant="primary" onClick={() => void dispatch(fetchProfile())}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gold/25 pb-4">
        <h2 className="text-3xl font-extrabold text-black text-gold-glow  dark:text-[#f7d36b] drop-shadow-[0_0_8px_rgba(92,58,33,0.2)] dark:drop-shadow-[0_0_10px_rgba(247,211,107,0.35)] uppercase font-martial tracking-wider">
          Disciple Profile
        </h2>
        <p className="mt-1 text-sm text-jade-dark/70 dark:text-parchment font-semibold">
          Review your training progress, achievements, and belt advancement.
        </p>
      </div>

      <Card variant="wood" className="flex items-start gap-8 p-6">
        <div className="relative shrink-0">
          <img
            src={profileAvatar}
            alt={displayUsername}
            className="h-[170px] w-[170px] rounded-full object-cover border-[3px] border-gold shadow-lg"
          />

          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gold text-jade-dark text-[10px] font-black uppercase px-4 py-1 rounded-full">
            Disciple
          </span>

          {equippedCard && (
            <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-wider text-gold/80">
              Partner: {equippedCard.name}
              {equippedCharges != null ? ` · ${equippedCharges} charges` : ''}
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <h2 className="text-5xl font-black uppercase text-gold leading-none">
            {displayUsername}
          </h2>

          <p className="mt-2 text-sm uppercase text-parchment/70">
            Rank: {displayRank}
          </p>

          <div className="flex items-center gap-4 mt-5">
            <span
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase ${activeBelt.colorClass}`}
            >
              {beltName} Belt
            </span>

            <span className="px-5 py-2 rounded-full bg-jade-dark/70 border border-gold/20 text-sm">
              ⚡ Chi Level: {dojoLevel}
            </span>

            <span className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/20 px-5 py-2 text-xs font-bold text-gold">
              <Shield className="h-4 w-4" />
              {streakShields} Shields
            </span>
          </div>

          <div className="mt-8 w-full">
            <ProgressBar
              value={xpProgress}
              max={xpSpan}
              label={`Chi Experience (XP) · ${displayXp}`}
              color="gold"
            />
          </div>
        </div>
      </Card>

      <Card variant="glass" className="border border-gold/40 p-8">
        <button
          type="button"
          onClick={() => setIsStreakCalendarOpen((prev) => !prev)}
          className="w-full text-left"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gold/15 p-2">
                <Flame className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-jade-dark/60 dark:text-parchment/60">
                  Daily Streak
                </p>
                <p className="text-2xl font-black text-jade-dark dark:text-parchment">
                  {dailyStreak} Day
                  {dailyStreak === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-jade-dark/60 dark:text-parchment/60">
                  Shields: {streakShields}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold">
              {isStreakCalendarOpen ? 'Hide Calendar' : 'Open Calendar'}
            </span>
          </div>
        </button>

        {isStreakCalendarOpen && (
          <div className="mt-4 rounded-2xl border border-gold/20 bg-jade-dark/5 p-4 dark:bg-black/10">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-jade-dark/60 dark:text-parchment/60">
                  {monthCalendar.title}
                </p>
                <p className="text-sm font-semibold text-jade-dark/80 dark:text-parchment/80">
                  {trainingDaySet.size > 0
                    ? 'Gold days mark recorded training from the dojo server.'
                    : 'Complete a quest to light up training days on this calendar.'}
                </p>
              </div>
              <div className="rounded-full bg-gold/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-gold">
                {currentStreak}x
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-jade-dark/50 dark:text-parchment/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthCalendar.cells.map((day) =>
                day.blank ? (
                  <div key={day.key} className="h-9" />
                ) : (
                  <div
                    key={day.key}
                    title={day.key}
                    className={`flex h-9 w-full items-center justify-center rounded-lg border text-sm font-black ${
                      day.isActive
                        ? 'border-gold bg-gold text-jade-dark shadow-[0_0_12px_rgba(247,211,107,0.35)]'
                        : day.isToday
                          ? 'border-gold/60 bg-gold/15 text-jade-dark dark:text-parchment'
                          : 'border-gold/15 bg-white/55 text-jade-dark/50 dark:bg-black/20 dark:text-parchment/40'
                    }`}
                  >
                    {day.dayNumber}
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </Card>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Words Found', value: stats.wordsFound, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Scrolls Unlocked', value: stats.cardsCollected, icon: Sparkles, color: 'text-purple-500' },
          { label: 'Medals Earned', value: completedAchievements, icon: Trophy, color: 'text-gold' },
          { label: 'Puzzles Completed', value: stats.puzzlesCompleted, icon: Calendar, color: 'text-emerald-500' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} variant="wood" className="flex flex-col items-center justify-center p-4 text-center border border-gold/45">
              <Icon className={`h-6 w-6 mb-2 ${stat.color}`} />
              <span className="text-2xl font-black text-white dark:text-parchment tracking-wider">{stat.value}</span>
              <span className="text-[10px] font-bold text-white dark:text-parchment/60 uppercase tracking-widest mt-1">
                {stat.label}
              </span>
            </Card>
          );
        })}
      </div>

      <Card variant="glass" className="border border-gold/25 shadow-xl">
        <div className="border-b border-gold/25 pb-3 mb-5 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gold-dark dark:text-gold uppercase tracking-wider font-martial flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" /> Sacred Medals (Achievements)
          </h3>
          <span className="text-xs text-jade-dark/60 dark:text-parchment/60 font-semibold uppercase">
            Completed:{' '}
            <span className="text-gold font-bold font-mono">
              {completedAchievements} / {displayAchievements.length}
            </span>
          </span>
        </div>

        <div className="space-y-4">
          {displayAchievements.length === 0 && (
            <p className="text-sm text-jade-dark/60 dark:text-parchment/60 text-center py-4">
              No achievement definitions returned from the server yet.
            </p>
          )}
          {displayAchievements.map((ach) => {
            return (
              <div
                key={ach.id}
                className={`
                  p-4 rounded-2xl border flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all duration-200
                  ${
                    ach.unlocked
                      ? 'bg-gold/10 border-gold/30 dark:bg-jade-gold/20'
                      : 'bg-jade-dark/5 border-gold/10 dark:bg-black/15 opacity-80'
                  }
                `}
              >
                <div
                  className={`p-3 rounded-full shrink-0 shadow-md ${
                    ach.unlocked
                      ? 'bg-gold/20 border border-gold/45'
                      : 'bg-jade-dark/10 border border-gold/5'
                  }`}
                >
                  {ach.unlocked ? (
                    renderAchievementIcon(ach.iconName)
                  ) : (
                    <Lock className="h-6 w-6 text-jade-dark/40 dark:text-parchment/30" />
                  )}
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left w-full">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
                    <div>
                      <h4 className="font-extrabold text-jade-dark dark:text-parchment text-sm tracking-wider uppercase font-martial">
                        {ach.title}
                      </h4>
                      <p className="text-xs text-jade-dark/60 dark:text-parchment/60 mt-0.5 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                    {ach.unlocked && (
                      <Badge rarity="legendary" className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Solved
                      </Badge>
                    )}
                  </div>

                  <ProgressBar value={ach.progress} max={ach.target} color="gold" className="text-xs" />

                  <div className="flex items-center justify-center sm:justify-start space-x-3 text-[10px] font-bold uppercase tracking-wider text-gold/80">
                    <span>Reward:</span>
                    <span className="bg-gold/10 px-2 py-0.5 rounded text-gold">+{ach.rewardXp} XP</span>
                    <span className="bg-gold/10 px-2 py-0.5 rounded text-gold">+{ach.rewardCoins} Coins</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
export default Profile;
