import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
  FolderOpen,
  Loader2,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Intervention } from "../backend";
import InterventionDetailsDialog from "../components/interventions/InterventionDetailsDialog";
import { useUserAccess } from "../contexts/UserAccessContext";
import { useActor } from "../hooks/useActor";
import { useUserProfilesByPrincipals } from "../hooks/useCurrentUser";
import { useGetInterventionsByDate } from "../hooks/useInterventions";
import {
  type ApprovalEntry,
  useListApprovals,
  useSetApproval,
} from "../hooks/useUserApproval";

function formatDate(date: {
  day: bigint;
  month: bigint;
  year: bigint;
}): string {
  const d = Number(date.day).toString().padStart(2, "0");
  const m = Number(date.month).toString().padStart(2, "0");
  const y = Number(date.year);
  return `${d}/${m}/${y}`;
}

const quickLinks = [
  {
    path: "/clients",
    label: "Clients",
    description: "Dossiers et interventions",
    icon: Users,
    color: "bg-[#0066CC]/10",
    iconColor: "text-[#0066CC]",
  },
  {
    path: "/planning",
    label: "Planning",
    description: "Interventions de la semaine",
    icon: CalendarRange,
    color: "bg-[#99CC33]/10",
    iconColor: "text-[#99CC33]",
  },
  {
    path: "/timesheet",
    label: "Feuille d'heures",
    description: "Saisie et suivi des heures",
    icon: Clock,
    color: "bg-[#FF9933]/10",
    iconColor: "text-[#FF9933]",
  },
  {
    path: "/technical-folder",
    label: "Dossier technique",
    description: "Documents et fichiers",
    icon: FolderOpen,
    color: "bg-primary/10",
    iconColor: "text-primary",
  },
];

// ── Access management inline ─────────────────────────────────────────────────

function truncatePrincipal(principal: Principal): string {
  const str = principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-6)}`;
}

function useProfileNames(principals: Principal[]) {
  const { actor, isFetching } = useActor();
  const key = principals.map((p) => p.toString()).join(",");
  return useQuery<Map<string, string>>({
    queryKey: ["profileNames", key],
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!actor || principals.length === 0) return map;
      try {
        const results = await (actor as any).getUserProfilesByPrincipals(
          principals,
        );
        for (const [p, profile] of results as Array<
          [Principal, { name: string }]
        >) {
          map.set(p.toString(), profile.name);
        }
      } catch (err) {
        console.warn("getUserProfilesByPrincipals failed:", err);
      }
      return map;
    },
    enabled: !!actor && !isFetching && principals.length > 0,
    staleTime: 1000 * 60,
  });
}

interface UserRowProps {
  entry: ApprovalEntry;
  index: number;
  displayName: string;
  onApprove?: () => void;
  onReject?: () => void;
  onRevoke?: () => void;
  isPending: boolean;
}

function UserRow({
  entry,
  index,
  displayName,
  onApprove,
  onReject,
  onRevoke,
  isPending,
}: UserRowProps) {
  return (
    <div
      data-ocid={`admin_access.item.${index}`}
      className="flex flex-col gap-3 bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {displayName}
            </p>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {truncatePrincipal(entry.principal)}
            </p>
          </div>
        </div>
        {entry.status === "approved" && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-[#99CC33]/15 text-[#99CC33] border-[#99CC33]/30"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        )}
        {entry.status === "pending" && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-[#FF9933]/15 text-[#FF9933] border-[#FF9933]/30"
          >
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )}
        {entry.status === "rejected" && (
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-destructive/15 text-destructive border-destructive/30"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Supprimé
          </Badge>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {entry.status === "pending" && (
          <>
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isPending}
              className="flex-1 min-w-0 bg-[#99CC33] hover:bg-[#99CC33]/90 text-white"
              data-ocid={`admin_access.approve_button.${index}`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3 mr-1" />
              )}
              Approuver
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={onReject}
              disabled={isPending}
              className="flex-1 min-w-0"
              data-ocid={`admin_access.delete_button.${index}`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              Supprimer
            </Button>
          </>
        )}
        {entry.status === "approved" && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onRevoke}
            disabled={isPending}
            className="flex-1 min-w-0"
            data-ocid={`admin_access.delete_button.${index}`}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            Révoquer l&apos;accès
          </Button>
        )}
        {entry.status === "rejected" && (
          <Button
            size="sm"
            variant="outline"
            onClick={onApprove}
            disabled={isPending}
            className="flex-1 min-w-0"
            data-ocid={`admin_access.approve_button.${index}`}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1" />
            )}
            Approuver quand même
          </Button>
        )}
      </div>
    </div>
  );
}

function AccessManagementTab() {
  const { data: approvals, isLoading, error, refetch } = useListApprovals();
  const { mutate: setApproval, isPending: isSettingApproval } =
    useSetApproval();

  const principals = approvals?.map((a) => a.principal) ?? [];
  const { data: profileNames } = useProfileNames(principals);

  const pending = approvals?.filter((a) => a.status === "pending") ?? [];
  const approved = approvals?.filter((a) => a.status === "approved") ?? [];
  const rejected = approvals?.filter((a) => a.status === "rejected") ?? [];

  const allEntriesIndexed =
    approvals?.map((entry, i) => ({ entry, displayIndex: i + 1 })) ?? [];

  const getDisplayName = (principal: Principal) =>
    profileNames?.get(principal.toString()) || truncatePrincipal(principal);

  const handleApprove = (principal: Principal) =>
    setApproval({ user: principal, status: "approved" });
  const handleReject = (principal: Principal) =>
    setApproval({ user: principal, status: "rejected" });
  const handleRevoke = (principal: Principal) =>
    setApproval({ user: principal, status: "pending" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement des accès...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <AlertTriangle className="w-8 h-8 text-destructive" />
        <p className="text-sm text-muted-foreground text-center">
          {(error as Error).message}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {(!approvals || approvals.length === 0) && (
        <div className="flex flex-col items-center gap-3 py-12">
          <Users className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Aucune demande d&apos;accès pour le moment
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: "#FF9933" }} />
            <h2 className="font-semibold text-foreground">
              En attente ({pending.length})
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {pending.map((entry) => {
              const idx =
                allEntriesIndexed.find((a) => a.entry === entry)
                  ?.displayIndex ?? 1;
              return (
                <UserRow
                  key={entry.principal.toString()}
                  entry={entry}
                  index={idx}
                  displayName={getDisplayName(entry.principal)}
                  onApprove={() => handleApprove(entry.principal)}
                  onReject={() => handleReject(entry.principal)}
                  isPending={isSettingApproval}
                />
              );
            })}
          </div>
        </section>
      )}

      {approved.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "#99CC33" }} />
            <h2 className="font-semibold text-foreground">
              Approuvés ({approved.length})
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {approved.map((entry) => {
              const idx =
                allEntriesIndexed.find((a) => a.entry === entry)
                  ?.displayIndex ?? 1;
              return (
                <UserRow
                  key={entry.principal.toString()}
                  entry={entry}
                  index={idx}
                  displayName={getDisplayName(entry.principal)}
                  onRevoke={() => handleRevoke(entry.principal)}
                  isPending={isSettingApproval}
                />
              );
            })}
          </div>
        </section>
      )}

      {rejected.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <h2 className="font-semibold text-foreground">
              Supprimés ({rejected.length})
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {rejected.map((entry) => {
              const idx =
                allEntriesIndexed.find((a) => a.entry === entry)
                  ?.displayIndex ?? 1;
              return (
                <UserRow
                  key={entry.principal.toString()}
                  entry={entry}
                  index={idx}
                  displayName={getDisplayName(entry.principal)}
                  onApprove={() => handleApprove(entry.principal)}
                  isPending={isSettingApproval}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();
  // Use context value set at auth level — guaranteed stable, no re-fetch
  const { isAdmin } = useUserAccess();

  const day = selectedDate.getDate();
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const {
    data: interventions,
    isLoading,
    error,
    refetch,
  } = useGetInterventionsByDate(day, month, year);

  const employeePrincipals = useMemo(
    () =>
      interventions
        ? Array.from(
            new Set(interventions.map((i: Intervention) => i.employee)),
          )
        : [],
    [interventions],
  );
  const { data: profileMap } = useUserProfilesByPrincipals(employeePrincipals);

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>
      </div>

      {isAdmin ? (
        <Tabs defaultValue="home">
          <TabsList className="w-full">
            <TabsTrigger value="home" className="flex-1 gap-1.5">
              <CalendarDays className="w-4 h-4" />
              Accueil
            </TabsTrigger>
            <TabsTrigger value="access" className="flex-1 gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Accès
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="mt-4">
            <HomeTabContent
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              navigate={navigate}
              interventions={interventions}
              isLoading={isLoading}
              error={error}
              refetch={refetch}
              profileMap={profileMap}
            />
          </TabsContent>

          <TabsContent value="access" className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Gestion des accès
              </h2>
            </div>
            <AccessManagementTab />
          </TabsContent>
        </Tabs>
      ) : (
        <HomeTabContent
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          navigate={navigate}
          interventions={interventions}
          isLoading={isLoading}
          error={error}
          refetch={refetch}
          profileMap={profileMap}
        />
      )}
    </div>
  );
}

interface HomeTabProps {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  navigate: ReturnType<typeof useNavigate>;
  interventions: Intervention[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  profileMap: Map<string, string> | undefined;
}

function HomeTabContent({
  selectedDate,
  setSelectedDate,
  navigate,
  interventions,
  isLoading,
  error,
  refetch,
  profileMap,
}: HomeTabProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Quick access links */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-foreground text-sm text-muted-foreground uppercase tracking-wide">
          Accès rapide
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(
            ({ path, label, description, icon: Icon, color, iconColor }) => (
              <button
                key={path}
                type="button"
                onClick={() => navigate({ to: path })}
                className="flex flex-col gap-2 bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-colors active:scale-95"
                data-ocid={`dashboard.quicklink.${path.replace("/", "")}`}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}
                >
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                    {description}
                  </p>
                </div>
              </button>
            ),
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-xl border border-border bg-card shadow-sm"
        />
      </div>

      {/* Interventions for selected date */}
      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-foreground">
          Interventions du{" "}
          {selectedDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              {(error as Error).message}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </Button>
          </div>
        ) : !interventions || interventions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Aucune intervention pour cette date
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {interventions.map((intervention: Intervention, idx: number) => (
              <li
                key={intervention.id}
                data-ocid={`dashboard.intervention.item.${idx + 1}`}
              >
                <InterventionDetailsDialog
                  intervention={intervention}
                  trigger={
                    <button
                      type="button"
                      className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">
                          {formatDate(intervention.date)}
                        </span>
                        <span className="text-xs text-primary font-medium">
                          Par :{" "}
                          {profileMap?.get(intervention.employee.toString()) ??
                            intervention.comments?.match(
                              /^\[([^\]]+)\]/,
                            )?.[1] ??
                            "Inconnu"}
                        </span>
                        {intervention.comments && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {intervention.comments}
                          </p>
                        )}
                        {intervention.media.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {intervention.media.length} pièce(s) jointe(s)
                          </span>
                        )}
                      </div>
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
