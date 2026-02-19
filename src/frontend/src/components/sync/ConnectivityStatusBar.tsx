import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSync } from '../../hooks/useSync';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function ConnectivityStatusBar() {
  const isOnline = useOnlineStatus();
  const { pendingCount, syncNow, isSyncing } = useSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`w-full py-2 px-4 flex items-center justify-between text-sm ${
        isOnline ? 'bg-warning/20 text-warning-foreground' : 'bg-destructive/20 text-destructive-foreground'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>En ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Hors ligne</span>
          </>
        )}
        {pendingCount > 0 && (
          <span className="ml-2">
            ({pendingCount} opération{pendingCount > 1 ? 's' : ''} en attente)
          </span>
        )}
      </div>
      {isOnline && pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={syncNow}
          disabled={isSyncing}
          className="h-7"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Synchroniser
        </Button>
      )}
    </div>
  );
}
