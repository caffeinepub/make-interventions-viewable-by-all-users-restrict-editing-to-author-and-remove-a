import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedOnly({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return null;
  }

  return <>{children}</>;
}
