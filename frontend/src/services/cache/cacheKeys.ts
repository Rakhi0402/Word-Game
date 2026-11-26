/** TTL policy for infrequently changing payloads (ms). */
export const CacheTTL = {
  /** Card catalog rarely changes */
  CARDS_CATALOG: 24 * 60 * 60 * 1000,
  /** Dashboard snapshot — soft cache between navigations */
  DASHBOARD: 90 * 1000,
  /** Profile aggregate */
  PROFILE: 2 * 60 * 1000,
  /** Collection / inventory ownership */
  COLLECTION: 2 * 60 * 1000,
  /** Achievements progress */
  ACHIEVEMENTS: 2 * 60 * 1000,
  /** Leaderboard ranks */
  LEADERBOARD: 3 * 60 * 1000,
  /** Daily puzzle for the calendar day */
  DAILY_PUZZLE: 30 * 60 * 1000,
  /** Choice puzzle by difficulty — short session cache */
  CHOICE_PUZZLE: 5 * 60 * 1000,
  /** Difficulty pool (10 defs) for local play warm-cache */
  PUZZLE_POOL: 6 * 60 * 60 * 1000,
} as const;

export const CacheTags = {
  DASHBOARD: 'dashboard',
  PROFILE: 'profile',
  COLLECTION: 'collection',
  ACHIEVEMENTS: 'achievements',
  LEADERBOARD: 'leaderboard',
  CARDS: 'cards',
  PUZZLE: 'puzzle',
  USER: 'user',
} as const;

export function cacheKey(parts: Array<string | number | null | undefined>): string {
  return parts.filter((p) => p !== null && p !== undefined && p !== '').join(':');
}

export function todayKey(timeZone = 'Asia/Kolkata'): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}
