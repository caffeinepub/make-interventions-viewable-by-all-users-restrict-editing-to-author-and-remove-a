import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from './useOnlineStatus';
import { getPendingOperationsCount, syncAllOperations } from '../offline/syncEngine';
import { toast } from 'sonner';

export function useSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const { isOnline } = useOnlineStatus();
  const queryClient = useQueryClient();

  const updatePendingCount = useCallback(async () => {
    const count = await getPendingOperationsCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [updatePendingCount]);

  const syncNow = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncAllOperations();
      await updatePendingCount();
      queryClient.invalidateQueries();
      toast.success('Synchronisation terminée');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Erreur de synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, queryClient, updatePendingCount]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !isSyncing) {
      syncNow();
    }
  }, [isOnline, pendingCount, isSyncing, syncNow]);

  return {
    isSyncing,
    pendingCount,
    syncNow,
    canSync: isOnline && pendingCount > 0 && !isSyncing,
  };
}
