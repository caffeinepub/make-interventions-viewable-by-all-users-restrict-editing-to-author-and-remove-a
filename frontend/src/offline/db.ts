const DB_NAME = 'ClientDossiersDB';
const DB_VERSION = 1;

export interface OfflineOperation {
  id?: number;
  type: string;
  data: any;
  timestamp: number;
}

let dbInstance: IDBDatabase | null = null;
let dbInitFailed = false;

export async function getDB(): Promise<IDBDatabase | null> {
  if (dbInitFailed) return null;
  if (dbInstance) return dbInstance;

  try {
    return await new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      };
    });
  } catch (error) {
    console.warn('[db] IndexedDB initialization failed, offline features disabled:', error);
    dbInitFailed = true;
    return null;
  }
}

export async function addToOutbox(operation: OfflineOperation): Promise<void> {
  const db = await getDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['outbox'], 'readwrite');
      const store = transaction.objectStore('outbox');
      const request = store.add(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    } catch (error) {
      console.warn('[db] addToOutbox failed:', error);
      resolve();
    }
  });
}

export async function getAllFromOutbox(): Promise<OfflineOperation[]> {
  const db = await getDB();
  if (!db) return [];
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['outbox'], 'readonly');
      const store = transaction.objectStore('outbox');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    } catch (error) {
      console.warn('[db] getAllFromOutbox failed:', error);
      resolve([]);
    }
  });
}

export async function removeFromOutbox(id: number): Promise<void> {
  const db = await getDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['outbox'], 'readwrite');
      const store = transaction.objectStore('outbox');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    } catch (error) {
      console.warn('[db] removeFromOutbox failed:', error);
      resolve();
    }
  });
}

export async function cacheData(key: string, data: any): Promise<void> {
  const db = await getDB();
  if (!db) return;
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(data, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    } catch (error) {
      console.warn('[db] cacheData failed:', error);
      resolve();
    }
  });
}

export async function getCachedData(key: string): Promise<any> {
  const db = await getDB();
  if (!db) return undefined;
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    } catch (error) {
      console.warn('[db] getCachedData failed:', error);
      resolve(undefined);
    }
  });
}
