import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { User, BeltColor, PuzzleDifficulty } from '../types';
import { BELT_LEVELS } from '../constants';
import { BELT_PROGRESSION, MAX_STREAK_SHIELDS, STARTING_COINS } from '../constants/rewards';

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

const defaultUser: User = {
  username: 'Young Panda',
  email: '',
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
};

export { defaultUser };

const migrateUser = (raw: Partial<User>): User => ({
  ...defaultUser,
  ...raw,
  stats: { ...emptyStats(), ...raw.stats },
  claimedBeltRewards: raw.claimedBeltRewards ?? ['White'],
  claimedStreakMilestones: raw.claimedStreakMilestones ?? [],
  streakShields: raw.streakShields ?? 0,
  permanentExtraDailyHint: raw.permanentExtraDailyHint ?? false,
  bonusFreeHintsNextDay: raw.bonusFreeHintsNextDay ?? 0,
  freeChestTokens: raw.freeChestTokens ?? 0,
  lastPuzzleDate: raw.lastPuzzleDate ?? null,
  lastDifficultyChosen: raw.lastDifficultyChosen ?? null,
  choicePuzzlesDate: raw.choicePuzzlesDate ?? null,
  choicePuzzlesCompletedToday: raw.choicePuzzlesCompletedToday ?? 0,
});

const initialState: User = defaultUser;

export const evaluateBelt = (xp: number): { belt: BeltColor; rank: string; xpNeeded: number } => {
  let activeBelt = BELT_PROGRESSION[0];
  for (let i = 0; i < BELT_PROGRESSION.length; i++) {
    if (xp >= BELT_PROGRESSION[i].minXp) activeBelt = BELT_PROGRESSION[i];
    else break;
  }
  const idx = BELT_PROGRESSION.indexOf(activeBelt);
  const nextBelt = BELT_PROGRESSION[idx + 1] || activeBelt;
  return { belt: activeBelt.belt, rank: activeBelt.title, xpNeeded: nextBelt.minXp };
};

const persist = (_state: User) => {
  /* Game progression is server-authoritative; do not persist to localStorage. */
};

export interface BeltUpResult {
  belt: BeltColor;
  title: string;
  coins: number;
  perk: string;
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    replaceUser(_state, action: PayloadAction<User>) {
      const next = migrateUser(action.payload);
      persist(next);
      return next;
    },
    setUserProfile(state, action: PayloadAction<{ username: string; email: string }>) {
      state.username = action.payload.username;
      state.email = action.payload.email;
      persist(state);
    },
    setCharacterMultiplier(state, action: PayloadAction<number>) {
      state.characterMultiplier = action.payload;
      persist(state);
    },
    setDailyStreak(state, action: PayloadAction<number>) {
      state.dailyStreak = action.payload;
      state.streak = action.payload;
      persist(state);
    },
    addStreakShields(state, action: PayloadAction<number>) {
      state.streakShields = Math.min(MAX_STREAK_SHIELDS, state.streakShields + action.payload);
      persist(state);
    },
    consumeStreakShield(state) {
      if (state.streakShields > 0) state.streakShields -= 1;
      persist(state);
    },
    setLastPuzzleMeta(
      state,
      action: PayloadAction<{ date: string; difficulty: PuzzleDifficulty }>
    ) {
      state.lastPuzzleDate = action.payload.date;
      state.lastDifficultyChosen = action.payload.difficulty;
      persist(state);
    },
    incrementChoicePuzzlesToday(state, action: PayloadAction<string>) {
      const date = action.payload;
      if (state.choicePuzzlesDate !== date) {
        state.choicePuzzlesDate = date;
        state.choicePuzzlesCompletedToday = 1;
      } else {
        state.choicePuzzlesCompletedToday += 1;
      }
      persist(state);
    },
    syncChoicePuzzlesDay(state, action: PayloadAction<string>) {
      if (state.choicePuzzlesDate !== action.payload) {
        state.choicePuzzlesDate = action.payload;
        state.choicePuzzlesCompletedToday = 0;
        persist(state);
      }
    },
    addXp(state, action: PayloadAction<number>) {
      state.xp += action.payload;
      const info = evaluateBelt(state.xp);
      state.belt = info.belt;
      state.rank = info.rank;
      state.xpNeeded = info.xpNeeded;
      persist(state);
    },
    /** Apply XP and return newly crossed belts for payout handling */
    applyXpWithBeltUps(state, action: PayloadAction<number>) {
      const beforeXp = state.xp;
      state.xp += action.payload;
      const info = evaluateBelt(state.xp);
      state.belt = info.belt;
      state.rank = info.rank;
      state.xpNeeded = info.xpNeeded;
      persist(state);
      void beforeXp;
    },
    claimBeltReward(state, action: PayloadAction<BeltColor>) {
      if (!state.claimedBeltRewards.includes(action.payload)) {
        state.claimedBeltRewards.push(action.payload);
      }
      persist(state);
    },
    claimStreakMilestone(state, action: PayloadAction<number>) {
      if (!state.claimedStreakMilestones.includes(action.payload)) {
        state.claimedStreakMilestones.push(action.payload);
      }
      persist(state);
    },
    addCoins(state, action: PayloadAction<number>) {
      state.coins += action.payload;
      persist(state);
    },
    deductCoins(state, action: PayloadAction<number>) {
      state.coins = Math.max(0, state.coins - action.payload);
      persist(state);
    },
    addFreeChestToken(state, action: PayloadAction<number | undefined>) {
      state.freeChestTokens += action.payload ?? 1;
      persist(state);
    },
    consumeFreeChestToken(state) {
      if (state.freeChestTokens > 0) state.freeChestTokens -= 1;
      persist(state);
    },
    setPermanentExtraDailyHint(state) {
      state.permanentExtraDailyHint = true;
      persist(state);
    },
    addBonusFreeHintsNextDay(state, action: PayloadAction<number>) {
      state.bonusFreeHintsNextDay += action.payload;
      persist(state);
    },
    clearBonusFreeHintsNextDay(state) {
      state.bonusFreeHintsNextDay = 0;
      persist(state);
    },
    incrementWordsFound(state) {
      state.stats.wordsFound += 1;
      persist(state);
    },
    addWordsFound(state, action: PayloadAction<number>) {
      state.stats.wordsFound += action.payload;
      persist(state);
    },
    addPangramsFound(state, action: PayloadAction<number>) {
      state.stats.pangramsFound += action.payload;
      persist(state);
    },
    incrementPerfectPuzzles(state) {
      state.stats.perfectPuzzles += 1;
      persist(state);
    },
    incrementHintsUsed(state) {
      state.stats.hintsUsed += 1;
      persist(state);
    },
    incrementHintsBought(state) {
      state.stats.hintsBought += 1;
      persist(state);
    },
    updateHighestScore(state, action: PayloadAction<number>) {
      if (action.payload > state.stats.highestScore) state.stats.highestScore = action.payload;
      persist(state);
    },
    incrementCardsCount(state) {
      state.stats.cardsCollected += 1;
      persist(state);
    },
    incrementAchievementsCount(state) {
      state.stats.achievementsEarned += 1;
      persist(state);
    },
    incrementPuzzlesCompleted(state, action: PayloadAction<{ countDay?: boolean } | undefined>) {
      state.stats.puzzlesCompleted += 1;
      if (action.payload?.countDay !== false) {
        state.stats.daysPlayed += 1;
      }
      persist(state);
    },
    incrementStreak(state) {
      state.streak += 1;
      state.dailyStreak += 1;
      persist(state);
    },
    resetUser: () => {
      localStorage.removeItem('kungfu_user');
      return {
        ...defaultUser,
        stats: emptyStats(),
        claimedBeltRewards: ['White'] as BeltColor[],
      };
    },
  },
});

export const {
  replaceUser,
  setUserProfile,
  setCharacterMultiplier,
  setDailyStreak,
  addStreakShields,
  consumeStreakShield,
  setLastPuzzleMeta,
  incrementChoicePuzzlesToday,
  syncChoicePuzzlesDay,
  addXp,
  applyXpWithBeltUps,
  claimBeltReward,
  claimStreakMilestone,
  addCoins,
  deductCoins,
  addFreeChestToken,
  consumeFreeChestToken,
  setPermanentExtraDailyHint,
  addBonusFreeHintsNextDay,
  clearBonusFreeHintsNextDay,
  incrementWordsFound,
  addWordsFound,
  addPangramsFound,
  incrementPerfectPuzzles,
  incrementHintsUsed,
  incrementHintsBought,
  updateHighestScore,
  incrementCardsCount,
  incrementAchievementsCount,
  incrementPuzzlesCompleted,
  incrementStreak,
  resetUser,
} = userSlice.actions;

export const getUnclaimedBeltUps = (prevXp: number, nextXp: number, claimed: BeltColor[]): BeltUpResult[] => {
  const results: BeltUpResult[] = [];
  for (const level of BELT_PROGRESSION) {
    if (level.minXp <= 0) continue;
    if (prevXp < level.minXp && nextXp >= level.minXp && !claimed.includes(level.belt)) {
      results.push({
        belt: level.belt,
        title: level.title,
        coins: level.rankUpCoins,
        perk: level.rankUpPerk,
      });
    }
  }
  return results;
};

export { BELT_LEVELS };
export default userSlice.reducer;
