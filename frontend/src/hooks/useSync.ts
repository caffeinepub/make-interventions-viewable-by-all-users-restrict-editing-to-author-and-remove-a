import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { useActor } from './useActor';
import { getAll as getAllOutbox, remove as removeOutbox } from '../offline/outbox';
import { syncPendingOperations } from '../offline/syncEngine';

export function useSync() {
  const isOnline = useOnlineStatus();
  const { actor } = useActor();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getAllOutbox();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const sync = useCallback(async () => {
    if (!actor || !isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncPendingOperations(actor);
      await refreshPendingCount();
    } catch {
      // silent
    } finally {
      setIsSyncing(false);
    }
  }, [actor, isOnline, isSyncing, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && actor) {
      sync();
    }
  }, [isOnline, pendingCount, actor, sync]);

  return { isOnline, pendingCount, isSyncing, sync, refreshPendingCount };
}
