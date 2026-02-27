import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && identity) {
      navigate({ to: '/' });
    }
  }, [identity, isInitializing, navigate]);

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        navigate({ to: '/' });
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Initialisation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/vial-traite-logo.dim_400x200.png"
            alt="Vial Traite Service"
            className="w-48 h-auto"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Vial Traite Service</h1>
            <p className="text-muted-foreground text-sm mt-1">Gestion des clients et interventions</p>
          </div>
        </div>

        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Connexion</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Authentification sécurisée via Internet Identity
        </p>
      </div>
    </div>
  );
}
