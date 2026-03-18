import { Toaster } from "@/components/ui/sonner";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
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
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/generated/vial-traite-logo-transparent.dim_400x200.png"
          alt="Vial Traite Service"
          className="w-40 h-auto opacity-80"
        />
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

function ServerStartingScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <img
          src="/assets/generated/vial-traite-logo-transparent.dim_400x200.png"
          alt="Vial Traite Service"
          className="w-44 h-auto"
        />
        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
          <span className="text-2xl">⏳</span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Service en démarrage
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Le serveur redémarre après une mise à jour. Cela prend généralement
            quelques secondes.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Réessayer la connexion
        </button>
        <p className="text-xs text-muted-foreground">
          Si le problème persiste, revenez dans quelques minutes.
        </p>
      </div>
    </div>
  );
}

function ActorFailedScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        <img
          src="/assets/generated/vial-traite-logo-transparent.dim_400x200.png"
          alt="Vial Traite Service"
          className="w-40 h-auto opacity-80"
        />
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            Connexion impossible
          </h2>
          <p className="text-sm text-muted-foreground">
            Impossible de se connecter au serveur. Vérifiez votre connexion et
            réessayez.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
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
  const queryClient = useQueryClient();
  const adminQuery = useIsCallerAdmin();
  const approvalQuery = useIsCallerApproved();
  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  // Step 1: Wait for actor
  if (actorFetching) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Step 2: Actor failed
  if (!actor) {
    return <ActorFailedScreen />;
  }

  // Step 3: Wait for admin/approval checks
  if (adminQuery.isLoading || approvalQuery.isLoading) {
    return <LoadingScreen message="Vérification des accès..." />;
  }

  // Step 4: If admin check errored with canister stopped → show starting screen
  if (adminQuery.isError) {
    const msg = (adminQuery.error as Error)?.message ?? "";
    const isCanisterStopped =
      msg.includes("CANISTER_STOPPED") ||
      msg.includes("IC0508") ||
      msg.includes("stopped");
    if (isCanisterStopped) {
      return (
        <ServerStartingScreen
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
            queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
            adminQuery.refetch();
          }}
        />
      );
    }
    // Non-canister error → continue to access page
  }

  const needsProfileSetup =
    !profileLoading && profileFetched && userProfile === null;

  // Step 5: Admin gets immediate access
  if (adminQuery.data === true) {
    return (
      <MobileLayout>
        {needsProfileSetup && <ProfileSetupDialog />}
        <Outlet />
      </MobileLayout>
    );
  }

  // Step 6: Approved users
  if (approvalQuery.data === true) {
    return (
      <MobileLayout>
        {needsProfileSetup && <ProfileSetupDialog />}
        <Outlet />
      </MobileLayout>
    );
  }

  // Step 7: Not approved → access request page
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
