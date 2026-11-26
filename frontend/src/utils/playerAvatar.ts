import { CHARACTER_CARDS } from '../constants';

/**
 * Stable per-player avatar. Same user always gets the same image;
 * different users get different faces from the pool (not their equipped scroll).
 */
const AVATAR_POOL = CHARACTER_CARDS.map((c) => c.image).filter(Boolean);

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function playerAvatarUrl(
  userId?: string | null,
  username?: string | null
): string {
  if (!AVATAR_POOL.length) return '/assets/card_pack/po_common.png';
  const seed = (userId && userId.trim()) || (username && username.trim()) || 'disciple';
  return AVATAR_POOL[hashSeed(seed) % AVATAR_POOL.length];
}
