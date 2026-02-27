import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useGetInterventionsByDate } from '../hooks/useInterventions';
import { Intervention } from '../backend';
import { Loader2, AlertTriangle, RefreshCw, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InterventionDetailsDialog from '../components/interventions/InterventionDetailsDialog';

function formatDate(date: { day: bigint; month: bigint; year: bigint }): string {
  const d = Number(date.day).toString().padStart(2, '0');
  const m = Number(date.month).toString().padStart(2, '0');
  const y = Number(date.year);
  return `${d}/${m}/${y}`;
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const day = selectedDate.getDate();
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { data: interventions, isLoading, error, refetch } = useGetInterventionsByDate(day, month, year);

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>
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
          Interventions du {selectedDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">{(error as Error).message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
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
            {interventions.map((intervention: Intervention) => (
              <li key={intervention.id}>
                <InterventionDetailsDialog
                  intervention={intervention}
                  trigger={
                    <button className="w-full bg-card border border-border rounded-xl p-4 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground">
                          {formatDate(intervention.date)}
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
