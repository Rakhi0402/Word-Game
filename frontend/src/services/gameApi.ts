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

const formatDifficulty = (raw: string | undefined | null): PuzzleDifficulty => {
  if (!raw) return 'Medium';
  const n = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  if (n === 'Easy' || n === 'Medium' || n === 'Hard' || n === 'Expert') return n;
  // Backend may send EASY/MEDIUM/HARD/EXPERT
  const upper = raw.toUpperCase();
  if (upper === 'EASY') return 'Easy';
  if (upper === 'MEDIUM') return 'Medium';
  if (upper === 'HARD') return 'Hard';
  if (upper === 'EXPERT') return 'Expert';
  return 'Medium';
};

export const mapBackendPuzzle = (p: BackendPuzzle, progress?: BackendPuzzleView['progress']): DailyPuzzle => {
  const difficulty = formatDifficulty(p.difficulty);
  const cfg = DIFFICULTY_CONFIG[difficulty];
  // Prefer server target when present; otherwise fall back to difficulty rules.
  // Never invent a higher target than the rule table for the resolved difficulty.
  const ruleTarget = cfg.targetWords;
  const serverTarget = p.targetWordCount ?? progress?.targetWordCount;
  const targetWordCount =
    typeof serverTarget === 'number' && serverTarget > 0
      ? Math.min(serverTarget, ruleTarget)
      : ruleTarget;
  const mapped = {
    id: p.id,
    letters: (p.letters || []).map((l) => l.toUpperCase()),
    centerLetter: (p.centerLetter || '').toUpperCase(),
    // Never trust answer keys from the wire — leave empty even if leaked
    validWords: [],
    pangrams: [],
    pangramCount: p.pangramCount ?? 0,
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
  // #region agent log
  fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'post-fix',hypothesisId:'T',location:'gameApi.ts:mapBackendPuzzle',message:'Mapped puzzle targets + pangramCount',data:{difficulty,ruleTarget,serverTarget:serverTarget??null,targetWordCount,pangramCount:mapped.pangramCount,lettersLen:mapped.letters.length},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return mapped;
};

const mapPuzzleView = (view: BackendPuzzleView): DailyPuzzle =>
  mapBackendPuzzle(view.puzzle, view.progress);

export const puzzleService = {
  getDailyPuzzle: async () => {
    const data = await apiRequest<BackendPuzzleView>('/api/v1/puzzles/daily', { method: 'GET' });
    // #region agent log
    fetch('http://127.0.0.1:7624/ingest/d78d18c5-ea90-45b2-8e2a-cd4467b12b59',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'156feb'},body:JSON.stringify({sessionId:'156feb',runId:'pre-fix',hypothesisId:'B',location:'gameApi.ts:getDailyPuzzle',message:'Raw daily API payload shape',data:{hasPuzzle:Boolean(data&&(data as BackendPuzzleView).puzzle),hasProgress:Boolean(data&&(data as BackendPuzzleView).progress),topKeys:data&&typeof data==='object'?Object.keys(data as object):[],puzzleKeys:data&&typeof data==='object'&&(data as BackendPuzzleView).puzzle?Object.keys((data as BackendPuzzleView).puzzle as object):[],lettersLen:(data as BackendPuzzleView)?.puzzle?.letters?.length??null,id:(data as BackendPuzzleView)?.puzzle?.id??(data as {id?:string})?.id??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { success: true as const, data: mapPuzzleView(data) };
  },

  startSession: (puzzleId: string) =>
    apiRequest<unknown>(`/api/v1/puzzles/session/start?puzzleId=${encodeURIComponent(puzzleId)}`, {
      method: 'POST',
    }),

  submitWord: async (puzzleId: string, word: string) => {
    const q = new URLSearchParams({ puzzleId, word });
    const data = await apiRequest<BackendSubmitWordResult>(
      `/api/v1/puzzles/session/submit?${q.toString()}`,
      { method: 'POST' }
    );
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

  revealHint: (puzzleId: string) =>
    apiRequest<string>(
      `/api/v1/puzzles/session/hint?puzzleId=${encodeURIComponent(puzzleId)}`,
      { method: 'POST' }
    ),

  getPuzzleByDifficulty: async (difficulty: PuzzleDifficulty) => {
    const q = new URLSearchParams({ difficulty: difficulty.toUpperCase() });
    const data = await apiRequest<BackendPuzzleView>(`/api/v1/puzzles?${q.toString()}`, {
      method: 'GET',
    });
    return { success: true as const, data: mapPuzzleView(data) };
  },

  getPuzzleById: async (_puzzleId: string) => ({
    success: false as const,
    data: null,
    message: 'Puzzle lookup by id is not available; use daily or difficulty endpoints.',
  }),
};

export const cardService = {
  getAllCards: () => apiRequest<BackendCard[]>('/api/v1/cards', { method: 'GET' }),

  getInventory: () =>
    apiRequest<CollectionResponse>('/api/v1/cards/inventory', {
      method: 'GET',
    }),

  getCollection: () =>
    apiRequest<CollectionResponse>('/api/v1/users/me/collection', {
      method: 'GET',
    }),

  drawCard: () =>
    apiRequest<BackendDrawResult>('/api/v1/cards/draw', { method: 'POST' }),

  equipCard: (cardId: string) =>
    apiRequest<CollectionResponse>(
      `/api/v1/cards/equip?cardId=${encodeURIComponent(cardId)}`,
      { method: 'POST' }
    ),
};

export const leaderboardService = {
  getLeaderboard: (page = 0, size = 20) =>
    apiRequest<BackendLeaderboardPage>(
      `/api/v1/leaderboard?page=${page}&size=${size}`,
      { method: 'GET' }
    ),

  /** Legacy limit query — backend maps to first page. */
  getTop: (limit = 20) =>
    apiRequest<BackendLeaderboardPage>(
      `/api/v1/leaderboard?limit=${limit}`,
      { method: 'GET' }
    ),

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
  getAchievements: () =>
    apiRequest<BackendUserAchievement[]>('/api/v1/achievements', { method: 'GET' }),

  evaluate: () =>
    apiRequest<BackendUserAchievement[]>('/api/v1/achievements/evaluate', {
      method: 'POST',
    }),
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

  /** Full Profile aggregate for the authenticated user. */
  getProfile: () =>
    apiRequest<ProfileResponse>('/api/v1/users/me/profile', {
      method: 'GET',
    }),

  resetProgression: () =>
    apiRequest<{
      userId: string;
      userName: string;
      userEmail: string;
      belt?: string;
      xp?: number;
      coins?: number;
    }>('/api/v1/users/reset', { method: 'POST' }),
};

// Re-export settings facade for account operations
export { settingsService } from './settingsService';
