import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { AlertTriangle, RefreshCw, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInterventionsByDate } from '../hooks/useInterventions';
import InterventionDetailsDialog from '../components/interventions/InterventionDetailsDialog';
import { Intervention } from '../backend';

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  const day = selectedDate.getDate();
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { data: interventions, isLoading, isError, refetch } = useInterventionsByDate(day, month, year);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-foreground">Tableau de bord</h1>

      {/* Calendar */}
      <div className="bg-card border border-border rounded-xl p-2 flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md"
        />
      </div>

      {/* Interventions for selected date */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground capitalize">{formatDate(selectedDate)}</h2>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">Erreur lors du chargement des interventions</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        )}

        {!isLoading && !isError && (!interventions || interventions.length === 0) && (
          <div className="text-center py-6 bg-card border border-border rounded-xl">
            <CalendarDays className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune intervention ce jour</p>
          </div>
        )}

        {!isLoading && !isError && interventions && interventions.length > 0 && (
          <div className="flex flex-col gap-2">
            {interventions.map(intervention => (
              <button
                key={intervention.id}
                onClick={() => setSelectedIntervention(intervention)}
                className="w-full text-left bg-card border border-border rounded-xl p-3 hover:bg-accent/50 transition-colors active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      Client : {intervention.clientId}
                    </p>
                    {intervention.comments && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {intervention.comments}
                      </p>
                    )}
                  </div>
                  {intervention.media.length > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {intervention.media.length} média(s)
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedIntervention && (
        <InterventionDetailsDialog
          intervention={selectedIntervention}
          open={!!selectedIntervention}
          onOpenChange={(open) => !open && setSelectedIntervention(null)}
        />
      )}
    </div>
  );
}
