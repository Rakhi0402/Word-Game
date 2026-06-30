export type BeltColor = 'White' | 'Yellow' | 'Orange' | 'Green' | 'Blue' | 'Brown' | 'Black';

export interface UserStats {
  wordsFound: number;
  cardsCollected: number;
  achievementsEarned: number;
  highestScore: number;
  daysPlayed: number;
  puzzlesCompleted: number;
}

export interface User {
  username: string;
  email: string;
  belt: BeltColor;
  xp: number;
  xpNeeded: number;
  coins: number;
  streak: number;
  rank: string; // e.g., "Novice", "Disciple", "Warrior", "Grandmaster"
  stats: UserStats;
}

export type RarityType = 'common' | 'rare' | 'epic' | 'legendary';

export interface CharacterCard {
  id: string;
  name: string;
  rarity: RarityType;
  image: string; // Relative path from public folder
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

export interface DailyPuzzle {
  id: string;
  letters: string[]; // 7 letters
  centerLetter: string;
  validWords: string[]; // Words that can be made with these letters containing the center letter
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  xpReward: number;
  coinReward: number;
}
