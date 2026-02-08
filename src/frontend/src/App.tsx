import { useEffect } from 'react';
import { RouterProvider, createRouter, createRootRoute, createRoute, Outlet } from '@tanstack/react-router';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useCurrentUser';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import ProfileSetupDialog from './components/auth/ProfileSetupDialog';
import ConnectivityStatusBar from './components/sync/ConnectivityStatusBar';
import MobileLayout from './components/layout/MobileLayout';
import ClientsPage from './pages/ClientsPage';
import ClientDossierPage from './pages/ClientDossierPage';
import LoginPage from './pages/LoginPage';
import { registerServiceWorker } from './pwa/registerServiceWorker';

// Root layout component
function RootLayout() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MobileLayout>
        {isAuthenticated && <ConnectivityStatusBar />}
        <Outlet />
        <ProfileSetupDialog />
      </MobileLayout>
      <Toaster />
    </ThemeProvider>
  );
}

// Create routes
const rootRoute = createRootRoute({
  component: RootLayout,
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

const routeTree = rootRoute.addChildren([loginRoute, clientsRoute, clientDossierRoute]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return <RouterProvider router={router} />;
}
