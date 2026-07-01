import React from 'react';
import { useAppSelector } from '../../store';
import { playSound } from '../../utils/audio';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  className = '',
  disabled,
  ...props
}) => {
  const soundEnabled = useAppSelector((state) => state.settings.sound);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    playSound.click(soundEnabled);
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-widest uppercase transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-martial border-b-4';
  
  const variants = {
    primary: 'bg-gold border-gold-dark text-jade-dark hover:bg-gold-light hover:brightness-105 active:border-b-0 active:mt-[4px]',
    secondary: 'bg-jade border-jade-dark text-parchment hover:bg-jade-light active:border-b-0 active:mt-[4px]',
    outline: 'border-2 border-gold text-gold bg-wood hover:bg-wood/30 hover:border-gold-light active:border-b-0 active:mt-[4px]',
    danger: 'bg-red-600 border-red-800 text-white hover:bg-red-500 active:border-b-0 active:mt-[4px]',
    ghost: 'bg-transparent border-transparent text-parchment/70 hover:text-parchment hover:bg-parchment/10 active:border-b-0 active:mt-[4px]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-8 py-4 text-base rounded-2xl',
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${baseStyles} 
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''} 
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
