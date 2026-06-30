import React from 'react';
import { useAppSelector } from '../store';
import { Card } from '../components/ui/Card';
import { Trophy } from 'lucide-react';
import { BELT_LEVELS } from '../constants';

export const Leaderboard: React.FC = () => {
  const leaderboard = useAppSelector(state => state.leaderboard);
  const user = useAppSelector(state => state.user);

  const getBeltColorClass = (beltName: string) => {
    const found = BELT_LEVELS.find(b => b.belt === beltName);
    return found ? found.colorClass : 'bg-slate-200 text-slate-800';
  };

  // Get podium entries: 1st, 2nd, 3rd place
  const firstPlace = leaderboard.entries.find(e => e.rank === 1);
  const secondPlace = leaderboard.entries.find(e => e.rank === 2);
  const thirdPlace = leaderboard.entries.find(e => e.rank === 3);

  // List of remaining entries (rank > 3 shown in table)

  // Helper for rendering podium card avatar
  const renderPodiumAvatar = (name: string) => {
    switch (name) {
      case 'Grand Master Oogway':
        return '🐢';
      case 'Master Shifu':
        return '🦊';
      case 'Master Tigress':
        return '🐯';
      case 'Master Viper':
        return '🐍';
      case 'Master Monkey':
        return '🐒';
      default:
        return '🐼';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="border-b border-gold/25 pb-4">
        <h2 className="text-3xl font-extrabold text-black text-gold-glow dark:text-[#f7d36b] uppercase font-martial tracking-wider">
          Temple Rankings
        </h2>
        <p className="text-sm text-jade-dark/70 dark:text-parchment/70 font-medium">
          Compete against the Furious Five and the masters of the Jade Palace.
        </p>
      </div>

      {/* Top 3 Podium Section */}
      <div className="grid gap-4 grid-cols-3 items-end max-w-2xl mx-auto pt-6 pb-2">
        
        {/* 2nd Place Podium */}
        {secondPlace && (
          <div className="flex flex-col items-center space-y-2 order-1">
            <div className="text-center relative">
              <span className="text-3xl filter drop-shadow animate-float block">
                {renderPodiumAvatar(secondPlace.username)}
              </span>
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 border-2 border-parchment font-black text-[10px] text-slate-800">
                2
              </span>
            </div>
            <Card variant="jade" className="w-full text-center p-3 border border-slate-300 min-h-[110px] flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-slate-300 truncate w-full">
                {secondPlace.username}
              </h4>
              <span className="text-sm font-extrabold text-gold font-mono block mt-1">{secondPlace.score}</span>
              <span className={`inline-block mt-2 mx-auto px-2 py-0.5 rounded text-[8px] font-extrabold ${getBeltColorClass(secondPlace.belt)}`}>
                {secondPlace.belt}
              </span>
            </Card>
          </div>
        )}

        {/* 1st Place Podium (Taller, center!) */}
        {firstPlace && (
          <div className="flex flex-col items-center space-y-2 order-2 scale-105 relative z-10">
            <div className="absolute top-[-26px] text-yellow-500 animate-bounce">
              👑
            </div>
            <div className="text-center relative">
              <span className="text-4xl filter drop-shadow animate-float block">
                {renderPodiumAvatar(firstPlace.username)}
              </span>
              <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gold border-2 border-parchment font-black text-xs text-jade-dark shadow">
                1
              </span>
            </div>
            <Card variant="wood" className="w-full text-center p-4 border-2 border-gold min-h-[140px] flex flex-col justify-center shadow-gold/15">
              <h4 className="text-xs font-black uppercase text-gold text-gold-glow truncate w-full">
                {firstPlace.username}
              </h4>
              <span className="text-lg font-black text-gold font-mono block mt-1">{firstPlace.score}</span>
              <span className={`inline-block mt-2 mx-auto px-2 py-0.5 rounded text-[8px] font-extrabold ${getBeltColorClass(firstPlace.belt)}`}>
                {firstPlace.belt}
              </span>
            </Card>
          </div>
        )}

        {/* 3rd Place Podium */}
        {thirdPlace && (
          <div className="flex flex-col items-center space-y-2 order-3">
            <div className="text-center relative">
              <span className="text-3xl filter drop-shadow animate-float block">
                {renderPodiumAvatar(thirdPlace.username)}
              </span>
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 border-2 border-parchment font-black text-[10px] text-white">
                3
              </span>
            </div>
            <Card variant="jade" className="w-full text-center p-3 border border-amber-600 min-h-[110px] flex flex-col justify-center">
              <h4 className="text-[10px] font-black uppercase text-amber-500 truncate w-full">
                {thirdPlace.username}
              </h4>
              <span className="text-sm font-extrabold text-gold font-mono block mt-1">{thirdPlace.score}</span>
              <span className={`inline-block mt-2 mx-auto px-2 py-0.5 rounded text-[8px] font-extrabold ${getBeltColorClass(thirdPlace.belt)}`}>
                {thirdPlace.belt}
              </span>
            </Card>
          </div>
        )}

      </div>

      {/* Rank List Table */}
      <Card variant="parchment" className="border border-gold/25 p-0 overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-gold/15 bg-gold/5 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gold-dark dark:text-gold uppercase tracking-wider font-martial flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" /> Guild Rankings
          </h3>
          <span className="text-xs text-jade-dark/60 dark:text-parchment/60 font-semibold uppercase">
            Your Rank: <span className="text-gold font-bold font-mono">#{leaderboard.currentUserRank}</span>
          </span>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold/10 text-xs font-bold text-jade-dark/50 dark:text-parchment/50 uppercase tracking-widest bg-gold/5">
                <th className="py-3 px-6 text-center">Rank</th>
                <th className="py-3 px-4">Disciple</th>
                <th className="py-3 px-4 text-center">Belt</th>
                <th className="py-3 px-6 text-right">Chi Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-sm font-bold text-jade-dark/95 dark:text-parchment/95">
              {leaderboard.entries.map((entry) => {
                const isCurrentUser = entry.username === user.username;
                return (
                  <tr 
                    key={entry.rank} 
                    className={`
                      transition-colors duration-150
                      ${isCurrentUser 
                        ? 'bg-gold/15 dark:bg-jade-gold/30 hover:bg-gold/20' 
                        : 'hover:bg-gold/5 dark:hover:bg-jade-gold/10'
                      }
                    `}
                  >
                    {/* Rank Badge */}
                    <td className="py-4 px-6 text-center font-mono">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </td>

                    {/* Name & Avatar */}
                    <td className="py-4 px-4 flex items-center space-x-2">
                      <span className="text-lg filter drop-shadow">
                        {renderPodiumAvatar(entry.username)}
                      </span>
                      <div>
                        <span className="truncate max-w-[140px] sm:max-w-none block tracking-wide">
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[8px] font-black text-gold uppercase tracking-wider block leading-none">
                            You (Disciple)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Belt color */}
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${getBeltColorClass(entry.belt)}`}>
                        {entry.belt}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-6 text-right font-mono text-gold text-gold-glow">
                      {entry.score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};
export default Leaderboard;
