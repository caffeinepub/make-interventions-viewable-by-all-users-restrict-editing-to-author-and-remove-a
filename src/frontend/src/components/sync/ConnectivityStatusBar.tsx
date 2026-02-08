import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useSync } from '../../hooks/useSync';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Loader2 } from 'lucide-react';
import AppBadge from '../common/AppBadge';

export default function ConnectivityStatusBar() {
  const { isOnline } = useOnlineStatus();
  const { isSyncing, pendingCount, syncNow, canSync } = useSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-14 z-40 border-b bg-background px-4 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm font-medium">{isOnline ? 'En ligne' : 'Hors ligne'}</span>
          {pendingCount > 0 && (
            <AppBadge variant="warning">
              {pendingCount} en attente
            </AppBadge>
          )}
        </div>
        {canSync && (
          <Button size="sm" variant="outline" onClick={syncNow} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Sync...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-3 w-3" />
                Synchroniser
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
