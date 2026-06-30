import React, { useState } from 'react';
import { useAppSelector } from '../store';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { CHARACTER_CARDS, BELT_LEVELS } from '../constants';
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
  Clock 
} from 'lucide-react';

export const Profile: React.FC = () => {
  const user = useAppSelector(state => state.user);
  const cards = useAppSelector(state => state.cards);
  const achievementsState = useAppSelector(state => state.achievements);
  const completedAchievements = achievementsState.achievements.filter(a => a.unlocked).length;

  const equippedCard = CHARACTER_CARDS.find(c => c.id === cards.equippedCardId) || CHARACTER_CARDS[0];
  const activeBelt = BELT_LEVELS.find(b => b.belt === user.belt) || BELT_LEVELS[0];
  const [isStreakCalendarOpen, setIsStreakCalendarOpen] = useState(false);

  // Calculate days remaining for equipped card rewards
  const getRewardExpirationInfo = () => {
    if (!cards.equippedCardExpiresAt) return null;
    const now = Date.now();
    const expiresAt = cards.equippedCardExpiresAt;
    const daysRemaining = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000));
    
    if (daysRemaining <= 0) {
      return { daysRemaining: 0, isExpired: true };
    }
    return { daysRemaining, isExpired: false };
  };

  const rewardExpiration = getRewardExpirationInfo();

  const recentStreakDays = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - index));

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday: index === 13,
      isActive: index >= 14 - Math.min(Math.max(user.streak, 0), 14),
    };
  });

  // Helper to map icon names to Lucide icons
  const renderAchievementIcon = (iconName: string) => {
    const iconProps = { className: "h-6 w-6 text-gold" };
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

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="border-b border-gold/25 pb-4">
        <h2 className="text-3xl font-extrabold text-black text-gold-glow  dark:text-[#f7d36b] drop-shadow-[0_0_8px_rgba(92,58,33,0.2)] dark:drop-shadow-[0_0_10px_rgba(247,211,107,0.35)] uppercase font-martial tracking-wider">
          Disciple Profile
        </h2>
        <p className="mt-1 text-sm text-jade-dark/70 dark:text-parchment font-semibold">
          Review your training progress, achievements, and belt advancement.
        </p>
      </div>

      <Card variant="wood" className="flex items-start gap-8 p-6">
      {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={equippedCard.image}
            alt={equippedCard.name}
            className="w-[170px] h-[220px] rounded-lg object-cover border-[3px] border-gold"
          />

          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gold text-jade-dark text-[10px] font-black uppercase px-4 py-1 rounded-full">
            PARTNER
          </span>

          {rewardExpiration && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gradient-to-b from-gold to-gold/80 text-jade-dark text-[9px] font-black uppercase px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
              Rewards: {rewardExpiration.daysRemaining}d
            </div>
          )}
        </div>

      {/* Right Side */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-5xl font-black uppercase text-gold leading-none">
            {user.username}
          </h2>

          <p className="mt-2 text-sm uppercase text-parchment/70">
            Rank: {user.rank}
          </p>

          <div className="flex items-center gap-4 mt-5">
            <span
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase ${activeBelt.colorClass}`}
            >
              {user.belt} Belt
            </span>

            <span className="px-5 py-2 rounded-full bg-jade-dark/70 border border-gold/20 text-sm">
              ⚡ Chi Level: {BELT_LEVELS.findIndex(b => b.belt === user.belt) + 1}
            </span>

            {rewardExpiration && !rewardExpiration.isExpired && (
              <span className="px-5 py-2 rounded-full bg-gold/20 border border-gold/40 text-xs font-bold text-gold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {rewardExpiration.daysRemaining}d Left
              </span>
            )}
            {rewardExpiration && rewardExpiration.isExpired && (
              <span className="px-5 py-2 rounded-full bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Rewards Expired
              </span>
            )}
          </div>

          <div className="mt-8 w-full">
            <ProgressBar
              value={user.xp}
              max={user.xpNeeded}
              label="Chi Experience (XP)"
              color="gold"
            />
          </div>
        </div>
      </Card>

      <Card variant="glass" className="border border-gold/40 p-8">
        <button
          type="button"
          onClick={() => setIsStreakCalendarOpen(prev => !prev)}
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
                  {user.streak} Day{user.streak === 1 ? '' : 's'}
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
                  Recent Training Days
                </p>
                <p className="text-sm font-semibold text-jade-dark/80 dark:text-parchment/80">
                  Keep the spark alive one scroll at a time.
                </p>
              </div>
              <div className="rounded-full bg-gold/15 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-gold">
                {user.streak}x
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {recentStreakDays.map(day => (
                <div key={day.key} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-jade-dark/50 dark:text-parchment/50">
                    {day.label}
                  </span>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black ${
                      day.isActive
                        ? 'border-gold bg-gold text-jade-dark shadow-[0_0_12px_rgba(247,211,107,0.35)]'
                        : 'border-gold/15 bg-white/55 text-jade-dark/50 dark:bg-black/20 dark:text-parchment/40'
                    }`}
                  >
                    {day.dayNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Stats Summary Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: 'Words Found', value: user.stats.wordsFound, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Scrolls Unlocked', value: user.stats.cardsCollected, icon: Sparkles, color: 'text-purple-500' },
          { label: 'Medals Earned', value: completedAchievements, icon: Trophy, color: 'text-gold' },
          { label: 'Puzzles Completed', value: user.stats.puzzlesCompleted, icon: Calendar, color: 'text-emerald-500' },
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

      {/* Achievement Summary Section */}
      <Card variant="parchment" className="border border-gold/25 shadow-xl">
        <div className="border-b border-gold/15 pb-3 mb-5 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gold-dark dark:text-gold uppercase tracking-wider font-martial flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" /> Sacred Medals (Achievements)
          </h3>
          <span className="text-xs text-jade-dark/60 dark:text-parchment/60 font-semibold uppercase">
            Completed: <span className="text-gold font-bold font-mono">{completedAchievements} / {achievementsState.achievements.length}</span>
          </span>
        </div>

        {/* Achievements Checklist */}
        <div className="space-y-4">
          {achievementsState.achievements.map((ach) => {
            return (
              <div 
                key={ach.id} 
                className={`
                  p-4 rounded-2xl border flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all duration-200
                  ${ach.unlocked 
                    ? 'bg-gold/10 border-gold/30 dark:bg-jade-gold/20' 
                    : 'bg-jade-dark/5 border-gold/10 dark:bg-black/10 opacity-70'
                  }
                `}
              >
                {/* Medal Icon Badge */}
                <div className={`p-3 rounded-full shrink-0 shadow-md ${ach.unlocked ? 'bg-gold/20 border border-gold/45' : 'bg-jade-dark/10 border border-gold/5'}`}>
                  {ach.unlocked ? renderAchievementIcon(ach.iconName) : <Lock className="h-6 w-6 text-jade-dark/40 dark:text-parchment/30" />}
                </div>

                {/* Info & Progress */}
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

                  {/* Progress bar */}
                  <ProgressBar 
                    value={ach.progress} 
                    max={ach.target} 
                    color="gold"
                    className="text-xs"
                  />

                  {/* Rewards Row */}
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
