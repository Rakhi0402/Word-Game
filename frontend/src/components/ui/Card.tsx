import React from 'react';

interface CardProps {
  children: React.ReactNode;
  variant?: 'parchment' | 'wood' | 'jade' | 'glass';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'parchment',
  className = '',
  onClick,
}) => {
  const cardStyles = {
    parchment:
      'bg-parchment border-2 border-gold-dark/40 shadow-md text-jade-dark dark:bg-jade-gold/30 dark:border-gold/30 dark:text-parchment',

    wood:
      'bg-gradient-to-b from-wood-light to-wood border-4 border-gold shadow-2xl text-parchment',

    jade:
      'bg-jade border-2 border-gold shadow-xl text-parchment',

    glass:
      'glass-panel text-jade-dark dark:text-parchment',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative
        overflow-hidden
        rounded-2xl
        p-5
        transition-all
        duration-300
        ${cardStyles[variant]}
        ${onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}
        ${className}
      `}
    >
      {/* Decorative Corners */}
      {variant === 'wood' && (
        <>
          <div className="absolute top-1 left-1 text-gold text-[10px] opacity-70">
            ◆
          </div>

          <div className="absolute top-1 right-1 text-gold text-[10px] opacity-70">
            ◆
          </div>

          <div className="absolute bottom-1 left-1 text-gold text-[10px] opacity-70">
            ◆
          </div>

          <div className="absolute bottom-1 right-1 text-gold text-[10px] opacity-70">
            ◆
          </div>
        </>
      )}

      {/* Content */}
      {children}
    </div>
  );
};

export default Card;