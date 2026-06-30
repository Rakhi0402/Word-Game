import React, { useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  progress: number;
}

const WISDOM_QUOTES = [
  "Yesterday is history, tomorrow is a mystery, but today is a gift. — Master Oogway",
  "Your mind is like this water, my friend. When it is agitated, it becomes difficult to see. — Master Oogway",
  "If you only do what you can do, you will never be more than you are now. — Master Shifu",
  "There are no accidents. — Master Oogway",
  "There is no secret ingredient. It's just you. — Mr. Ping",
  "To make something special, you just have to believe it is special. — Po",
  "Inner peace... inner peace... itch... inner peace. — Po",
];

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress }) => {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setQuoteIndex(i => (i + 1) % WISDOM_QUOTES.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-jade text-parchment px-6"
      style={{ backgroundImage: "url('/assets/background/login_bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-jade/90 z-0" />

      <div className="relative z-10 flex flex-col items-center max-w-xl text-center">

        <div className="relative mb-8 animate-float">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gold border-4 border-parchment text-5xl shadow-2xl">
            ☯️
          </div>
          <div className="absolute -top-1 -right-1 animate-lantern text-3xl">🏮</div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-widest text-gold text-gold-glow uppercase font-martial md:text-4xl">
          Kung Fu Word Quest
        </h1>
        <p className="text-xs tracking-widest text-parchment/60 uppercase mt-2">Loading Sacred Word Scrolls...</p>

        <div className="w-80 sm:w-96 bg-jade-dark/60 h-4 rounded-full mt-10 p-0.5 border border-gold/30 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-gold-dark via-gold to-gold-light h-full rounded-full transition-all duration-300 shadow-md shadow-gold/45"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold text-gold mt-2 font-mono tracking-widest">{progress}%</span>

        <div className="mt-12 p-5 bg-parchment/10 backdrop-blur-md rounded-2xl border border-gold/20 shadow-xl max-w-md min-h-[110px] flex items-center justify-center">
          <p className="text-sm sm:text-base italic leading-relaxed text-parchment/90 font-martial">
            "{WISDOM_QUOTES[quoteIndex]}"
          </p>
        </div>
      </div>
    </div>
  );
};
