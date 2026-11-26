import { CacheTags, cacheKey, todayKey } from './cacheKeys';
import { clearClientCaches, invalidateKeys, invalidateTags } from './clientCache';

/** After gameplay mutations that change economy / progression. */
export async function invalidateAfterGameplay(): Promise<void> {
  await invalidateTags([
    CacheTags.DASHBOARD,
    CacheTags.PROFILE,
    CacheTags.ACHIEVEMENTS,
    CacheTags.LEADERBOARD,
    CacheTags.PUZZLE,
  ]);
  await invalidateKeys([
    'dashboard',
    'profile',
    'achievements',
    cacheKey(['puzzle', 'daily', todayKey()]),
  ]);
}

/** After card draw / equip. */
export async function invalidateAfterCollectionChange(): Promise<void> {
  await invalidateTags([CacheTags.COLLECTION, CacheTags.DASHBOARD, CacheTags.PROFILE]);
  await invalidateKeys(['collection', 'inventory', 'dashboard', 'profile']);
}

/** After full progression reset. */
export async function invalidateAfterReset(): Promise<void> {
  await clearClientCaches();
}

/** On logout. */
export async function invalidateOnLogout(userId?: string | null): Promise<void> {
  await clearClientCaches(userId);
}
