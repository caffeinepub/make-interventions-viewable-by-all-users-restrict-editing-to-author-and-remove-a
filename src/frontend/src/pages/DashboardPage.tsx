import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Clock,
  FolderOpen,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Intervention } from "../backend";
import InterventionDetailsDialog from "../components/interventions/InterventionDetailsDialog";
import { useUserProfilesByPrincipals } from "../hooks/useCurrentUser";
import { useGetInterventionsByDate } from "../hooks/useInterventions";
import { useIsCallerAdmin } from "../hooks/useUserApproval";

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

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const navigate = useNavigate();
  const { data: isAdmin } = useIsCallerAdmin();

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
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>
      </div>

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

      {/* Administration section — admin only */}
      {isAdmin && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Administration</h2>
          </div>

          <button
            type="button"
            onClick={() => navigate({ to: "/admin/access" })}
            className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-colors flex items-center justify-between"
            data-ocid="dashboard.admin_access_button"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Gestion des accès
                </p>
                <p className="text-xs text-muted-foreground">
                  Approuver ou révoquer les accès salariés
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}
    </div>
  );
}
