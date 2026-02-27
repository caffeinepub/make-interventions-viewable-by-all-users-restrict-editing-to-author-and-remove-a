const DB_NAME = 'vial-traite-offline';
const DB_VERSION = 1;

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase | null> {
  if (db) return db;

  try {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains('outbox')) {
          const outboxStore = database.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
          outboxStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!database.objectStoreNames.contains('cache')) {
          database.createObjectStore('cache', { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function addToOutbox(operation: Record<string, unknown>): Promise<void> {
  try {
    const database = await getDB();
    if (!database) return;

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const request = store.add({ ...operation, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silent fallback
  }
}

export async function getOutboxItems(): Promise<Array<Record<string, unknown> & { id: number }>> {
  try {
    const database = await getDB();
    if (!database) return [];

    return await new Promise((resolve, reject) => {
      const tx = database.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function removeFromOutbox(id: number): Promise<void> {
  try {
    const database = await getDB();
    if (!database) return;

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silent fallback
  }
}

export async function setCacheItem(key: string, value: unknown): Promise<void> {
  try {
    const database = await getDB();
    if (!database) return;

    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction('cache', 'readwrite');
      const store = tx.objectStore('cache');
      const request = store.put({ key, value, updatedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // silent fallback
  }
}

export async function getCacheItem<T>(key: string): Promise<T | null> {
  try {
    const database = await getDB();
    if (!database) return null;

    return await new Promise((resolve, reject) => {
      const tx = database.transaction('cache', 'readonly');
      const store = tx.objectStore('cache');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}
