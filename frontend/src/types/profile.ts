import type { BeltColor, UserStats } from './index';

export interface ProfileUser {
  id: string;
  userName: string;
  userEmail: string;
}

export interface ProfileProgression {
  xp: number;
  belt: BeltColor | string;
  rank: string;
  level: number;
  dojoLevel: number;
  xpForCurrentBelt: number;
  xpForNextBelt: number;
  xpProgress: number;
  xpProgressPercentage: number;
  coins: number;
}

export interface ProfileStreak {
  current: number;
  daily: number;
  shields: number;
  longest: number;
  lastCompletedDate: string | null;
  /** ISO date strings from server history; empty until history is persisted */
  recentTrainingDays: string[];
}

export interface ProfileEquippedCard {
  id: string;
  chargesRemaining: number;
  status: string;
}

export interface ProfileAchievement {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedAt?: string | null;
  rewardXp: number;
  rewardCoins: number;
  iconName: string;
}

export interface ProfileResponse {
  user: ProfileUser;
  progression: ProfileProgression;
  streak: ProfileStreak;
  statistics: UserStats;
  equippedCard: ProfileEquippedCard | null;
  achievements: ProfileAchievement[];
}
