import React from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LogOut, LayoutDashboard, Users, FolderOpen, Heart } from 'lucide-react';
import ConnectivityStatusBar from '../sync/ConnectivityStatusBar';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userProfile } = useGetCallerUserProfile();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const navItems = [
    { path: '/', label: 'Clients', icon: Users },
    { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/technical-folder', label: 'Dossier', icon: FolderOpen },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-primary text-primary-foreground shadow-md">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <img
                src="/assets/generated/vial-traite-logo.dim_400x200.png"
                alt="Vial Traite Service"
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </div>
            <div className="flex items-center gap-2">
              {userProfile && (
                <span className="text-sm font-medium opacity-90">{userProfile.name}</span>
              )}
              {identity && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      aria-label="Se déconnecter"
                      className="text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Se déconnecter</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
          <ConnectivityStatusBar />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto pb-20">
          {children}
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <button
                key={path}
                onClick={() => navigate({ to: path })}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                  isActive(path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <footer className="hidden">
          <p className="text-xs text-muted-foreground text-center py-2">
            © {new Date().getFullYear()} Vial Traite Service — Construit avec{' '}
            <Heart className="inline h-3 w-3 text-destructive" />{' '}
            en utilisant{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'vial-traite-service')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </TooltipProvider>
  );
}
