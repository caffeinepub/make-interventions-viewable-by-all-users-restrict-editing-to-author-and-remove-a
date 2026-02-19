import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import MobileLayout from '../components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useGetInterventionsByDate } from '../hooks/useInterventions';
import { useGetUserProfile } from '../hooks/useCurrentUser';
import InterventionDetailsDialog from '../components/interventions/InterventionDetailsDialog';
import type { Intervention } from '../backend';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const day = selectedDate ? selectedDate.getDate() : 0;
  const month = selectedDate ? selectedDate.getMonth() + 1 : 0;
  const year = selectedDate ? selectedDate.getFullYear() : 0;

  const { data: interventions = [], isLoading } = useGetInterventionsByDate(
    BigInt(day),
    BigInt(month),
    BigInt(year)
  );

  const handleInterventionClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setIsDetailsDialogOpen(true);
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sélectionner une date</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={fr}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {selectedDate && (
          <Card>
            <CardHeader>
              <CardTitle>
                Interventions du {format(selectedDate, 'dd/MM/yyyy', { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Chargement...
                </div>
              ) : interventions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Aucune intervention pour cette date
                </div>
              ) : (
                <div className="space-y-3">
                  {interventions.map((intervention) => (
                    <InterventionCard
                      key={intervention.id}
                      intervention={intervention}
                      onClick={() => handleInterventionClick(intervention)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
  onClick: () => void;
}) {
  const { data: authorProfile } = useGetUserProfile(intervention.employee);

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={onClick}
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
      </CardContent>
    </Card>
  );
}
