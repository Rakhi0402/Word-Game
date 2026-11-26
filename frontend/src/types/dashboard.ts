import type { BeltColor, PuzzleDifficulty, RarityType, UserStats } from './index';

export interface DashboardProfile {
  userId: string;
  userName: string;
  userEmail: string;
}

export interface DashboardTraining {
  belt: BeltColor | string;
  rank: string;
  dojoLevel: number;
  xp: number;
  xpForCurrentBelt: number;
  xpForNextBelt: number;
  xpProgress: number;
  xpProgressPercentage: number;
  xpNeeded: number;
}

export interface DashboardWallet {
  coins: number;
  freeChestTokens: number;
}

export interface DashboardStreak {
  current: number;
  longest: number;
  streakShields: number;
  lastCompletedDate: string | null;
}

export interface DashboardActiveCard {
  cardId: string;
  name: string;
  rarity: RarityType | string;
  stars: number;
  bonuses: string[];
  chargesRemaining: number;
  status: string;
  image?: string;
}

export interface DashboardDailyQuest {
  available: boolean;
  puzzleId: number | string | null;
  difficulty: PuzzleDifficulty | string | null;
  completed: boolean;
  choicePuzzlesRemaining: number;
}

export interface DashboardResponse {
  profile: DashboardProfile;
  training: DashboardTraining;
  wallet: DashboardWallet;
  streak: DashboardStreak;
  activeCard: DashboardActiveCard | null;
  dailyQuest: DashboardDailyQuest;
  statistics: UserStats;
  achievementsUnlocked: number;
}

export interface BackendCard {
  id: string;
  name: string;
  rarity: string;
  image: string;
  stars: number;
  description?: string;
  bonuses?: string[];
}

export interface BackendUserCard {
  id: string;
  card: BackendCard;
  count: number;
  chargesRemaining: number;
  status: string;
}

/** GET /api/v1/cards/inventory and /users/me/collection */
export interface CollectionCardDto {
  id: string;
  owned: boolean;
  quantity: number;
  equipped: boolean;
  chargesRemaining: number;
  status: string;
  acquiredAt?: string | null;
  definition?: BackendCard;
}

export interface CollectionResponse {
  cards: CollectionCardDto[];
  equippedCardId: string | null;
}

export interface BackendDrawResult {
  card: BackendCard;
  duplicate: boolean;
  exhaustedRestore?: boolean;
  refundAmount: number;
  usedFreeToken?: boolean;
  coinsRemaining?: number;
  freeChestTokensRemaining?: number;
}

export interface BackendLeaderboardEntry {
  rank: number;
  userId?: string;
  username: string;
  xp: number;
  belt?: string;
  currentUser?: boolean;
}

export interface BackendLeaderboardMe {
  rank: number;
  xp: number;
  username: string;
  belt?: string;
  userId?: string;
}

export interface BackendLeaderboardPage {
  entries: BackendLeaderboardEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  currentUser: BackendLeaderboardMe | null;
}

export interface BackendAchievementDef {
  id: string;
  title: string;
  description: string;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  iconName: string;
}

export interface BackendUserAchievement {
  id: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string | null;
  achievement: BackendAchievementDef;
}

export interface BackendPuzzle {
  id: number;
  puzzleDate?: string;
  scheduledDate?: string | null;
  letters: string[];
  centerLetter: string;
  /** Playable answers for Spelling Bee–style local validation. */
  validWords?: string[];
  pangrams?: string[];
  difficulty: string;
  targetWordCount?: number;
  pangramCount?: number;
  minimumWordLength?: number;
  xpReward: number;
  coinReward: number;
  daily?: boolean;
}

export interface BackendPuzzleProgress {
  status: string;
  completed: boolean;
  foundWords: string[];
  score: number;
  streak: number;
  hintsUsed: number;
  wordsFoundCount: number;
  targetWordCount: number;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface BackendPuzzleView {
  puzzle: BackendPuzzle;
  progress: BackendPuzzleProgress;
}

export interface BackendSubmitWordResult {
  valid: boolean;
  duplicate: boolean;
  points: number;
  isPangram: boolean;
  completed: boolean;
  xpAwarded?: number;
  coinsAwarded?: number;
  totalXp?: number;
  totalCoins?: number;
  belt?: string;
}

export interface BackendDrawResult {
  card: BackendCard;
  duplicate: boolean;
  refundAmount: number;
}
