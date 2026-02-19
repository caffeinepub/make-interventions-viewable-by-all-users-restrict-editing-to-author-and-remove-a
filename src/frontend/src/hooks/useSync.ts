import { useState, useEffect } from 'react';
import { useActor } from './useActor';
import { useOnlineStatus } from './useOnlineStatus';
import { syncOfflineOperations } from '../offline/syncEngine';
import { getOfflineOperations } from '../offline/outbox';

export function useSync() {
  const { actor } = useActor();
  const { isOnline } = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updatePendingCount = async () => {
      const operations = await getOfflineOperations();
      setPendingCount(operations.length);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOnline && actor && pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  }, [isOnline, actor, pendingCount]);

  const syncNow = async () => {
    if (!actor || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncOfflineOperations(actor);
      const operations = await getOfflineOperations();
      setPendingCount(operations.length);
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    pendingCount,
    syncNow,
    canSync: isOnline && pendingCount > 0,
  };
}
