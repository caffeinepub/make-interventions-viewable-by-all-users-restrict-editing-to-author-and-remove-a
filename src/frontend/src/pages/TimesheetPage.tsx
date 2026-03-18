import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Principal } from "@icp-sdk/core/principal";
import { ChevronLeft, ChevronRight, Clock, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UserProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetApprovedEmployees } from "../hooks/useScheduledInterventions";
import type { WorkHours } from "../hooks/useWorkHours";
import {
  useGetWorkHoursForMonth,
  useSaveWorkHours,
} from "../hooks/useWorkHours";

const MINE_SENTINEL = "__mine__";

// Stable empty arrays to prevent infinite re-render loops (React error #185)
const EMPTY_WORK_HOURS: WorkHours[] = [];
const EMPTY_EMPLOYEES: Array<[Principal, UserProfile]> = [];

function timeToMinutes(time: string): number {
  if (!time || typeof time !== "string") return 0;
  const parts = time.split(":");
  if (parts.length < 2) return 0;
  const h = Number.parseInt(parts[0], 10);
  const m = Number.parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

function minutesToHoursStr(minutes: number): string {
  if (!minutes || minutes <= 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}`;
}

function calcDayTotal(
  morningStart: string,
  morningEnd: string,
  afternoonStart: string,
  afternoonEnd: string,
): number {
  const morning = Math.max(
    0,
    timeToMinutes(morningEnd) - timeToMinutes(morningStart),
  );
  const afternoon = Math.max(
    0,
    timeToMinutes(afternoonEnd) - timeToMinutes(afternoonStart),
  );
  return morning + afternoon;
}

function getWeekDates(weekOffset: number): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(
    today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7,
  );
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

const DAYS_FR = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

interface DayHours {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

const emptyDay = (): DayHours => ({
  morningStart: "",
  morningEnd: "",
  afternoonStart: "",
  afternoonEnd: "",
});

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function safeWorkHoursToDay(wh: WorkHours): DayHours {
  return {
    morningStart: wh.morningStart ?? "",
    morningEnd: wh.morningEnd ?? "",
    afternoonStart: wh.afternoonStart ?? "",
    afternoonEnd: wh.afternoonEnd ?? "",
  };
}

interface TimeInputProps {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onBlur: () => void;
}

function TimeInput({
  id,
  label,
  value,
  disabled,
  onChange,
  onBlur,
}: TimeInputProps) {
  return (
    <div>
      <label htmlFor={id} className="text-[10px] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="time"
        data-ocid="timesheet.input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        className="w-full text-sm border border-input rounded-md px-2 py-1 bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

export default function TimesheetPage() {
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal();
  const myPrincipalStr = myPrincipal?.toString() ?? "";

  // No default `= []` in destructuring — use stable EMPTY_EMPLOYEES constant to avoid infinite loops
  const { data: approvedEmployees, isLoading: loadingEmployees } =
    useGetApprovedEmployees();
  const { mutateAsync: saveWorkHours, isPending: isSaving } =
    useSaveWorkHours();

  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  // Use sentinel value to avoid empty string crashing Radix Select
  const [selectedEmployeeStr, setSelectedEmployeeStr] =
    useState<string>(MINE_SENTINEL);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekMonth = weekDates[0].getMonth() + 1;
  const weekYear = weekDates[0].getFullYear();
  const weekMonthEnd = weekDates[4].getMonth() + 1;
  const weekYearEnd = weekDates[4].getFullYear();

  const isOwnSheet =
    selectedEmployeeStr === MINE_SENTINEL ||
    (!!myPrincipalStr && selectedEmployeeStr === myPrincipalStr);

  const safeApprovedEmployees = approvedEmployees ?? EMPTY_EMPLOYEES;

  const selectedEmployee = useMemo(() => {
    if (selectedEmployeeStr === MINE_SENTINEL || !selectedEmployeeStr) {
      return myPrincipal ?? null;
    }
    const found = safeApprovedEmployees.find(
      ([p]) => p.toString() === selectedEmployeeStr,
    );
    return found ? found[0] : (myPrincipal ?? null);
  }, [selectedEmployeeStr, safeApprovedEmployees, myPrincipal]);

  // No default `= []` in destructuring — prevents new array reference on every render
  const { data: workHoursData } = useGetWorkHoursForMonth(
    selectedEmployee,
    weekMonth,
    weekYear,
  );

  // Fetch next month only if week spans two months
  const needsNextMonth = weekMonthEnd !== weekMonth;
  const { data: workHoursDataNext } = useGetWorkHoursForMonth(
    needsNextMonth ? selectedEmployee : null,
    weekMonthEnd,
    weekYearEnd,
  );

  const allWorkHours = useMemo(
    () => [
      ...(workHoursData ?? EMPTY_WORK_HOURS),
      ...(workHoursDataNext ?? EMPTY_WORK_HOURS),
    ],
    [workHoursData, workHoursDataNext],
  );

  const workHoursMap = useMemo(() => {
    const map: Record<string, WorkHours> = {};
    for (const wh of allWorkHours) {
      if (!wh?.date) continue;
      const k = `${Number(wh.date.year)}-${Number(wh.date.month)}-${Number(wh.date.day)}`;
      map[k] = wh;
    }
    return map;
  }, [allWorkHours]);

  const [localHours, setLocalHours] = useState<Record<string, DayHours>>({});

  // Sync local hours when fetched data or week changes
  const weekKey = weekDates.map(dateKey).join(",");
  const prevWeekKey = useRef("");
  const prevWorkHoursMap = useRef(workHoursMap);

  useEffect(() => {
    const weekChanged = weekKey !== prevWeekKey.current;
    const dataChanged = workHoursMap !== prevWorkHoursMap.current;
    if (!weekChanged && !dataChanged) return;

    prevWeekKey.current = weekKey;
    prevWorkHoursMap.current = workHoursMap;

    const next: Record<string, DayHours> = {};
    for (const date of getWeekDates(weekOffset)) {
      const k = dateKey(date);
      const wh = workHoursMap[k];
      next[k] = wh ? safeWorkHoursToDay(wh) : emptyDay();
    }
    setLocalHours(next);
  }, [weekKey, workHoursMap, weekOffset]);

  const handleTimeChange = useCallback(
    (dateK: string, field: keyof DayHours, value: string) => {
      setLocalHours((prev) => ({
        ...prev,
        [dateK]: { ...(prev[dateK] ?? emptyDay()), [field]: value },
      }));
    },
    [],
  );

  const handleBlur = useCallback(
    async (date: Date, dateK: string) => {
      if (!isOwnSheet) return;
      const hours = localHours[dateK] ?? emptyDay();
      const hasAny =
        hours.morningStart ||
        hours.morningEnd ||
        hours.afternoonStart ||
        hours.afternoonEnd;
      if (!hasAny) return;
      try {
        await saveWorkHours({
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          morningStart: hours.morningStart,
          morningEnd: hours.morningEnd,
          afternoonStart: hours.afternoonStart,
          afternoonEnd: hours.afternoonEnd,
          employeePrincipal: myPrincipalStr,
        });
      } catch (err) {
        console.error("Erreur enregistrement heures:", err);
      }
    },
    [isOwnSheet, localHours, saveWorkHours, myPrincipalStr],
  );

  // Monthly totals (current calendar month) — no default `= []` in destructuring
  const { data: monthlyAllData } = useGetWorkHoursForMonth(
    selectedEmployee,
    today.getMonth() + 1,
    today.getFullYear(),
  );

  const monthlyTotal = useMemo(
    () =>
      (monthlyAllData ?? EMPTY_WORK_HOURS).reduce(
        (acc, wh) =>
          acc +
          calcDayTotal(
            wh?.morningStart ?? "",
            wh?.morningEnd ?? "",
            wh?.afternoonStart ?? "",
            wh?.afternoonEnd ?? "",
          ),
        0,
      ),
    [monthlyAllData],
  );

  const weeklyTotal = useMemo(
    () =>
      weekDates.reduce((acc, date) => {
        const k = dateKey(date);
        const h = localHours[k] ?? emptyDay();
        return (
          acc +
          calcDayTotal(
            h.morningStart,
            h.morningEnd,
            h.afternoonStart,
            h.afternoonEnd,
          )
        );
      }, 0),
    [weekDates, localHours],
  );

  const weekLabel = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[4];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startMonth = MONTHS_FR[start.getMonth()].toLowerCase();
    const endMonth = MONTHS_FR[end.getMonth()].toLowerCase();
    const year = end.getFullYear();
    if (start.getMonth() === end.getMonth()) {
      return `${startDay} - ${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  }, [weekDates]);

  const getEmployeeName = (principalStr: string) => {
    if (principalStr === MINE_SENTINEL) return "Moi";
    const found = safeApprovedEmployees.find(
      ([p]) => p.toString() === principalStr,
    );
    if (found) return found[1].name;
    if (principalStr === myPrincipalStr) return "Moi";
    return `${principalStr.slice(0, 8)}...`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-5xl mx-auto space-y-4">
        {/* Title */}
        <div className="flex items-center gap-2 pt-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Feuille d&apos;heures
          </h1>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[180px]">
            {loadingEmployees ? (
              <div className="flex items-center gap-2 h-10 px-3 border border-input rounded-md bg-card">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Chargement...
                </span>
              </div>
            ) : (
              <Select
                value={selectedEmployeeStr}
                onValueChange={setSelectedEmployeeStr}
              >
                <SelectTrigger data-ocid="timesheet.select" className="bg-card">
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MINE_SENTINEL}>Mes heures</SelectItem>
                  {safeApprovedEmployees
                    .filter(([p]) => p.toString() !== myPrincipalStr)
                    .map(([principal, profile]) => (
                      <SelectItem
                        key={principal.toString()}
                        value={principal.toString()}
                      >
                        {profile.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w - 1)}
              data-ocid="timesheet.pagination_prev"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium text-foreground min-w-[160px] text-center">
              {weekLabel}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w + 1)}
              disabled={weekOffset >= 0}
              data-ocid="timesheet.pagination_next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2 flex-wrap">
          {!isOwnSheet && (
            <Badge variant="secondary" className="text-xs">
              Consultation — {getEmployeeName(selectedEmployeeStr)}
            </Badge>
          )}
          {isSaving && (
            <Badge
              variant="outline"
              className="text-xs text-primary animate-pulse"
              data-ocid="timesheet.loading_state"
            >
              Enregistrement...
            </Badge>
          )}
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                Total semaine
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-primary">
                {minutesToHoursStr(weeklyTotal)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-secondary/20 bg-secondary/5">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                Total mois
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-secondary">
                {minutesToHoursStr(monthlyTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div
            className="grid gap-3 min-w-[640px]"
            style={{ gridTemplateColumns: "repeat(5, minmax(160px, 1fr))" }}
          >
            {weekDates.map((date, i) => {
              const k = dateKey(date);
              const hours = localHours[k] ?? emptyDay();
              const dayTotal = calcDayTotal(
                hours.morningStart,
                hours.morningEnd,
                hours.afternoonStart,
                hours.afternoonEnd,
              );
              const isToday = date.toDateString() === today.toDateString();
              const isFuture = date > today;
              const canEdit = isOwnSheet && !isFuture;

              return (
                <Card
                  key={k}
                  data-ocid={`timesheet.day.card.${i + 1}`}
                  className={`relative ${
                    isToday
                      ? "border-primary shadow-md ring-1 ring-primary/30"
                      : "border-border"
                  } ${isFuture ? "opacity-50" : ""}`}
                >
                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">
                          {DAYS_FR[i]}
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            isToday ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {date.getDate()}{" "}
                          {MONTHS_FR[date.getMonth()].slice(0, 3)}.
                        </p>
                      </div>
                      <Badge
                        variant={dayTotal > 0 ? "default" : "outline"}
                        className={`text-xs ${
                          dayTotal > 0 ? "bg-primary text-white" : ""
                        }`}
                      >
                        {minutesToHoursStr(dayTotal)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Matin
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        <TimeInput
                          id={`${k}-ms`}
                          label="Début"
                          value={hours.morningStart}
                          disabled={!canEdit}
                          onChange={(v) =>
                            handleTimeChange(k, "morningStart", v)
                          }
                          onBlur={() => handleBlur(date, k)}
                        />
                        <TimeInput
                          id={`${k}-me`}
                          label="Fin"
                          value={hours.morningEnd}
                          disabled={!canEdit}
                          onChange={(v) => handleTimeChange(k, "morningEnd", v)}
                          onBlur={() => handleBlur(date, k)}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Après-midi
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        <TimeInput
                          id={`${k}-as`}
                          label="Début"
                          value={hours.afternoonStart}
                          disabled={!canEdit}
                          onChange={(v) =>
                            handleTimeChange(k, "afternoonStart", v)
                          }
                          onBlur={() => handleBlur(date, k)}
                        />
                        <TimeInput
                          id={`${k}-ae`}
                          label="Fin"
                          value={hours.afternoonEnd}
                          disabled={!canEdit}
                          onChange={(v) =>
                            handleTimeChange(k, "afternoonEnd", v)
                          }
                          onBlur={() => handleBlur(date, k)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
