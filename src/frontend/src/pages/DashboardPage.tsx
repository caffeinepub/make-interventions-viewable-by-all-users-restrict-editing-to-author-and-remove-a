import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import MobileLayout from '../components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { useGetInterventionsByDate } from '../hooks/useInterventions';
import { useGetUserProfile } from '../hooks/useCurrentUser';
import type { Intervention } from '../backend';
import InterventionDetailsDialog from '../components/interventions/InterventionDetailsDialog';
import { useQueryClient } from '@tanstack/react-query';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const day = BigInt(selectedDate.getDate());
  const month = BigInt(selectedDate.getMonth() + 1);
  const year = BigInt(selectedDate.getFullYear());

  const { data: interventions = [], isLoading, isError, error } = useGetInterventionsByDate(day, month, year);

  const handleCardClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setIsDetailsDialogOpen(true);
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['interventions', 'date', day.toString(), month.toString(), year.toString()] 
    });
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/clients' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Tableau de bord</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sélectionner une date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Interventions du{' '}
              {selectedDate.getDate().toString().padStart(2, '0')}/
              {(selectedDate.getMonth() + 1).toString().padStart(2, '0')}/
              {selectedDate.getFullYear()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement des interventions...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <div className="p-3 rounded-full bg-destructive/10">
                  <RefreshCw className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Impossible de charger les interventions
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error instanceof Error 
                      ? error.message.includes('Non autorisé')
                        ? 'Accès refusé - Veuillez vous reconnecter'
                        : 'Erreur de connexion - Vérifiez votre connexion Internet'
                      : 'Une erreur est survenue lors du chargement des données'}
                  </p>
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : interventions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune intervention pour cette date
              </div>
            ) : (
              <div className="space-y-3">
                {interventions.map((intervention) => (
                  <InterventionCard
                    key={intervention.id}
                    intervention={intervention}
                    onClick={handleCardClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedIntervention && (
        <InterventionDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          intervention={selectedIntervention}
        />
      )}
    </MobileLayout>
  );
}

function InterventionCard({
  intervention,
  onClick,
}: {
  intervention: Intervention;
  onClick: (intervention: Intervention) => void;
}) {
  const { data: authorProfile } = useGetUserProfile(intervention.employee);

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onClick(intervention)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Client: {intervention.clientId}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        <p className="text-muted-foreground">
          Par: {authorProfile?.name || 'Chargement...'}
        </p>
        {intervention.comments && (
          <p className="line-clamp-2">{intervention.comments}</p>
        )}
        {intervention.media.length > 0 && (
          <p className="text-xs text-muted-foreground">
            📎 {intervention.media.length} fichier(s)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
