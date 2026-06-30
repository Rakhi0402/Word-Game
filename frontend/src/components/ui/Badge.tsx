import React from 'react';
import type { RarityType } from '../../types';

interface BadgeProps {
  rarity?: RarityType;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ rarity, children, className = '' }) => {
  const getRarityColors = () => {
    switch (rarity) {
      case 'common':    return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
      case 'rare':      return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'epic':      return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'legendary': return 'bg-amber-500/20 text-amber-400 border border-amber-500/50 animate-pulse';
      default:          return 'bg-gold/10 text-gold border border-gold/30';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest font-martial ${getRarityColors()} ${className}`}
    >
      {children}
    </span>
  );
};
