import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedOnly({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();

  const isStillInitializing = isInitializing || loginStatus === 'initializing';

  useEffect(() => {
    if (!isStillInitializing && !identity) {
      navigate({ to: '/login' });
    }
  }, [identity, isStillInitializing, navigate]);

  if (isStillInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
