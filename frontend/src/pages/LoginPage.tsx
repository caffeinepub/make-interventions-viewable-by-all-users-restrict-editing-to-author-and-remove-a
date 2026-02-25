import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, LogIn } from 'lucide-react';

export default function LoginPage() {
  const { login, clear, loginStatus, identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  useEffect(() => {
    if (!isInitializing && isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isAuthenticated, isInitializing, navigate]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      if (error?.message === 'User is already authenticated') {
        await clear();
        queryClient.clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/assets/generated/vial-traite-logo.dim_400x200.png"
            alt="Vial Traite Service"
            className="w-48 h-auto object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Vial Traite Service</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gestion des clients et interventions
            </p>
          </div>
        </div>

        <div className="w-full bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Connexion</h2>
            <p className="text-sm text-muted-foreground mt-1">
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Se connecter
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Authentification sécurisée via Internet Identity
          </p>
        </div>
      </div>
    </div>
  );
}
