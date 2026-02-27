import React, { Suspense, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createRouter,
  RouterProvider,
  createRootRoute,
  createRoute,
  Outlet,
  useNavigate,
} from '@tanstack/react-router';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import ClientDossierPage from './pages/ClientDossierPage';
import DashboardPage from './pages/DashboardPage';
import TechnicalFolderPage from './pages/TechnicalFolderPage';
import MobileLayout from './components/layout/MobileLayout';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Loader2 } from 'lucide-react';
import { registerServiceWorker } from './pwa/registerServiceWorker';

// Register service worker safely (non-blocking)
try {
  registerServiceWorker();
} catch (e) {
  console.warn('[App] Service worker registration failed silently:', e);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function LoadingScreen({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const { identity, isInitializing, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();

  const isStillInitializing = isInitializing || loginStatus === 'initializing';

  useEffect(() => {
    if (!isStillInitializing && !identity) {
      navigate({ to: '/login' }).catch(() => {
        window.location.href = '/login';
      });
    }
  }, [identity, isStillInitializing, navigate]);

  // While initializing, show a loading spinner — do NOT redirect yet
  if (isStillInitializing) {
    return <LoadingScreen message="Vérification de l'authentification..." />;
  }

  // Not yet redirected — show a brief loading state
  if (!identity) {
    return <LoadingScreen message="Redirection..." />;
  }

  return (
    <MobileLayout>
      <ProfileSetupDialog />
      <Outlet />
    </MobileLayout>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AuthenticatedLayout,
});

const clientsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: ClientsPage,
});

const clientDossierRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/clients/$clientId',
  component: ClientDossierPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const technicalFolderRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/technical-folder',
  component: TechnicalFolderPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    clientsRoute,
    clientDossierRoute,
    dashboardRoute,
    technicalFolderRoute,
  ]),
]);

const router = createRouter({
  routeTree,
  defaultPendingComponent: () => <LoadingScreen message="Chargement de la page..." />,
  defaultErrorComponent: ({ error }) => (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-card border border-destructive rounded-xl p-6 text-center">
        <p className="text-destructive font-semibold mb-2">Une erreur s'est produite</p>
        <p className="text-sm text-muted-foreground mb-4">
          {error instanceof Error && error.message ? error.message : 'Erreur inconnue'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
        >
          Recharger
        </button>
      </div>
    </div>
  ),
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppInitializationGuard({ children }: { children: React.ReactNode }) {
  const { isInitializing, loginStatus } = useInternetIdentity();

  if (isInitializing || loginStatus === 'initializing') {
    return <LoadingScreen message="Initialisation..." />;
  }

  return <>{children}</>;
}

function AppContent() {
  return (
    <ErrorBoundary>
      <AppInitializationGuard>
        <Suspense fallback={<LoadingScreen message="Chargement..." />}>
          <RouterProvider router={router} />
        </Suspense>
      </AppInitializationGuard>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <Toaster richColors position="top-center" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
