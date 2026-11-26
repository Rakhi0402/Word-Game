import { apiRequest } from './apiClient';
import type {
  BackendCard,
  BackendDrawResult,
  BackendLeaderboardMe,
  BackendLeaderboardPage,
  BackendPuzzle,
  BackendPuzzleView,
  BackendSubmitWordResult,
  BackendUserAchievement,
  CollectionResponse,
} from '../types/dashboard';
import type { ProfileResponse } from '../types/profile';
import type { DailyPuzzle, PuzzleDifficulty } from '../types';
import { DIFFICULTY_CONFIG } from '../constants/rewards';
import { cachedGet, cachedSet } from './cache/clientCache';
import { CacheTags, CacheTTL, cacheKey, todayKey } from './cache/cacheKeys';
import {
  invalidateAfterCollectionChange,
  invalidateAfterGameplay,
  invalidateAfterReset,
} from './cache/invalidateGameCache';

const formatDifficulty = (raw: string | undefined | null): PuzzleDifficulty => {
  if (!raw) return 'Medium';
  const n = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (n === 'Easy' || n === 'Medium' || n === 'Hard' || n === 'Expert') return n;
  const upper = raw.toUpperCase();
  if (upper === 'EASY') return 'Easy';
  if (upper === 'MEDIUM') return 'Medium';
  if (upper === 'HARD') return 'Hard';
  if (upper === 'EXPERT') return 'Expert';
  return 'Medium';
};

export const mapBackendPuzzle = (p: BackendPuzzle, progress?: BackendPuzzleView['progress']): DailyPuzzle => {
  const puzzleId = typeof p.id === 'number' ? p.id : Number(p.id);
  const difficulty = formatDifficulty(p.difficulty);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  const ruleTarget = cfg.targetWords;
  const serverTarget = p.targetWordCount ?? progress?.targetWordCount;
  const targetWordCount =
    typeof serverTarget === 'number' && serverTarget > 0
      ? Math.min(serverTarget, ruleTarget)
      : ruleTarget;
  const validWords = (p.validWords || []).map((w) => w.toUpperCase());
  const pangrams = (p.pangrams || []).map((w) => w.toUpperCase());
  return {
    id: puzzleId,
    letters: (p.letters || []).map((l) => l.toUpperCase()),
    centerLetter: (p.centerLetter || '').toUpperCase(),
    validWords,
    pangrams,
    pangramCount: p.pangramCount ?? pangrams.length,
    difficulty,
    xpReward: p.xpReward ?? cfg.baseXp,
    coinReward: p.coinReward ?? cfg.baseCoins,
    targetWordCount,
    minimumWordLength: p.minimumWordLength ?? 4,
    scheduledDate: p.scheduledDate ?? p.puzzleDate ?? null,
    daily: p.daily,
    completed: progress?.completed,
    foundWords: progress?.foundWords ?? [],
    score: progress?.score ?? 0,
    streak: progress?.streak ?? 0,
    hintsUsed: progress?.hintsUsed ?? 0,
    status: progress?.status,
  };
};

const mapPuzzleView = (view: BackendPuzzleView): DailyPuzzle =>
  mapBackendPuzzle(view.puzzle, view.progress);

export const puzzleService = {
  getDailyPuzzle: async (opts?: { force?: boolean }) => {
    const key = cacheKey(['puzzle', 'daily', todayKey()]);
    const data = await cachedGet(
      key,
      () => apiRequest<BackendPuzzleView>('/api/v1/puzzles/daily', { method: 'GET' }),
      {
        ttlMs: CacheTTL.DAILY_PUZZLE,
        tags: [CacheTags.PUZZLE],
        force: opts?.force,
        store: 'idb',
      }
    );
    return { success: true as const, data: mapPuzzleView(data) };
  },

  /** Persist updated puzzle progress locally after submit/hint without another GET. */
  putDailyPuzzleView: async (view: BackendPuzzleView) => {
    const key = cacheKey(['puzzle', 'daily', todayKey()]);
    await cachedSet(key, view, {
      ttlMs: CacheTTL.DAILY_PUZZLE,
      tags: [CacheTags.PUZZLE],
      store: 'idb',
    });
  },

  startSession: (puzzleId: number | string) =>
    apiRequest<unknown>(
      `/api/v1/puzzles/session/start?puzzleId=${encodeURIComponent(String(puzzleId))}`,
      {
        method: 'POST',
      }
    ),

  submitWord: async (puzzleId: number | string, word: string) => {
    const q = new URLSearchParams({ puzzleId: String(puzzleId), word });
    const data = await apiRequest<BackendSubmitWordResult>(
      `/api/v1/puzzles/session/submit?${q.toString()}`,
      { method: 'POST' }
    );
    if (data.completed) {
      await invalidateAfterGameplay();
    }
    return {
      success: true as const,
      data: {
        valid: data.valid,
        points: data.points,
        isPangram: data.isPangram,
        duplicate: data.duplicate,
        completed: data.completed,
        xpAwarded: data.xpAwarded ?? 0,
        coinsAwarded: data.coinsAwarded ?? 0,
        totalXp: data.totalXp,
        totalCoins: data.totalCoins,
        belt: data.belt,
        reason: data.duplicate
          ? ('duplicate' as const)
          : data.valid
            ? null
            : ('not_in_dict' as const),
      },
    };
  },

  /** Authoritative sync after local Spelling Bee–style play. */
  syncProgress: async (
    puzzleId: number | string,
    foundWords: string[],
    score?: number,
    streak?: number
  ) => {
    const data = await apiRequest<{
      completed: boolean;
      score: number;
      streak: number;
      foundWords: string[];
      wordsFoundCount: number;
      targetWordCount: number;
      xpAwarded: number;
      coinsAwarded: number;
      totalXp: number;
      totalCoins: number;
      belt: string;
    }>('/api/v1/puzzles/session/sync', {
      method: 'POST',
      body: JSON.stringify({ puzzleId, foundWords, score, streak }),
    });
    if (data.completed) {
      await invalidateAfterGameplay();
    }
    return data;
  },

  /** Warm IDB with up to 10 puzzle definitions per difficulty (includes word lists). */
  warmPuzzlePool: async (difficulty: PuzzleDifficulty) => {
    const key = cacheKey(['puzzle', 'pool', difficulty, todayKey()]);
    return cachedGet(
      key,
      () =>
        apiRequest<BackendPuzzle[]>(
          `/api/v1/puzzles/pool?difficulty=${encodeURIComponent(difficulty.toUpperCase())}&limit=10`,
          { method: 'GET' }
        ),
      {
        ttlMs: CacheTTL.PUZZLE_POOL,
        tags: [CacheTags.PUZZLE],
        store: 'idb',
      }
    );
  },

  revealHint: async (puzzleId: number | string) => {
    const word = await apiRequest<string>(
      `/api/v1/puzzles/session/hint?puzzleId=${encodeURIComponent(String(puzzleId))}`,
      { method: 'POST' }
    );
    await invalidateAfterGameplay();
    return word;
  },

  getPuzzleByDifficulty: async (difficulty: PuzzleDifficulty, opts?: { force?: boolean }) => {
    const key = cacheKey(['puzzle', 'choice', difficulty, todayKey()]);
    const q = new URLSearchParams({ difficulty: difficulty.toUpperCase() });
    const data = await cachedGet(
      key,
      () =>
        apiRequest<BackendPuzzleView>(`/api/v1/puzzles?${q.toString()}`, {
          method: 'GET',
        }),
      {
        ttlMs: CacheTTL.CHOICE_PUZZLE,
        tags: [CacheTags.PUZZLE],
        force: opts?.force,
        store: 'session',
      }
    );
    return { success: true as const, data: mapPuzzleView(data) };
  },

  getPuzzleById: async (_puzzleId: number | string) => ({
    success: false as const,
    data: null,
    message: 'Puzzle lookup by id is not available; use daily or difficulty endpoints.',
  }),
};

export const cardService = {
  getAllCards: (opts?: { force?: boolean }) =>
    cachedGet(
      'cards:catalog',
      () => apiRequest<BackendCard[]>('/api/v1/cards', { method: 'GET' }),
      {
        ttlMs: CacheTTL.CARDS_CATALOG,
        tags: [CacheTags.CARDS],
        force: opts?.force,
        store: 'idb',
        scopedToUser: false,
      }
    ),

  getInventory: (opts?: { force?: boolean }) =>
    cachedGet(
      'inventory',
      () =>
        apiRequest<CollectionResponse>('/api/v1/cards/inventory', {
          method: 'GET',
        }),
      {
        ttlMs: CacheTTL.COLLECTION,
        tags: [CacheTags.COLLECTION],
        force: opts?.force,
        store: 'idb',
      }
    ),

  getCollection: (opts?: { force?: boolean }) =>
    cachedGet(
      'collection',
      () =>
        apiRequest<CollectionResponse>('/api/v1/users/me/collection', {
          method: 'GET',
        }),
      {
        ttlMs: CacheTTL.COLLECTION,
        tags: [CacheTags.COLLECTION],
        force: opts?.force,
        store: 'idb',
      }
    ),

  drawCard: async () => {
    const result = await apiRequest<BackendDrawResult>('/api/v1/cards/draw', { method: 'POST' });
    await invalidateAfterCollectionChange();
    return result;
  },

  equipCard: async (cardId: string) => {
    const result = await apiRequest<CollectionResponse>(
      `/api/v1/cards/equip?cardId=${encodeURIComponent(cardId)}`,
      { method: 'POST' }
    );
    await invalidateAfterCollectionChange();
    await cachedSet('collection', result, {
      ttlMs: CacheTTL.COLLECTION,
      tags: [CacheTags.COLLECTION],
      store: 'idb',
    });
    return result;
  },
};

export const leaderboardService = {
  getLeaderboard: (page = 0, size = 20, opts?: { force?: boolean }) =>
    cachedGet(
      cacheKey(['leaderboard', page, size]),
      () =>
        apiRequest<BackendLeaderboardPage>(
          `/api/v1/leaderboard?page=${page}&size=${size}`,
          { method: 'GET' }
        ),
      {
        ttlMs: CacheTTL.LEADERBOARD,
        tags: [CacheTags.LEADERBOARD],
        force: opts?.force,
        store: 'idb',
      }
    ),

  getTop: (limit = 20) =>
    apiRequest<BackendLeaderboardPage>(`/api/v1/leaderboard?limit=${limit}`, {
      method: 'GET',
    }),

  getMyStanding: () =>
    apiRequest<BackendLeaderboardMe>('/api/v1/leaderboard/me', { method: 'GET' }),

  getMyRank: async () => {
    const me = await apiRequest<BackendLeaderboardMe>('/api/v1/leaderboard/me', {
      method: 'GET',
    });
    return me?.rank ?? null;
  },
};

export const achievementService = {
  getAchievements: (opts?: { force?: boolean }) =>
    cachedGet(
      'achievements',
      () => apiRequest<BackendUserAchievement[]>('/api/v1/achievements', { method: 'GET' }),
      {
        ttlMs: CacheTTL.ACHIEVEMENTS,
        tags: [CacheTags.ACHIEVEMENTS],
        force: opts?.force,
        store: 'idb',
      }
    ),

  evaluate: async () => {
    const result = await apiRequest<BackendUserAchievement[]>('/api/v1/achievements/evaluate', {
      method: 'POST',
    });
    await invalidateAfterGameplay();
    return result;
  },
};

export const profileService = {
  getMe: () =>
    apiRequest<{
      userId: string;
      userName: string;
      userEmail: string;
      role?: string;
      belt?: string;
      xp?: number;
      coins?: number;
    }>('/api/v1/users/me', { method: 'GET' }),

  getProfile: (opts?: { force?: boolean }) =>
    cachedGet(
      'profile',
      () =>
        apiRequest<ProfileResponse>('/api/v1/users/me/profile', {
          method: 'GET',
        }),
      {
        ttlMs: CacheTTL.PROFILE,
        tags: [CacheTags.PROFILE, CacheTags.ACHIEVEMENTS],
        force: opts?.force,
        store: 'idb',
      }
    ),

  resetProgression: async () => {
    const result = await apiRequest<{
      userId: string;
      userName: string;
      userEmail: string;
      belt?: string;
      xp?: number;
      coins?: number;
    }>('/api/v1/users/reset', { method: 'POST' });
    await invalidateAfterReset();
    return result;
  },
};

export { settingsService } from './settingsService';
