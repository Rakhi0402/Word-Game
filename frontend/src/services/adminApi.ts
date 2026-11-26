import { apiRequest } from './apiClient';

export interface AdminOverview {
  userCount: number;
  adminCount: number;
  puzzleCount: number;
  activePuzzleCount: number;
  todayDailyPuzzleId: number | string | null;
  todayDailyDate: string | null;
  dictionaryAllowedCount: number;
  dictionarySourceVersion: string | null;
}

export interface AdminUserSummary {
  id: string;
  username: string;
  email: string;
  role: string;
  belt: string;
  xp: number;
  coins: number;
  enabled: boolean;
  locked: boolean;
  createdAt?: string;
  lastLogin?: string | null;
}

export interface AdminUserDetail extends AdminUserSummary {
  tokenVersion: number;
  lastPlayed?: string | null;
  wordsFound?: number | null;
  puzzlesCompleted?: number | null;
  cardsCollected?: number | null;
  achievementsEarned?: number | null;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminPuzzleSummary {
  /** Simple BIGINT primary key */
  id: number;
  difficulty: string;
  letters: string[];
  centerLetter: string;
  targetWordCount: number;
  pangramCount: number;
  validWordCount: number;
  active: boolean;
  puzzleDate?: string | null;
  fingerprint?: string;
  createdAt?: string;
}

export interface AdminPuzzleDetail extends AdminPuzzleSummary {
  minimumWordLength: number;
  xpReward: number;
  coinReward: number;
  generationBatchId?: string;
  dictionarySourceVersion?: string;
  validWords: string[];
  pangrams: string[];
}

export interface AdminDaily {
  scheduledDate: string;
  puzzleId: number;
  difficulty: string;
  letters: string[];
  centerLetter: string;
  active: boolean;
}

export interface AdminCard {
  id: string;
  name: string;
  rarity: string;
  image: string;
  stars: number;
  description?: string;
  bonuses?: string[];
}

export interface AdminAchievement {
  id: string;
  title: string;
  description?: string;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  iconName?: string;
}

export interface DictionaryImportResult {
  source: string;
  sourceVersion: string;
  processed: number;
  accepted: number;
  rejected: number;
  duplicates: number;
  updated: number;
}

export interface DictionaryImportProgress {
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  message?: string;
  processed: number;
  accepted: number;
  rejected: number;
  duplicates: number;
  updated: number;
  allowedCount: number;
  source?: string;
  sourceVersion?: string;
}

export interface AdminAiStatus {
  groqConfigured: boolean;
  dictionaryReady: boolean;
  dictionaryAllowedCount: number;
  minDictionaryWords: number;
  model: string;
  easyGate: string;
  mediumGate: string;
  hardGate: string;
  expertGate: string;
}

export interface AdminAiGenerateResult {
  batchId: string;
  difficulty: string;
  requested: number;
  created: number;
  groqUsed: boolean;
  puzzles: AdminPuzzleDetail[];
  rejected: string[];
}

export const adminApi = {
  overview: () => apiRequest<AdminOverview>('/api/v1/admin/overview'),

  listUsers: (q = '', page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.set('q', q);
    return apiRequest<PageResponse<AdminUserSummary>>(`/api/v1/admin/users?${params}`);
  },

  getUser: (id: string) => apiRequest<AdminUserDetail>(`/api/v1/admin/users/${id}`),

  patchUser: (id: string, body: { role?: string; enabled?: boolean; locked?: boolean }) =>
    apiRequest<AdminUserDetail>(`/api/v1/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  listPuzzles: (difficulty?: string, page = 0, size = 20) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (difficulty) params.set('difficulty', difficulty);
    return apiRequest<PageResponse<AdminPuzzleSummary>>(`/api/v1/admin/puzzles?${params}`);
  },

  getPuzzle: (id: number) => apiRequest<AdminPuzzleDetail>(`/api/v1/admin/puzzles/${id}`),

  generatePuzzle: (difficulty: string) =>
    apiRequest<AdminPuzzleDetail>(
      `/api/v1/admin/puzzles/generate?difficulty=${encodeURIComponent(difficulty)}`,
      { method: 'POST' }
    ),

  aiStatus: () => apiRequest<AdminAiStatus>('/api/v1/admin/puzzles/ai-status'),

  generatePuzzlesWithAi: (difficulty: string, count = 5) =>
    apiRequest<AdminAiGenerateResult>(
      `/api/v1/admin/puzzles/generate-ai?difficulty=${encodeURIComponent(difficulty)}&count=${count}`,
      { method: 'POST' }
    ),

  setPuzzleActive: (id: number, active: boolean) =>
    apiRequest<AdminPuzzleDetail>(`/api/v1/admin/puzzles/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  getDaily: (date?: string) => {
    const q = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiRequest<AdminDaily>(`/api/v1/admin/daily${q}`);
  },

  assignDaily: (puzzleId: number, date?: string) => {
    const params = new URLSearchParams({ puzzleId: String(puzzleId) });
    if (date) params.set('date', date);
    return apiRequest<AdminDaily>(`/api/v1/admin/daily/assign?${params}`, { method: 'POST' });
  },

  listCards: () => apiRequest<AdminCard[]>('/api/v1/admin/cards'),

  createCard: (body: AdminCard) =>
    apiRequest<AdminCard>('/api/v1/admin/cards', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateCard: (id: string, body: AdminCard) =>
    apiRequest<AdminCard>(`/api/v1/admin/cards/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  listAchievements: () => apiRequest<AdminAchievement[]>('/api/v1/admin/achievements'),

  createAchievement: (body: AdminAchievement) =>
    apiRequest<AdminAchievement>('/api/v1/admin/achievements', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateAchievement: (id: string, body: AdminAchievement) =>
    apiRequest<AdminAchievement>(`/api/v1/admin/achievements/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  dictionaryStats: () => apiRequest<AdminOverview>('/api/v1/admin/dictionary/stats'),

  /** Starts background chunked import — poll importDictionaryStatus. */
  importDictionary: () =>
    apiRequest<DictionaryImportProgress>('/api/v1/admin/dictionary/import', { method: 'POST' }),

  importDictionaryStatus: () =>
    apiRequest<DictionaryImportProgress>('/api/v1/admin/dictionary/import/status'),
};
