export interface SessionCacheRecord<T = unknown> {
  data: T;
  cachedAt: number;
  expiresAt: number;
  userId?: string | null;
}

const PREFIX = 'kungfu_scache:';

export function sessionGet<T>(key: string): SessionCacheRecord<T> | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as SessionCacheRecord<T>;
  } catch {
    return null;
  }
}

export function sessionSet<T>(key: string, record: SessionCacheRecord<T>): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(record));
  } catch {
    /* ignore quota */
  }
}

export function sessionDelete(key: string): void {
  try {
    sessionStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

export function sessionClearPrefix(prefix = ''): void {
  try {
    const full = PREFIX + prefix;
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(full)) keys.push(k);
    }
    for (const k of keys) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

export function sessionClearAll(): void {
  sessionClearPrefix('');
}
