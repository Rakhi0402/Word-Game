import React from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { toggleDarkMode, toggleSound } from '../../store/settingsSlice';
import { Coins, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { BELT_LEVELS, CHARACTER_CARDS } from '../../constants';

export const TopBar: React.FC = () => {
  const user = useAppSelector((state) => state.user);
  const settings = useAppSelector((state) => state.settings);
  const cards = useAppSelector((state) => state.cards);
  const dispatch = useAppDispatch();

  const equippedCard = CHARACTER_CARDS.find(c => c.id === cards.equippedCardId) || CHARACTER_CARDS[0];
  const beltLevel = BELT_LEVELS.find(b => b.belt === user.belt) || BELT_LEVELS[0];

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-gold bg-jade text-parchment shadow-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Logo and App Title */}
        <div className="flex items-center space-x-2">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gold text-jade border-2 border-parchment font-bold text-xl animate-float">
            🥋
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-widest text-[#f7d36b] drop-shadow-[0_0_10px_rgba(247,211,107,0.45)] sm:text-xl uppercase font-martial">
              Kung Fu Word Quest
            </h1>
            <p className="hidden text-[10px] tracking-widest text-parchment sm:block uppercase font-semibold">
              Ancient Martial Arts Academy
            </p>
          </div>
        </div>

        {/* Player Stats & Controls */}
        <div className="flex items-center space-x-3">

          {/* Belt + XP bar */}
          <div className="hidden items-center space-x-2 rounded-full border border-gold/30 bg-jade-dark/50 py-1 px-3 md:flex">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${beltLevel.colorClass}`}>
              {user.belt} Belt
            </span>
            <div className="w-16 bg-jade-light/50 h-2 rounded-full overflow-hidden border border-gold/20">
              <div
                className="bg-gold h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (user.xp / Math.max(1, user.xpNeeded)) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gold">{user.xp} XP</span>
          </div>

          {/* Coins */}
          <div className="flex items-center space-x-1.5 rounded-full border border-gold/30 bg-jade-dark/50 py-1 px-3 text-gold">
            <Coins className="h-4 w-4 animate-pulse" />
            <span className="text-sm font-bold tracking-wider">{user.coins}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => dispatch(toggleSound())}
            className="rounded p-1.5 hover:bg-jade-light transition-colors text-parchment/80 hover:text-gold"
            title={settings.sound ? 'Mute' : 'Unmute'}
          >
            {settings.sound ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => dispatch(toggleDarkMode())}
            className="rounded p-1.5 hover:bg-jade-light transition-colors text-parchment/80 hover:text-gold"
            title={settings.darkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {settings.darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2 border-l border-gold/20 pl-3">
            <img
              src={equippedCard.image}
              alt={equippedCard.name}
              className="h-9 w-9 rounded-full object-cover border-2 border-gold shadow bg-jade-dark"
            />
            <div className="hidden text-left sm:block">
              <div className="text-xs font-bold leading-tight">{user.username}</div>
              <div className="text-[10px] text-gold/80 leading-none">{user.rank}</div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
