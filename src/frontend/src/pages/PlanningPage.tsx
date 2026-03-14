import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Principal } from "@icp-sdk/core/principal";
import { useNavigate } from "@tanstack/react-router";
import { CalendarRange, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { ScheduledIntervention } from "../backend";
import ScheduledInterventionFormDialog from "../components/planning/ScheduledInterventionFormDialog";
import {
  useGetApprovedEmployees,
  useGetScheduledInterventionsByWeek,
} from "../hooks/useScheduledInterventions";
import {
  DAY_LABELS,
  formatDate,
  getISOWeek,
  getISOWeekYear,
  getWeekStart,
} from "../utils/dateUtils";

export default function PlanningPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [weekNumber, setWeekNumber] = useState(() => getISOWeek(today));
  const [weekYear, setWeekYear] = useState(() => getISOWeekYear(today));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<Date | undefined>();
  const [dialogEmployee, setDialogEmployee] = useState<Principal | undefined>();

  const { data: interventions = [], isLoading: loadingInterventions } =
    useGetScheduledInterventionsByWeek(weekNumber, weekYear);
  const { data: employees = [], isLoading: loadingEmployees } =
    useGetApprovedEmployees();

  const weekStart = getWeekStart(weekNumber, weekYear);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() - 7);
    setWeekNumber(getISOWeek(d));
    setWeekYear(getISOWeekYear(d));
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + 7);
    setWeekNumber(getISOWeek(d));
    setWeekYear(getISOWeekYear(d));
  };

  const goToCurrentWeek = () => {
    setWeekNumber(getISOWeek(today));
    setWeekYear(getISOWeekYear(today));
  };

  // Build day dates Mon-Fri for this week
  const weekDays = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  const getCellInterventions = (
    dayDate: Date,
    employeePrincipal: Principal,
  ): ScheduledIntervention[] => {
    return interventions.filter((inv) => {
      const d = inv.date;
      return (
        Number(d.day) === dayDate.getUTCDate() &&
        Number(d.month) === dayDate.getUTCMonth() + 1 &&
        Number(d.year) === dayDate.getUTCFullYear() &&
        inv.assignedEmployee.toString() === employeePrincipal.toString()
      );
    });
  };

  const openNewIntervention = (date: Date, employee?: Principal) => {
    setDialogDate(date);
    setDialogEmployee(employee);
    setDialogOpen(true);
  };

  const isLoading = loadingInterventions || loadingEmployees;

  return (
    <div className="flex flex-col h-full">
      {/* Week navigation */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            data-ocid="planning.pagination_prev"
            onClick={prevWeek}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <button
            type="button"
            className="text-sm font-semibold text-foreground px-2 hover:text-primary transition-colors"
            onClick={goToCurrentWeek}
          >
            Semaine {weekNumber} — {weekYear}
          </button>
          <Button
            variant="ghost"
            size="icon"
            data-ocid="planning.pagination_next"
            onClick={nextWeek}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        <Button
          size="sm"
          data-ocid="planning.primary_button"
          onClick={() => openNewIntervention(today)}
          className="bg-primary text-primary-foreground gap-1"
        >
          <Plus className="w-4 h-4" />
          Nouveau
        </Button>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center flex-1 gap-3"
          data-ocid="planning.loading_state"
        >
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Chargement...</span>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {employees.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6"
              data-ocid="planning.empty_state"
            >
              <CalendarRange className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                Aucun employé approuvé trouvé.
                <br />
                Approuvez des salariés depuis « Gestion des accès ».
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="w-20 text-left px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-r border-border sticky left-0 bg-muted/50 z-10">
                      Jour
                    </th>
                    {employees.map(([principal, profile]) => (
                      <th
                        key={principal.toString()}
                        className="text-left px-3 py-2 text-xs font-semibold text-foreground border-b border-r border-border min-w-[160px]"
                      >
                        {profile.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekDays.map((dayDate, dayIdx) => {
                    const isToday =
                      dayDate.getUTCFullYear() === today.getFullYear() &&
                      dayDate.getUTCMonth() === today.getMonth() &&
                      dayDate.getUTCDate() === today.getDate();
                    const dayKey = dayDate.toISOString().split("T")[0];

                    return (
                      <tr
                        key={dayKey}
                        className="border-b border-border hover:bg-muted/20 transition-colors"
                        data-ocid="planning.row"
                      >
                        {/* Day label */}
                        <td className="px-3 py-2 text-xs font-medium border-r border-border sticky left-0 bg-background z-10">
                          <div
                            className={`flex flex-col ${isToday ? "text-primary" : "text-muted-foreground"}`}
                          >
                            <span className="font-bold">
                              {DAY_LABELS[dayIdx]}
                            </span>
                            <span>{formatDate(dayDate)}</span>
                          </div>
                        </td>

                        {/* Employee columns */}
                        {employees.map(([principal]) => {
                          const cellInterventions = getCellInterventions(
                            dayDate,
                            principal,
                          );
                          return (
                            <td
                              key={principal.toString()}
                              className="px-2 py-2 border-r border-border align-top min-h-[80px]"
                            >
                              <button
                                type="button"
                                className="flex flex-col gap-1 min-h-[60px] w-full text-left"
                                onClick={() =>
                                  openNewIntervention(dayDate, principal)
                                }
                              >
                                {cellInterventions.map((inv) => (
                                  <button
                                    key={inv.id}
                                    type="button"
                                    className="text-left w-full rounded-md p-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate({
                                        to: "/planning/$interventionId",
                                        params: { interventionId: inv.id },
                                      });
                                    }}
                                    data-ocid="planning.card"
                                  >
                                    <p className="text-xs font-semibold text-primary truncate">
                                      {inv.clientName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {inv.startTime} – {inv.endTime}
                                    </p>
                                    {inv.reason && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1 py-0 mt-0.5"
                                      >
                                        {inv.reason}
                                      </Badge>
                                    )}
                                  </button>
                                ))}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ScrollArea>
      )}

      {/* FAB */}
      <button
        type="button"
        data-ocid="planning.open_modal_button"
        onClick={() => openNewIntervention(today)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 z-30"
        aria-label="Nouvelle intervention"
      >
        <Plus className="w-6 h-6" />
      </button>

      <ScheduledInterventionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialDate={dialogDate}
        initialEmployee={dialogEmployee}
      />
    </div>
  );
}
