import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Sword, Sparkles, Trophy, User, Settings } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const navItems = [
    { to: '/home', label: 'Dojo', icon: Home },
    { to: '/puzzle', label: 'Quest', icon: Sword },
    { to: '/collection', label: 'Scrolls', icon: Sparkles },
    { to: '/leaderboard', label: 'Ranks', icon: Trophy },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/settings', label: 'Gear', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-gold bg-jade text-parchment shadow-lg md:sticky md:bottom-auto md:top-16 md:h-[calc(100vh-4rem)] md:w-64 md:border-r-2 md:border-t-0 md:flex md:flex-col md:justify-start md:py-6">
      
      {/* Navigation Links */}
      <div className="flex w-full items-center justify-around py-2 px-1 md:flex-col md:items-stretch md:justify-start md:space-y-2 md:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 group
                md:flex-row md:items-center md:justify-start md:space-x-3 md:py-3 md:px-4
                ${isActive 
                  ? 'bg-gold text-jade font-bold scale-105 shadow-md shadow-gold/25 border border-parchment/20' 
                  : 'text-parchment/70 hover:text-gold hover:bg-jade-light/40 hover:scale-102'
                }
              `}
            >
              <Icon className="h-5 w-5 md:h-6 md:w-6 group-hover:animate-bounce transition-transform duration-200" />
              <span className="text-[10px] md:text-sm font-semibold tracking-wider uppercase mt-1 md:mt-0 font-martial">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
