import { useSync } from '../../hooks/useSync';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Loader2 } from 'lucide-react';

export default function ConnectivityStatusBar() {
  const { isOnline, pendingCount, isSyncing, sync } = useSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div
      className={`flex items-center justify-between px-4 py-1.5 text-xs ${
        !isOnline
          ? 'bg-destructive/10 text-destructive'
          : 'bg-warning/10 text-warning'
      }`}
    >
      <div className="flex items-center gap-2">
        {!isOnline && <WifiOff className="w-3.5 h-3.5" />}
        <span>
          {!isOnline
            ? 'Hors ligne'
            : `${pendingCount} opération(s) en attente de synchronisation`}
        </span>
      </div>
      {isOnline && pendingCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={sync}
          disabled={isSyncing}
          className="h-6 px-2 text-xs"
        >
          {isSyncing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span className="ml-1">Synchroniser</span>
        </Button>
      )}
    </div>
  );
}
