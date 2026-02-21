import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ConnectivityStatusBar from '../sync/ConnectivityStatusBar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const navigate = useNavigate();
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const handleDashboardClick = () => {
    navigate({ to: '/dashboard' });
  };

  const currentYear = new Date().getFullYear();
  const appIdentifier = encodeURIComponent(
    typeof window !== 'undefined' ? window.location.hostname : 'unknown-app'
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ConnectivityStatusBar />
      
      <header className="sticky top-0 z-10 bg-primary border-b border-primary-foreground/10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/generated/vial-traite-logo.dim_400x200.png" 
              alt="Vial Traite Service" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDashboardClick}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LayoutDashboard className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-primary-foreground text-sm hidden sm:inline">
              {userProfile?.name || 'Utilisateur'}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>

      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <p>
          © {currentYear} · Créé avec ❤️ en utilisant{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appIdentifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
