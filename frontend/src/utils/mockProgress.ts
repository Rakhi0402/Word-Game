import type { User, Achievement, CardStatus, FoundWord, PuzzleDifficulty } from '../types';
import type { RootState } from '../store';
import { DEFAULT_ACHIEVEMENTS } from '../constants';
import { FREE_DAILY_HINTS, STARTING_COINS, getStarTier } from '../constants/rewards';
import type { CardInventoryEntry } from '../store/cardsSlice';

const PROGRESS_PREFIX = 'kungfu_progress_';
const COMPLETED_PREFIX = 'kungfu_daily_done_';
/** Prod-style forever archive of cleared puzzle attempts (by puzzle id). */
const FOREVER_PREFIX = 'kungfu_puzzle_cleared_';

/**
 * Mock: daily is locked only for the calendar day.
 * Prod: use forever keys (see markPuzzleClearedForever) so a scheduled puzzle never reopens as a fresh attempt.
 */
export type DailyLockMode = 'day' | 'forever';
/** Mock uses day-lock; switch to `'forever'` to simulate prod scheduled-puzzle locks. */
export let DAILY_LOCK_MODE: DailyLockMode = 'day';

export interface DailyCompletionSnapshot {
  puzzleId: number | string;
  date: string;
  difficulty?: PuzzleDifficulty;
  wordsFound: FoundWord[];
  score: number;
  pangramsFound: string[];
  hintedWords: string[];
  streak: number;
  hintsUsedThisPuzzle?: number;
}

export interface StoredProgress {
  user: User;
  unlockedCardIds: string[];
  inventory: Record<string, CardInventoryEntry>;
  equippedCardId: string | null;
  availableHints: number;
  usedHints: number;
  achievements: Achievement[];
  leaderboardScore: number;
}

const emptyStats = () => ({
  wordsFound: 0,
  cardsCollected: 1,
  achievementsEarned: 0,
  highestScore: 0,
  daysPlayed: 0,
  puzzlesCompleted: 0,
  pangramsFound: 0,
  perfectPuzzles: 0,
  hintsUsed: 0,
  hintsBought: 0,
});

export const defaultProgress = (username: string, email: string): StoredProgress => ({
  user: {
    username,
    email,
    belt: 'White',
    xp: 0,
    xpNeeded: 500,
    coins: STARTING_COINS,
    streak: 0,
    dailyStreak: 0,
    streakShields: 0,
    characterMultiplier: 0.1,
    rank: 'Novice Disciple',
    permanentExtraDailyHint: false,
    bonusFreeHintsNextDay: 0,
    freeChestTokens: 0,
    claimedBeltRewards: ['White'],
    claimedStreakMilestones: [],
    lastPuzzleDate: null,
    lastDifficultyChosen: null,
    choicePuzzlesDate: null,
    choicePuzzlesCompletedToday: 0,
    stats: emptyStats(),
  },
  unlockedCardIds: ['po_common'],
  inventory: {
    po_common: {
      chargesRemaining: getStarTier(1).charges,
      status: 'available' as CardStatus,
    },
  },
  equippedCardId: 'po_common',
  availableHints: FREE_DAILY_HINTS,
  usedHints: 0,
  achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
  leaderboardScore: 0,
});

export const progressKey = (email: string) =>
  `${PROGRESS_PREFIX}${email.trim().toLowerCase()}`;

export const saveProgressFromState = (email: string, state: RootState) => {
  if (!email) return;
  const payload: StoredProgress = {
    user: state.user,
    unlockedCardIds: state.cards.unlockedCardIds,
    inventory: state.cards.inventory,
    equippedCardId: state.cards.equippedCardId,
    availableHints: state.cards.availableHints,
    usedHints: state.cards.usedHints,
    achievements: state.achievements.achievements,
    leaderboardScore: state.user.xp,
  };
  localStorage.setItem(progressKey(email), JSON.stringify(payload));
};

export const loadProgress = (email: string, username: string): StoredProgress => {
  try {
    const raw = localStorage.getItem(progressKey(email));
    if (raw) {
      const parsed = JSON.parse(raw) as StoredProgress & {
        equippedCardId?: string;
      };
      const base = defaultProgress(username, email);
      return {
        ...base,
        ...parsed,
        user: {
          ...base.user,
          ...parsed.user,
          username: username || parsed.user?.username || username,
          email,
          stats: { ...base.user.stats, ...parsed.user?.stats },
          choicePuzzlesDate: parsed.user?.choicePuzzlesDate ?? null,
          choicePuzzlesCompletedToday: parsed.user?.choicePuzzlesCompletedToday ?? 0,
        },
        inventory: parsed.inventory || base.inventory,
        unlockedCardIds: parsed.unlockedCardIds || base.unlockedCardIds,
      };
    }
  } catch {
    /* ignore */
  }
  return defaultProgress(username, email);
};

export const clearProgress = (email: string) => {
  localStorage.removeItem(progressKey(email));
};

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const dailyCompletionKey = (email: string, date = todayKey()) =>
  `${COMPLETED_PREFIX}${email.trim().toLowerCase()}_${date}`;

export const foreverClearKey = (email: string, puzzleId: number | string) =>
  `${FOREVER_PREFIX}${email.trim().toLowerCase()}_${puzzleId}`;

const parseSnapshot = (raw: string | null): DailyCompletionSnapshot | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyCompletionSnapshot;
  } catch {
    return null;
  }
};

/** True if today's calendar daily was already completed (mock day-lock). */
export const isDailyCompleted = (email: string): boolean => {
  try {
    return Boolean(localStorage.getItem(dailyCompletionKey(email)));
  } catch {
    return false;
  }
};

/**
 * Mock day-lock for the scheduled daily: completed only if today's record
 * includes a puzzleId that matches today's scheduled puzzle.
 * Malformed/legacy records (no puzzleId) are cleared so the daily can open.
 */
export const isTodaysDailyCompleted = (
  email: string,
  todaysPuzzleId: number | string
): boolean => {
  if (DAILY_LOCK_MODE === 'forever') {
    return isPuzzleClearedForever(email, todaysPuzzleId);
  }
  const snap = loadDailyCompletion(email);
  if (!snap) return false;

  // Legacy / empty payloads must not block an unplayed daily
  if (!snap.puzzleId) {
    clearDailyCompletion(email);
    return false;
  }
  if (snap.date && snap.date !== todayKey()) {
    clearDailyCompletion(email);
    return false;
  }
  if (String(snap.puzzleId) !== String(todaysPuzzleId)) {
    clearDailyCompletion(email);
    return false;
  }
  return true;
};

export const wasYesterdayCompleted = (email: string): boolean => {
  try {
    return Boolean(localStorage.getItem(dailyCompletionKey(email, yesterdayKey())));
  } catch {
    return false;
  }
};

export const markDailyCompleted = (email: string, snapshot: DailyCompletionSnapshot) => {
  const withDate: DailyCompletionSnapshot = {
    ...snapshot,
    date: snapshot.date || todayKey(),
  };
  localStorage.setItem(dailyCompletionKey(email), JSON.stringify(withDate));
  // Always archive forever for review / future prod lock
  markPuzzleClearedForever(email, withDate.puzzleId, withDate);
};

export const loadDailyCompletion = (email: string): DailyCompletionSnapshot | null => {
  try {
    return parseSnapshot(localStorage.getItem(dailyCompletionKey(email)));
  } catch {
    return null;
  }
};

export const clearDailyCompletion = (email: string) => {
  localStorage.removeItem(dailyCompletionKey(email));
};

export const isPuzzleClearedForever = (email: string, puzzleId: number | string): boolean => {
  try {
    return Boolean(localStorage.getItem(foreverClearKey(email, puzzleId)));
  } catch {
    return false;
  }
};

export const markPuzzleClearedForever = (
  email: string,
  puzzleId: number | string,
  snapshot: DailyCompletionSnapshot
) => {
  localStorage.setItem(foreverClearKey(email, puzzleId), JSON.stringify(snapshot));
};

export const loadForeverClear = (
  email: string,
  puzzleId: number | string
): DailyCompletionSnapshot | null => {
  try {
    return parseSnapshot(localStorage.getItem(foreverClearKey(email, puzzleId)));
  } catch {
    return null;
  }
};

/** Load best available completion snapshot for review (today first, then forever archive). */
export const loadCompletionForReview = (
  email: string,
  puzzleId?: number | string
): DailyCompletionSnapshot | null => {
  const today = loadDailyCompletion(email);
  if (today && (!puzzleId || String(today.puzzleId) === String(puzzleId))) return today;
  if (puzzleId) return loadForeverClear(email, puzzleId);
  return today;
};

export const mockHashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (Math.imul(31, hash) + password.charCodeAt(i)) | 0;
  }
  return `mock$${password.length}$${(hash >>> 0).toString(16)}`;
};
