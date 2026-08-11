export type BeltColor = 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Brown' | 'Black';

export type PuzzleDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export type CardStatus = 'available' | 'exhausted';

export interface UserStats {
  wordsFound: number;
  cardsCollected: number;
  achievementsEarned: number;
  highestScore: number;
  daysPlayed: number;
  puzzlesCompleted: number;
  pangramsFound: number;
  perfectPuzzles: number;
  hintsUsed: number;
  hintsBought: number;
}

export interface User {
  username: string;
  email: string;
  belt: BeltColor;
  xp: number;
  xpNeeded: number;
  coins: number;
  streak: number;
  dailyStreak: number;
  streakShields: number;
  characterMultiplier: number;
  rank: string;
  permanentExtraDailyHint: boolean;
  bonusFreeHintsNextDay: number;
  freeChestTokens: number;
  claimedBeltRewards: BeltColor[];
  claimedStreakMilestones: number[];
  lastPuzzleDate: string | null;
  lastDifficultyChosen: PuzzleDifficulty | null;
  /** Calendar date for choicePuzzlesCompletedToday */
  choicePuzzlesDate: string | null;
  /** Extra difficulty-chosen puzzles finished today (cap MAX_CHOICE_PUZZLES_PER_DAY) */
  choicePuzzlesCompletedToday: number;
  stats: UserStats;
}

export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export interface CharacterCard {
  id: string;
  name: string;
  rarity: RarityType;
  image: string;
  stars: number;
  bonuses: string[];
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  belt: BeltColor;
  avatar: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
  rewardXp: number;
  rewardCoins: number;
  iconName: string;
}

export interface FoundWord {
  text: string;
  score: number;
  isPangram: boolean;
}

export interface DailyPuzzle {
  id: string;
  letters: string[];
  centerLetter: string;
  /** Never authoritative from API — kept optional for legacy UI that counted totals. */
  validWords?: string[];
  pangrams?: string[];
  /** Count of pangrams in the puzzle (from API; not the words). */
  pangramCount?: number;
  difficulty: PuzzleDifficulty;
  xpReward: number;
  coinReward: number;
  targetWordCount?: number;
  minimumWordLength?: number;
  scheduledDate?: string | null;
  daily?: boolean;
  /** Hydrated from server progress when available */
  completed?: boolean;
  foundWords?: string[];
  score?: number;
  streak?: number;
  hintsUsed?: number;
  status?: string;
}

/**
 * Client-only UI preferences (Settings page).
 * Not persisted on the backend — stored in localStorage key `kungfu_settings`.
 * Account identity and progression come from AuthUser / dashboard APIs.
 */
export interface UiPreferences {
  darkMode: boolean;
  sound: boolean;
}
