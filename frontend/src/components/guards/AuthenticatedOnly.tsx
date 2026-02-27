import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';

interface AuthenticatedOnlyProps {
  children: React.ReactNode;
}

export default function AuthenticatedOnly({ children }: AuthenticatedOnlyProps) {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();

  const isLoading = isInitializing || loginStatus === 'logging-in';

  useEffect(() => {
    if (!isLoading && !identity) {
      navigate({ to: '/login' });
    }
  }, [identity, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (!identity) return null;

  return <>{children}</>;
}
