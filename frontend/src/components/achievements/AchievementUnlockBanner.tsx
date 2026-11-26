import React, { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../../store';
import { Trophy, X } from 'lucide-react';
import type { Achievement } from '../../types';

/**
 * Celebratory banner when one or more achievements newly unlock.
 */
export const AchievementUnlockBanner: React.FC = () => {
  const achievements = useAppSelector((s) => s.achievements.achievements);
  const soundEnabled = useAppSelector((s) => s.settings.sound);
  const seenRef = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [current, setCurrent] = useState<Achievement | null>(null);

  useEffect(() => {
    if (!achievements.length) return;

    if (seenRef.current === null) {
      // Wait for first non-empty list, snapshot current unlocks (no toast for history).
      seenRef.current = new Set(achievements.filter((a) => a.unlocked).map((a) => a.id));
      return;
    }

    const newly = achievements.filter(
      (a) => a.unlocked && !seenRef.current!.has(a.id)
    );
    if (!newly.length) return;

    for (const a of newly) seenRef.current.add(a.id);
    setQueue((q) => [...q, ...newly]);
  }, [achievements]);

  useEffect(() => {
    if (current || !queue.length) return;
    const [next, ...rest] = queue;
    setCurrent(next);
    setQueue(rest);
    if (soundEnabled) {
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 660;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch {
        /* ignore */
      }
    }
  }, [queue, current, soundEnabled]);

  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => setCurrent(null), 4800);
    return () => window.clearTimeout(t);
  }, [current]);

  if (!current) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto relative flex max-w-lg animate-[slideDown_0.45s_ease-out] items-start gap-3 rounded-2xl border-2 border-gold bg-gradient-to-br from-jade to-jade-dark px-5 py-4 text-parchment shadow-[0_0_40px_rgba(247,211,107,0.45)]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-gold/20">
          <Trophy className="h-6 w-6 text-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gold">
            Achievement Unlocked
          </p>
          <h3 className="mt-1 font-martial text-lg font-extrabold uppercase tracking-wider text-gold">
            {current.title}
          </h3>
          <p className="mt-1 text-xs text-parchment/80">{current.description}</p>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gold/90">
            +{current.rewardXp} XP · +{current.rewardCoins} Coins
          </p>
        </div>
        <button
          type="button"
          className="rounded p-1 text-parchment/60 hover:text-gold"
          onClick={() => setCurrent(null)}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default AchievementUnlockBanner;
