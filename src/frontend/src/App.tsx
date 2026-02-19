import { StrictMode, Suspense } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import LoginPage from './pages/LoginPage';
import ClientsPage from './pages/ClientsPage';
import ClientDossierPage from './pages/ClientDossierPage';
import TechnicalFolderPage from './pages/TechnicalFolderPage';
import DashboardPage from './pages/DashboardPage';
import MobileLayout from './components/layout/MobileLayout';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import { useGetCallerUserProfile } from './hooks/useCurrentUser';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Loader2 } from 'lucide-react';

console.log('App.tsx: Module loaded');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  console.log('App.tsx: AppContent rendering');
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  return (
    <>
      <Outlet />
      <ProfileSetupDialog open={showProfileSetup} />
      <Toaster />
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => {
    console.log('App.tsx: Root route rendering');
    return (
      <ErrorBoundary>
        <InternetIdentityProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<LoadingFallback />}>
              <AppContent />
            </Suspense>
          </QueryClientProvider>
        </InternetIdentityProvider>
      </ErrorBoundary>
    );
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LoginPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: ClientsPage,
});

const clientDossierRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/$clientId',
  component: ClientDossierPage,
});

const technicalFolderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/technical-folder',
  component: TechnicalFolderPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  clientsRoute,
  clientDossierRoute,
  technicalFolderRoute,
  dashboardRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  console.log('App.tsx: App component rendering');
  return (
    <StrictMode>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </StrictMode>
  );
}
