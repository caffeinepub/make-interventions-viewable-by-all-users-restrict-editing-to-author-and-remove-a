import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider, createRootRoute, createRoute, Outlet, redirect } from '@tanstack/react-router';
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

registerServiceWorker();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthenticatedLayout() {
  const { identity, isInitializing } = useInternetIdentity();

  // While initializing, show a loading spinner — do NOT redirect yet
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Only redirect after initialization is complete and no identity found
  if (!identity) {
    throw redirect({ to: '/login' });
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

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
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
