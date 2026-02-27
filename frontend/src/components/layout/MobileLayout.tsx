import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUser';
import { Users, LayoutDashboard, FolderOpen, LogOut, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ConnectivityStatusBar from '../sync/ConnectivityStatusBar';
import ExportDataDialog from '../export/ExportDataDialog';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/clients', label: 'Clients', icon: Users },
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/technical-folder', label: 'Dossier Technique', icon: FolderOpen },
];

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: userProfile } = useGetCallerUserProfile();
  const [exportOpen, setExportOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  const isActive = (path: string) => {
    if (path === '/clients') {
      return location.pathname === '/clients' || location.pathname === '/' || location.pathname.startsWith('/clients/');
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/vial-traite-logo.dim_400x200.png"
              alt="Vial Traite Service"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            {userProfile && (
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {userProfile.name}
              </span>
            )}
            {identity && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExportOpen(true)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exporter les données</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {identity && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Se déconnecter</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate({ to: path })}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors flex-1',
                isActive(path)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Export dialog */}
      <ExportDataDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
