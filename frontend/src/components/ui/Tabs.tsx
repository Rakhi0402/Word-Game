import React from 'react';
import { playSound } from '../../utils/audio';
import { useAppSelector } from '../../store';

interface TabOption {
  id: string;
  label: string;
}

interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  activeTab,
  onChange,
  className = ''
}) => {
  const soundEnabled = useAppSelector(state => state.settings.sound);

  const handleTabClick = (id: string) => {
    playSound.click(soundEnabled);
    onChange(id);
  };

  return (
    <div className={`flex flex-wrap border-b border-gold/20 gap-1.5 ${className}`}>
      {options.map((option) => {
        const isActive = option.id === activeTab;
        return (
          <button
            key={option.id}
            onClick={() => handleTabClick(option.id)}
            className={`
              px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border-b-2 font-martial
              ${isActive 
                ? 'border-gold text-gold text-gold-glow' 
                : 'border-transparent text-jade-dark/80 dark:text-parchment/60 hover:text-gold hover:border-gold/30'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
