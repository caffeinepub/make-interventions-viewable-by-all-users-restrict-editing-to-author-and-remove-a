import { useState } from 'react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../../hooks/useCurrentUser';
import { useDeleteIntervention } from '../../hooks/useInterventions';
import type { Intervention } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Edit, Trash2, User } from 'lucide-react';
import MediaPreview from '../media/MediaPreview';
import EditInterventionDialog from './EditInterventionDialog';

interface InterventionListProps {
  clientId: string;
  interventions?: Intervention[];
  isLoading: boolean;
}

export default function InterventionList({ clientId, interventions, isLoading }: InterventionListProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const deleteIntervention = useDeleteIntervention();
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!interventions || interventions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Aucune intervention enregistrée
        </CardContent>
      </Card>
    );
  }

  const isAuthor = (intervention: Intervention) => {
    return identity && intervention.employee.toString() === identity.getPrincipal().toString();
  };

  return (
    <>
      <div className="space-y-3">
        {interventions.map((intervention) => (
          <Card key={intervention.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">
                    {String(intervention.date.day).padStart(2, '0')}/
                    {String(intervention.date.month).padStart(2, '0')}/{intervention.date.year}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <User className="h-3 w-3" />
                    <span>{isAuthor(intervention) ? userProfile?.name || 'Vous' : 'Autre employé'}</span>
                  </div>
                </div>
                {isAuthor(intervention) && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingIntervention(intervention)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteIntervention.mutate({ interventionId: intervention.id, clientId })
                      }
                      disabled={deleteIntervention.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            {(intervention.comments || intervention.media.length > 0) && (
              <CardContent className="space-y-3">
                {intervention.comments && <p className="text-sm">{intervention.comments}</p>}
                {intervention.media.length > 0 && <MediaPreview media={intervention.media} />}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {editingIntervention && (
        <EditInterventionDialog
          intervention={editingIntervention}
          clientId={clientId}
          open={!!editingIntervention}
          onOpenChange={(open) => !open && setEditingIntervention(null)}
        />
      )}
    </>
  );
}
