import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: 'gold' | 'jade' | 'blue';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  color = 'gold',
  className = ''
}) => {
  const percentage = Math.min(100, Math.max(0, (value / (max || 1)) * 100));

  const colors = {
    gold: 'from-gold-dark via-gold to-gold-light',
    jade: 'from-jade-dark via-emerald-600 to-emerald-500',
    blue: 'from-blue-700 via-blue-500 to-cyan-400',
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label and values */}
      {label && (
        <div className="flex items-center justify-between mb-1.5 text-xs font-bold uppercase tracking-wider">
          <span>{label}</span>
          <span className="font-mono text-gold">{value} / {max}</span>
        </div>
      )}

      {/* Progress track */}
      <div className="w-full bg-jade-dark/40 dark:bg-black/30 h-3 rounded-full border border-gold/15 p-[1px] overflow-hidden">
        <div 
          className={`h-full rounded-full bg-gradient-to-r ${colors[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
