import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login, identity, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: '/clients' });
    }
  }, [identity, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <img src="/assets/generated/pwa-icon.dim_512x512.png" alt="App Icon" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Dossiers Clients</CardTitle>
          <CardDescription>Connectez-vous pour accéder aux dossiers clients et interventions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={login} disabled={isLoggingIn} className="w-full" size="lg">
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
