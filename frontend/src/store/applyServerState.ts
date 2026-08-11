import type { AppDispatch } from './index';
import type { DashboardResponse, BackendUserCard, BackendUserAchievement, BackendLeaderboardEntry, BackendLeaderboardPage, CollectionResponse } from '../types/dashboard';
import type { ProfileResponse, ProfileAchievement } from '../types/profile';
import type { Achievement, BeltColor, LeaderboardEntry, User } from '../types';
import { defaultUser, replaceUser } from './userSlice';
import { replaceCards, getCharacterMultiplier } from './cardsSlice';
import { setAchievements } from './achievementsSlice';
import { setLeaderboard } from './leaderboardSlice';
import { CHARACTER_CARDS } from '../constants';
import { mapCollectionToCards, mapInventoryToCards } from './mapCollection';

export { mapCollectionToCards, mapInventoryToCards } from './mapCollection';

const asBelt = (belt: string | undefined): BeltColor => {
  const allowed: BeltColor[] = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Brown', 'Black'];
  return (allowed.includes(belt as BeltColor) ? belt : 'White') as BeltColor;
};

export const mapDashboardToUser = (dash: DashboardResponse, previous?: Partial<User>): User => {
  const multiplier = getCharacterMultiplier(dash.activeCard?.cardId ?? 'po_common');
  return {
    ...defaultUser,
    ...previous,
    username: dash.profile.userName,
    email: dash.profile.userEmail,
    belt: asBelt(dash.training.belt),
    rank: dash.training.rank,
    xp: dash.training.xp,
    xpNeeded: dash.training.xpNeeded,
    coins: dash.wallet.coins,
    freeChestTokens: dash.wallet.freeChestTokens,
    streak: dash.streak.current,
    dailyStreak: dash.streak.current,
    streakShields: dash.streak.streakShields,
    lastPuzzleDate: dash.streak.lastCompletedDate,
    choicePuzzlesCompletedToday: Math.max(
      0,
      5 - (dash.dailyQuest.choicePuzzlesRemaining ?? 5)
    ),
    choicePuzzlesDate: dash.streak.lastCompletedDate
      ? new Date().toISOString().slice(0, 10)
      : previous?.choicePuzzlesDate ?? null,
    characterMultiplier: multiplier,
    stats: { ...dash.statistics },
    claimedBeltRewards: previous?.claimedBeltRewards ?? ['White'],
    claimedStreakMilestones: previous?.claimedStreakMilestones ?? [],
    permanentExtraDailyHint: previous?.permanentExtraDailyHint ?? false,
    bonusFreeHintsNextDay: previous?.bonusFreeHintsNextDay ?? 0,
    lastDifficultyChosen: previous?.lastDifficultyChosen ?? null,
  };
};

export const mapProfileToUser = (profile: ProfileResponse, previous?: Partial<User>): User => {
  const equippedId = profile.equippedCard?.id ?? 'po_common';
  const multiplier = getCharacterMultiplier(equippedId);
  return {
    ...defaultUser,
    ...previous,
    username: profile.user.userName,
    email: profile.user.userEmail,
    belt: asBelt(profile.progression.belt),
    rank: profile.progression.rank,
    xp: profile.progression.xp,
    xpNeeded: profile.progression.xpForNextBelt,
    coins: profile.progression.coins,
    streak: profile.streak.current,
    dailyStreak: profile.streak.daily,
    streakShields: profile.streak.shields,
    lastPuzzleDate: profile.streak.lastCompletedDate,
    characterMultiplier: multiplier,
    stats: { ...profile.statistics },
    freeChestTokens: previous?.freeChestTokens ?? 0,
    choicePuzzlesCompletedToday: previous?.choicePuzzlesCompletedToday ?? 0,
    choicePuzzlesDate: previous?.choicePuzzlesDate ?? null,
    claimedBeltRewards: previous?.claimedBeltRewards ?? ['White'],
    claimedStreakMilestones: previous?.claimedStreakMilestones ?? [],
    permanentExtraDailyHint: previous?.permanentExtraDailyHint ?? false,
    bonusFreeHintsNextDay: previous?.bonusFreeHintsNextDay ?? 0,
    lastDifficultyChosen: previous?.lastDifficultyChosen ?? null,
  };
};

export const mapAchievements = (list: BackendUserAchievement[]): Achievement[] => {
  if (!list?.length) return [];
  return list.map((ua) => ({
    id: ua.achievement?.id || ua.id,
    title: ua.achievement?.title || 'Achievement',
    description: ua.achievement?.description || '',
    unlocked: ua.unlocked,
    progress: ua.progress,
    target: ua.achievement?.target ?? 1,
    rewardXp: ua.achievement?.rewardXp ?? 0,
    rewardCoins: ua.achievement?.rewardCoins ?? 0,
    iconName: ua.achievement?.iconName || 'trophy',
  }));
};

export const mapProfileAchievements = (list: ProfileAchievement[]): Achievement[] => {
  if (!list?.length) return [];
  return list.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description || '',
    unlocked: a.unlocked,
    progress: a.progress,
    target: a.target,
    rewardXp: a.rewardXp,
    rewardCoins: a.rewardCoins,
    iconName: a.iconName || 'trophy',
  }));
};

export const mapLeaderboard = (entries: BackendLeaderboardEntry[]): LeaderboardEntry[] =>
  entries.map((e) => ({
    rank: e.rank,
    username: e.username,
    score: e.xp,
    belt: asBelt(e.belt),
    avatar: CHARACTER_CARDS[0]?.image || '',
  }));

export const mapLeaderboardPage = (
  page: BackendLeaderboardPage
): { entries: LeaderboardEntry[]; currentUserRank: number } => ({
  entries: mapLeaderboard(page.entries || []),
  currentUserRank: page.currentUser?.rank ?? 0,
});

/** Apply authoritative dashboard + related payloads into Redux caches. */
export const applyServerSnapshot = (
  dispatch: AppDispatch,
  opts: {
    dashboard: DashboardResponse;
    inventory?: BackendUserCard[] | CollectionResponse;
    achievements?: BackendUserAchievement[];
    leaderboard?: BackendLeaderboardEntry[] | BackendLeaderboardPage;
  }
) => {
  const { dashboard } = opts;
  dispatch(replaceUser(mapDashboardToUser(dashboard)));

  if (opts.inventory) {
    dispatch(
      replaceCards(
        mapInventoryToCards(opts.inventory, opts.dashboard.activeCard?.cardId)
      )
    );
  } else if (dashboard.activeCard) {
    dispatch(
      replaceCards(
        mapInventoryToCards(
          [
            {
              id: 'tmp',
              card: {
                id: dashboard.activeCard.cardId,
                name: dashboard.activeCard.name,
                rarity: String(dashboard.activeCard.rarity),
                image: dashboard.activeCard.image || '',
                stars: dashboard.activeCard.stars,
                bonuses: dashboard.activeCard.bonuses,
              },
              count: 1,
              chargesRemaining: dashboard.activeCard.chargesRemaining,
              status: dashboard.activeCard.status,
            },
          ],
          dashboard.activeCard.cardId
        )
      )
    );
  }

  if (opts.achievements) {
    dispatch(setAchievements(mapAchievements(opts.achievements)));
  }

  if (opts.leaderboard) {
    if (Array.isArray(opts.leaderboard)) {
      dispatch(setLeaderboard({ entries: mapLeaderboard(opts.leaderboard) }));
    } else {
      const mapped = mapLeaderboardPage(opts.leaderboard);
      dispatch(setLeaderboard(mapped));
    }
  }
};

/** Apply Profile API payload into Redux caches (backend is source of truth). */
export const applyProfileSnapshot = (
  dispatch: AppDispatch,
  opts: {
    profile: ProfileResponse;
    inventory?: BackendUserCard[] | CollectionResponse;
  }
) => {
  const { profile } = opts;
  dispatch(replaceUser(mapProfileToUser(profile)));
  dispatch(setAchievements(mapProfileAchievements(profile.achievements || [])));

  if (opts.inventory) {
    const collection =
      !Array.isArray(opts.inventory) && 'cards' in opts.inventory
        ? opts.inventory
        : undefined;
    dispatch(
      replaceCards(
        collection
          ? mapCollectionToCards(collection)
          : mapInventoryToCards(opts.inventory, opts.profile.equippedCard?.id)
      )
    );
  } else if (profile.equippedCard) {
    dispatch(
      replaceCards(
        mapInventoryToCards(
          [
            {
              id: 'tmp',
              card: {
                id: profile.equippedCard.id,
                name: profile.equippedCard.id,
                rarity: 'common',
                image: '',
                stars: 1,
              },
              count: 1,
              chargesRemaining: profile.equippedCard.chargesRemaining,
              status: profile.equippedCard.status,
            },
          ],
          profile.equippedCard.id
        )
      )
    );
  }
};
