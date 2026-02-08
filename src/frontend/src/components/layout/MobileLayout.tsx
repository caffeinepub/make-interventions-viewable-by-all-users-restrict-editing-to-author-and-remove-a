import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const { identity, clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen bg-background">
      {identity && (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{userProfile?.name || 'Utilisateur'}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
      )}
      <main className="container px-4 py-6">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          © 2026. Built with ❤️ using{' '}
          <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline">
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
