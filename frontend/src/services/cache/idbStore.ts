const DB_NAME = 'kungfu_word_quest_cache';
const DB_VERSION = 1;
const STORE = 'entries';

export interface IdbCacheRecord<T = unknown> {
  key: string;
  data: T;
  cachedAt: number;
  expiresAt: number;
  userId?: string | null;
  tags?: string[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('by_tag', 'tags', { multiEntry: true });
        store.createIndex('by_user', 'userId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB tx failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB tx aborted'));
  });
}

export async function idbGet<T>(key: string): Promise<IdbCacheRecord<T> | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as IdbCacheRecord<T>) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(record: IdbCacheRecord<T>): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    await txDone(tx);
  } catch {
    /* ignore quota / private mode */
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    await txDone(tx);
  } catch {
    /* ignore */
  }
}

export async function idbDeleteByTag(tag: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const index = store.index('by_tag');
    const req = index.getAllKeys(tag);
    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => {
        for (const key of req.result) {
          store.delete(key);
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
  } catch {
    /* ignore */
  }
}

export async function idbClearAll(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await txDone(tx);
  } catch {
    /* ignore */
  }
}

export async function idbClearForUser(userId: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const index = store.index('by_user');
    const req = index.openCursor(IDBKeyRange.only(userId));
    await new Promise<void>((resolve, reject) => {
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve();
          return;
        }
        cursor.delete();
        cursor.continue();
      };
      req.onerror = () => reject(req.error);
    });
    await txDone(tx);
  } catch {
    /* ignore */
  }
}
