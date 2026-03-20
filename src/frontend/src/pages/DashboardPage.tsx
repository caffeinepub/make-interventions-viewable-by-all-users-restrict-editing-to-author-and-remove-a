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
  Clock,
  FolderOpen,
  Loader2,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Intervention, UserProfile } from "../backend";
import InterventionDetailsDialog from "../components/interventions/InterventionDetailsDialog";
import { useUserAccess } from "../contexts/UserAccessContext";
import { useActor } from "../hooks/useActor";
import { useUserProfilesByPrincipals } from "../hooks/useCurrentUser";
import { useGetInterventionsByDate } from "../hooks/useInterventions";

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

function truncatePrincipal(principal: Principal): string {
  const str = principal.toString();
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}...${str.slice(-6)}`;
}

// ── Profile List Tab ──────────────────────────────────────────────────────────

function ProfileListTab() {
  const { actor, isFetching } = useActor();

  const {
    data: profiles,
    isLoading,
    error,
    refetch,
  } = useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ["allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUserProfiles();
      } catch (err) {
        console.warn("getAllUserProfiles failed:", err);
        throw err;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Chargement des profils...
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

  if (!profiles || profiles.length === 0) {
    return (
      <div
        data-ocid="profiles.empty_state"
        className="flex flex-col items-center gap-3 py-12"
      >
        <Users className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          Aucun profil enregistré pour le moment
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {profiles.length} utilisateur{profiles.length > 1 ? "s" : ""} enregistré
        {profiles.length > 1 ? "s" : ""}
      </p>
      <div className="flex flex-col gap-2">
        {profiles.map(([principal, profile], index) => (
          <div
            key={principal.toString()}
            data-ocid={`profiles.item.${index + 1}`}
            className="flex items-center gap-3 bg-card border border-border rounded-xl p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile.name}
              </p>
              <p className="text-xs font-mono text-muted-foreground truncate">
                {truncatePrincipal(principal)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();
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
            <TabsTrigger
              value="profil"
              className="flex-1 gap-1.5"
              data-ocid="dashboard.profil.tab"
            >
              <Users className="w-4 h-4" />
              Profil
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

          <TabsContent value="profil" className="mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">
                Profils enregistrés
              </h2>
            </div>
            <ProfileListTab />
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
