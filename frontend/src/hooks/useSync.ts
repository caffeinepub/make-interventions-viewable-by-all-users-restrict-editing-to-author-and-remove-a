import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';

export function useSync() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      // Sync logic placeholder
      setPendingCount(0);
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      sync();
    }
  }, [isOnline, pendingCount, sync]);

  return { pendingCount, isSyncing, sync };
}
