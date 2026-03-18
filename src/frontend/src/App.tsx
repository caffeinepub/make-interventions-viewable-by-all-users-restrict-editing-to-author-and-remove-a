import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import ProfileSetupDialog from "./components/auth/ProfileSetupDialog";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import MobileLayout from "./components/layout/MobileLayout";
import { useActor } from "./hooks/useActor";
import { useGetCallerUserProfile } from "./hooks/useCurrentUser";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsCallerAdmin, useIsCallerApproved } from "./hooks/useUserApproval";
import AdminAccessPage from "./pages/AdminAccessPage";
import ClientDossierPage from "./pages/ClientDossierPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import PlanningPage from "./pages/PlanningPage";
import ScheduledInterventionDetailPage from "./pages/ScheduledInterventionDetailPage";
import TechnicalFolderPage from "./pages/TechnicalFolderPage";
import TimesheetPage from "./pages/TimesheetPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">{message}</p>
      </div>
    </div>
  );
}

function ActorFailedScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Connexion impossible
        </h2>
        <p className="text-sm text-muted-foreground">
          Impossible de se connecter au serveur. Veuillez recharger la page.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Recharger la page
        </button>
      </div>
    </div>
  );
}

function TimesheetErrorComponent({ error }: { error: Error }) {
  return (
    <div className="p-8 text-center">
      <p className="text-destructive font-medium">
        Erreur dans la feuille d&apos;heures
      </p>
      <p className="text-sm text-muted-foreground mt-2">{error?.message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded text-sm"
      >
        Recharger
      </button>
    </div>
  );
}

function AuthenticatedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: "/login" });
    }
  }, [identity, isInitializing, navigate]);

  if (isInitializing) {
    return <LoadingScreen message="Initialisation..." />;
  }

  if (!identity) return null;

  return <AuthenticatedLayoutInner />;
}

function AuthenticatedLayoutInner() {
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: isApproved, isLoading: approvalLoading } =
    useIsCallerApproved();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Step 1: Wait for actor to initialize
  if (actorFetching) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Step 2: If actor failed to load, show error (prevents infinite spinner)
  if (!actor) {
    return <ActorFailedScreen />;
  }

  // Step 3: Wait for admin/approval checks
  if (adminLoading || approvalLoading) {
    return <LoadingScreen message="Vérification des accès..." />;
  }

  // Step 4: Admin gets immediate, unconditional access
  if (isAdmin === true) {
    const needsProfileSetup =
      !profileLoading && profileFetched && userProfile === null;
    return (
      <MobileLayout>
        {needsProfileSetup && <ProfileSetupDialog />}
        <Outlet />
      </MobileLayout>
    );
  }

  // Step 5: Approved users get access
  if (isApproved === true) {
    const needsProfileSetup =
      !profileLoading && profileFetched && userProfile === null;
    return (
      <MobileLayout>
        {needsProfileSetup && <ProfileSetupDialog />}
        <Outlet />
      </MobileLayout>
    );
  }

  // Step 6: Not approved — show access request page
  return <PendingApprovalPage />;
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "authenticated",
  component: AuthenticatedLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/",
  component: DashboardPage,
});

const clientsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/clients",
  component: ClientsPage,
});

const clientDossierRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/clients/$clientId",
  component: ClientDossierPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const technicalFolderRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/technical-folder",
  component: TechnicalFolderPage,
});

const adminAccessRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/admin/access",
  component: AdminAccessPage,
});

const planningRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/planning",
  component: PlanningPage,
});

const scheduledInterventionDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/planning/$interventionId",
  component: ScheduledInterventionDetailPage,
});

const timesheetRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/timesheet",
  component: TimesheetPage,
  errorComponent: TimesheetErrorComponent,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    indexRoute,
    clientsRoute,
    clientDossierRoute,
    dashboardRoute,
    technicalFolderRoute,
    adminAccessRoute,
    planningRoute,
    scheduledInterventionDetailRoute,
    timesheetRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
