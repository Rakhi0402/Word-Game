import { getAccessToken, readStoredAuth } from '../apiClient';
import {
  idbClearAll,
  idbClearForUser,
  idbDelete,
  idbDeleteByTag,
  idbGet,
  idbSet,
} from './idbStore';
import {
  sessionClearAll,
  sessionDelete,
  sessionGet,
  sessionSet,
} from './sessionStore';

export type CacheStoreKind = 'idb' | 'session';

export interface CacheGetOptions {
  /** Preferred durable store; session is used as a hot layer in front of idb when store=idb */
  store?: CacheStoreKind;
  ttlMs: number;
  tags?: string[];
  /** Force network fetch and overwrite cache */
  force?: boolean;
  /** Scope cache to current authenticated user (default true) */
  scopedToUser?: boolean;
}

type InflightMap = Map<string, Promise<unknown>>;
const inflight: InflightMap = new Map();

function currentUserId(): string | null {
  return readStoredAuth()?.userId ?? null;
}

function scopedKey(key: string, scoped: boolean): string {
  if (!scoped) return key;
  const uid = currentUserId() || 'anon';
  return `u:${uid}:${key}`;
}

function isFresh(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

/**
 * Read-through cache: sessionStorage (hot) → IndexedDB (durable) → fetcher.
 * Concurrent callers for the same key share one in-flight network request.
 */
export async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheGetOptions
): Promise<T> {
  const store = options.store ?? 'idb';
  const scoped = options.scopedToUser !== false;
  const fullKey = scopedKey(key, scoped);
  const userId = currentUserId();

  if (!options.force) {
    const sessionHit = sessionGet<T>(fullKey);
    if (sessionHit && isFresh(sessionHit.expiresAt)) {
      return sessionHit.data;
    }

    if (store === 'idb') {
      const idbHit = await idbGet<T>(fullKey);
      if (idbHit && isFresh(idbHit.expiresAt)) {
        sessionSet(fullKey, {
          data: idbHit.data,
          cachedAt: idbHit.cachedAt,
          expiresAt: idbHit.expiresAt,
          userId: idbHit.userId,
        });
        return idbHit.data;
      }
    }
  }

  const existing = inflight.get(fullKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = (async () => {
    const data = await fetcher();
    const now = Date.now();
    const record = {
      data,
      cachedAt: now,
      expiresAt: now + options.ttlMs,
      userId,
      tags: options.tags,
    };

    sessionSet(fullKey, {
      data: record.data,
      cachedAt: record.cachedAt,
      expiresAt: record.expiresAt,
      userId: record.userId,
    });

    if (store === 'idb') {
      await idbSet({
        key: fullKey,
        data: record.data,
        cachedAt: record.cachedAt,
        expiresAt: record.expiresAt,
        userId: record.userId,
        tags: record.tags,
      });
    }

    return data;
  })();

  inflight.set(fullKey, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(fullKey);
  }
}

/** Write/overwrite a cache entry without fetching. */
export async function cachedSet<T>(
  key: string,
  data: T,
  options: Omit<CacheGetOptions, 'force'>
): Promise<void> {
  const store = options.store ?? 'idb';
  const scoped = options.scopedToUser !== false;
  const fullKey = scopedKey(key, scoped);
  const now = Date.now();
  const userId = currentUserId();

  sessionSet(fullKey, {
    data,
    cachedAt: now,
    expiresAt: now + options.ttlMs,
    userId,
  });

  if (store === 'idb') {
    await idbSet({
      key: fullKey,
      data,
      cachedAt: now,
      expiresAt: now + options.ttlMs,
      userId,
      tags: options.tags,
    });
  }
}

export async function invalidateKeys(keys: string[], scopedToUser = true): Promise<void> {
  for (const key of keys) {
    const fullKey = scopedKey(key, scopedToUser);
    sessionDelete(fullKey);
    await idbDelete(fullKey);
  }
}

export async function invalidateTags(tags: string[]): Promise<void> {
  for (const tag of tags) {
    await idbDeleteByTag(tag);
  }
  // Session entries are keyed; wipe all session cache on tag invalidation for safety.
  sessionClearAll();
}

/** Drop all game caches (logout / reset). Keeps auth tokens in localStorage. */
export async function clearClientCaches(userId?: string | null): Promise<void> {
  sessionClearAll();
  if (userId) {
    await idbClearForUser(userId);
  } else {
    await idbClearAll();
  }
}

/** Optional Cache Storage API for static asset URLs (images/audio). */
export async function warmAssetCache(urls: string[], cacheName = 'kungfu-assets-v1'): Promise<void> {
  if (typeof caches === 'undefined' || !getAccessToken()) {
    // Still allow warming without auth for public assets
  }
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(cacheName);
    await Promise.all(
      urls.filter(Boolean).map(async (url) => {
        try {
          const hit = await cache.match(url);
          if (!hit) {
            await cache.add(url);
          }
        } catch {
          /* ignore individual asset failures */
        }
      })
    );
  } catch {
    /* ignore */
  }
}
