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
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AuthenticatedLayout() {
  const { identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: "/login" });
    }
  }, [identity, isInitializing, navigate]);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!identity) return null;

  return <AuthenticatedLayoutInner />;
}

function AuthenticatedLayoutInner() {
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched,
  } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: isApproved, isLoading: approvalLoading } =
    useIsCallerApproved();

  const isAuthenticated = !!identity;
  const showProfileSetup =
    isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const statusLoading =
    actorFetching || !actor || adminLoading || approvalLoading;

  if (isAuthenticated && statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            Vérification des accès...
          </p>
        </div>
      </div>
    );
  }

  const showPendingApproval =
    isAuthenticated &&
    !statusLoading &&
    isAdmin !== true &&
    isApproved !== true;

  if (showPendingApproval) {
    return <PendingApprovalPage />;
  }

  return (
    <MobileLayout>
      {showProfileSetup && <ProfileSetupDialog />}
      <Outlet />
    </MobileLayout>
  );
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
  component: ClientsPage,
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
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
