import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSync } from '../../hooks/useSync';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function ConnectivityStatusBar() {
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing, sync } = useSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-1.5 text-xs ${isOnline ? 'bg-yellow-500/20 text-yellow-200' : 'bg-destructive/20 text-destructive-foreground'}`}>
      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>
          {isOnline
            ? `${pendingCount} opération(s) en attente de synchronisation`
            : 'Hors ligne — les modifications seront synchronisées à la reconnexion'}
        </span>
      </div>
      {isOnline && pendingCount > 0 && (
        <button
          onClick={sync}
          disabled={isSyncing}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Synchroniser</span>
        </button>
      )}
    </div>
  );
}
