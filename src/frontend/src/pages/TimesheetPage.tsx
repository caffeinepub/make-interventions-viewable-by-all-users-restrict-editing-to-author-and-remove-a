import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetApprovedEmployees } from "../hooks/useScheduledInterventions";
import type { WorkHours } from "../hooks/useWorkHours";
import {
  useGetWorkHoursForMonth,
  useSaveWorkHours,
} from "../hooks/useWorkHours";

function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHoursStr(minutes: number): string {
  if (minutes <= 0) return "\u2014";
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
  "F\u00e9vrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Ao\u00fbt",
  "Septembre",
  "Octobre",
  "Novembre",
  "D\u00e9cembre",
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
        data-ocid="timesheet.day.input"
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

  const { data: approvedEmployees = [] } = useGetApprovedEmployees();
  const { mutateAsync: saveWorkHours, isPending: isSaving } =
    useSaveWorkHours();

  const today = new Date();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedEmployeeStr, setSelectedEmployeeStr] = useState<string>("");

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekMonth = weekDates[0].getMonth() + 1;
  const weekYear = weekDates[0].getFullYear();
  const weekMonthEnd = weekDates[4].getMonth() + 1;
  const weekYearEnd = weekDates[4].getFullYear();

  useEffect(() => {
    if (myPrincipalStr && !selectedEmployeeStr) {
      setSelectedEmployeeStr(myPrincipalStr);
    }
  }, [myPrincipalStr, selectedEmployeeStr]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeStr) return null;
    const found = approvedEmployees.find(
      ([p]) => p.toString() === selectedEmployeeStr,
    );
    return found ? found[0] : (myPrincipal ?? null);
  }, [selectedEmployeeStr, approvedEmployees, myPrincipal]);

  const isOwnSheet = selectedEmployeeStr === myPrincipalStr;

  const { data: workHoursData = [] } = useGetWorkHoursForMonth(
    selectedEmployee,
    weekMonth,
    weekYear,
  );
  const { data: workHoursDataNext = [] } = useGetWorkHoursForMonth(
    weekMonthEnd !== weekMonth ? selectedEmployee : null,
    weekMonthEnd,
    weekYearEnd,
  );

  const allWorkHours = useMemo(
    () => [...workHoursData, ...workHoursDataNext],
    [workHoursData, workHoursDataNext],
  );

  const workHoursMap = useMemo(() => {
    const map: Record<string, WorkHours> = {};
    for (const wh of allWorkHours) {
      const k = `${Number(wh.date.year)}-${Number(wh.date.month)}-${Number(wh.date.day)}`;
      map[k] = wh;
    }
    return map;
  }, [allWorkHours]);

  const [localHours, setLocalHours] = useState<Record<string, DayHours>>({});

  useEffect(() => {
    const next: Record<string, DayHours> = {};
    for (const date of weekDates) {
      const k = dateKey(date);
      const wh = workHoursMap[k];
      next[k] = wh
        ? {
            morningStart: wh.morningStart,
            morningEnd: wh.morningEnd,
            afternoonStart: wh.afternoonStart,
            afternoonEnd: wh.afternoonEnd,
          }
        : emptyDay();
    }
    setLocalHours(next);
  }, [workHoursMap, weekDates]);

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
    },
    [isOwnSheet, localHours, saveWorkHours, myPrincipalStr],
  );

  const { data: monthlyAllData = [] } = useGetWorkHoursForMonth(
    selectedEmployee,
    today.getMonth() + 1,
    today.getFullYear(),
  );

  const monthlyTotal = useMemo(
    () =>
      monthlyAllData.reduce(
        (acc, wh) =>
          acc +
          calcDayTotal(
            wh.morningStart,
            wh.morningEnd,
            wh.afternoonStart,
            wh.afternoonEnd,
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
    const found = approvedEmployees.find(
      ([p]) => p.toString() === principalStr,
    );
    if (found) return found[1].name;
    if (principalStr === myPrincipalStr) return "Moi";
    return `${principalStr.slice(0, 8)}...`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center gap-2 pt-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
          >
            Feuille d'heures
          </h1>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[180px]">
            <Select
              value={selectedEmployeeStr}
              onValueChange={setSelectedEmployeeStr}
            >
              <SelectTrigger
                data-ocid="timesheet.employee_select"
                className="bg-card"
              >
                <SelectValue placeholder="S\u00e9lectionner un employ\u00e9" />
              </SelectTrigger>
              <SelectContent>
                {myPrincipalStr && (
                  <SelectItem value={myPrincipalStr}>Mes heures</SelectItem>
                )}
                {approvedEmployees
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
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((w) => w - 1)}
              data-ocid="timesheet.prev_week_button"
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
              data-ocid="timesheet.next_week_button"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isOwnSheet && (
          <Badge variant="secondary" className="text-xs">
            Consultation uniquement \u2014{" "}
            {getEmployeeName(selectedEmployeeStr)}
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
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">
                Total {MONTHS_FR[today.getMonth()]}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <p className="text-2xl font-bold text-accent-foreground">
                {minutesToHoursStr(monthlyTotal)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="overflow-x-auto">
          <div
            className="grid gap-3"
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
                          label="D\u00e9but"
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
                        Apr\u00e8s-midi
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        <TimeInput
                          id={`${k}-as`}
                          label="D\u00e9but"
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
