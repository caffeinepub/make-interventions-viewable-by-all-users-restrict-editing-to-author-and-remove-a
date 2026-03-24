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
import { useEffect, useRef, useState } from "react";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import MobileLayout from "./components/layout/MobileLayout";
import { UserAccessProvider } from "./contexts/UserAccessContext";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsCallerAdmin, useIsCallerApproved } from "./hooks/useUserApproval";
import AdminAccessPage from "./pages/AdminAccessPage";
import ClientDossierPage from "./pages/ClientDossierPage";
import ClientsPage from "./pages/ClientsPage";
import DashboardPage from "./pages/DashboardPage";
import FacturationPage from "./pages/FacturationPage";
import LoginPage from "./pages/LoginPage";
import MemoPage from "./pages/MemoPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import PlanningPage from "./pages/PlanningPage";
import ScheduledInterventionDetailPage from "./pages/ScheduledInterventionDetailPage";
import TimesheetPage from "./pages/TimesheetPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

// ── Admin persistence helpers ─────────────────────────────────────────────────
const ADMIN_STORAGE_KEY = "vts_admin_principals";

function loadStoredAdminPrincipals(): Set<string> {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function storeAdminPrincipal(principal: string) {
  try {
    const set = loadStoredAdminPrincipals();
    set.add(principal);
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // localStorage unavailable — non-blocking
  }
}

function isStoredAdmin(principal: string): boolean {
  return loadStoredAdminPrincipals().has(principal);
}

// ── Screens ───────────────────────────────────────────────────────────────────

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <img
          src="/assets/generated/vial-traite-logo.dim_400x100.png"
          alt="Vial Traite Service"
          className="w-48 h-auto"
        />
        <div className="flex items-center gap-3 mt-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

const AUTO_RETRY_INTERVAL = 5; // seconds
const AUTO_RETRY_MAX = 10; // max auto-retries

function ServerStartingScreen({ onRetry }: { onRetry: () => void }) {
  const [countdown, setCountdown] = useState(AUTO_RETRY_INTERVAL);
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryCount triggers effect re-run intentionally
  useEffect(() => {
    if (retryCountRef.current >= AUTO_RETRY_MAX) return;

    setCountdown(AUTO_RETRY_INTERVAL);

    const tickInterval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? AUTO_RETRY_INTERVAL : prev - 1));
    }, 1000);

    const retryTimeout = setTimeout(() => {
      if (retryCountRef.current < AUTO_RETRY_MAX) {
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        onRetry();
      }
    }, AUTO_RETRY_INTERVAL * 1000);

    return () => {
      clearInterval(tickInterval);
      clearTimeout(retryTimeout);
    };
  }, [onRetry, retryCount]);

  const attemptsLeft = AUTO_RETRY_MAX - retryCount;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <img
          src="/assets/generated/vial-traite-logo.dim_400x100.png"
          alt="Vial Traite Service"
          className="w-52 h-auto"
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

        {attemptsLeft > 0 ? (
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${((AUTO_RETRY_INTERVAL - countdown) / AUTO_RETRY_INTERVAL) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Nouvelle tentative dans{" "}
              <span className="font-semibold text-foreground">
                {countdown}s
              </span>{" "}
              — tentative{" "}
              <span className="font-semibold">{retryCount + 1}</span>/
              {AUTO_RETRY_MAX}
            </p>
          </div>
        ) : (
          <p className="text-xs text-amber-600">
            Nombre maximum de tentatives atteint. Revenez dans quelques minutes.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            retryCountRef.current = Math.max(0, retryCountRef.current - 1);
            setRetryCount((c) => Math.max(0, c - 1));
            onRetry();
          }}
          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          Réessayer maintenant
        </button>
        <p className="text-xs text-muted-foreground">
          Si le problème persiste, revenez dans quelques minutes.
        </p>
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

// ── Auth layout ───────────────────────────────────────────────────────────────

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
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const adminQuery = useIsCallerAdmin();
  const approvalQuery = useIsCallerApproved();

  const principalStr = identity?.getPrincipal().toString() ?? "";

  const isAdminLatchRef = useRef(
    principalStr ? isStoredAdmin(principalStr) : false,
  );
  const [isAdminLatch, setIsAdminLatch] = useState(isAdminLatchRef.current);

  const adminReRegisterAttempted = useRef(false);
  const approvedAdminSyncAttempted = useRef(false);

  useEffect(() => {
    if (adminQuery.data === true && !isAdminLatchRef.current) {
      isAdminLatchRef.current = true;
      setIsAdminLatch(true);
      if (principalStr) storeAdminPrincipal(principalStr);
    }
  }, [adminQuery.data, principalStr]);

  useEffect(() => {
    if (
      isAdminLatchRef.current &&
      actor &&
      !actorFetching &&
      !adminQuery.isLoading &&
      adminQuery.data === false &&
      !adminReRegisterAttempted.current
    ) {
      adminReRegisterAttempted.current = true;
      const a = actor as any;
      Promise.resolve()
        .then(async () => {
          try {
            const synced = await a.syncAdminRole?.();
            if (synced) {
              isAdminLatchRef.current = true;
              setIsAdminLatch(true);
              if (principalStr) storeAdminPrincipal(principalStr);
              queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
              return;
            }
          } catch {
            // ignore
          }
          try {
            await a.claimAdminIfNoneExists?.();
            queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
          } catch {
            // ignore
          }
        })
        .catch(() => {});
    }
  }, [
    actor,
    actorFetching,
    adminQuery.isLoading,
    adminQuery.data,
    principalStr,
    queryClient,
  ]);

  useEffect(() => {
    if (
      !isAdminLatch &&
      !adminQuery.isLoading &&
      adminQuery.data === false &&
      approvalQuery.data === true &&
      actor &&
      !actorFetching &&
      !approvedAdminSyncAttempted.current
    ) {
      approvedAdminSyncAttempted.current = true;
      (actor as any)
        .syncAdminRole?.()
        .then((result: boolean) => {
          if (result) {
            isAdminLatchRef.current = true;
            setIsAdminLatch(true);
            if (principalStr) storeAdminPrincipal(principalStr);
            queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
          }
        })
        .catch(() => {});
    }
  }, [
    isAdminLatch,
    adminQuery.isLoading,
    adminQuery.data,
    approvalQuery.data,
    actor,
    actorFetching,
    principalStr,
    queryClient,
  ]);

  if (actorFetching) {
    return <LoadingScreen message="Chargement..." />;
  }

  if (!actor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-6">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm">
          <img
            src="/assets/generated/vial-traite-logo.dim_400x100.png"
            alt="Vial Traite Service"
            className="w-48 h-auto opacity-80"
          />
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

  if (!isAdminLatch && (adminQuery.isLoading || approvalQuery.isLoading)) {
    return <LoadingScreen message="Vérification des accès..." />;
  }

  if (adminQuery.isError && !isAdminLatch) {
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
  }

  const isAdmin = isAdminLatch;

  if (isAdmin) {
    return (
      <UserAccessProvider isAdmin={true}>
        <MobileLayout>
          <Outlet />
        </MobileLayout>
      </UserAccessProvider>
    );
  }

  if (approvalQuery.data === true) {
    return (
      <UserAccessProvider isAdmin={false}>
        <MobileLayout>
          <Outlet />
        </MobileLayout>
      </UserAccessProvider>
    );
  }

  return <PendingApprovalPage />;
}

// ── Router ────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({ component: () => <Outlet /> });

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
const memoRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/memo",
  component: MemoPage,
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
const facturationRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: "/facturation",
  component: FacturationPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  authenticatedRoute.addChildren([
    indexRoute,
    clientsRoute,
    clientDossierRoute,
    dashboardRoute,
    memoRoute,
    adminAccessRoute,
    planningRoute,
    scheduledInterventionDetailRoute,
    timesheetRoute,
    facturationRoute,
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
