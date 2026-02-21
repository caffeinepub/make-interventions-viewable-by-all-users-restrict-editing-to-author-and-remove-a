import { useState } from 'react';
import { useGetClientInterventions, useDeleteIntervention } from '../../hooks/useInterventions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, RefreshCw } from 'lucide-react';
import AddInterventionDialog from './AddInterventionDialog';
import EditInterventionDialog from './EditInterventionDialog';
import InterventionDetailsDialog from './InterventionDetailsDialog';
import type { Intervention } from '../../backend';
import { useGetUserProfile } from '../../hooks/useCurrentUser';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useQueryClient } from '@tanstack/react-query';

interface InterventionListProps {
  clientId: string;
}

export default function InterventionList({ clientId }: InterventionListProps) {
  const { data: interventions = [], isLoading, isError, error } = useGetClientInterventions(clientId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interventionToDelete, setInterventionToDelete] = useState<Intervention | null>(null);
  const queryClient = useQueryClient();

  const { mutate: deleteIntervention } = useDeleteIntervention();

  const handleEditClick = (e: React.MouseEvent, intervention: Intervention) => {
    e.stopPropagation();
    setSelectedIntervention(intervention);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, intervention: Intervention) => {
    e.stopPropagation();
    setInterventionToDelete(intervention);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (interventionToDelete) {
      deleteIntervention({
        interventionId: interventionToDelete.id,
        clientId: interventionToDelete.clientId,
      });
      setDeleteDialogOpen(false);
      setInterventionToDelete(null);
    }
  };

  const handleCardClick = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setIsDetailsDialogOpen(true);
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['interventions', clientId] });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Chargement des interventions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Interventions</h2>
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {interventions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Aucune intervention
        </div>
      ) : (
        <div className="space-y-3">
          {interventions.map((intervention) => (
            <InterventionCard
              key={intervention.id}
              intervention={intervention}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onClick={handleCardClick}
            />
          ))}
        </div>
      )}

      <AddInterventionDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        clientId={clientId}
      />

      {selectedIntervention && (
        <>
          <EditInterventionDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            intervention={selectedIntervention}
          />
          <InterventionDetailsDialog
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
            intervention={selectedIntervention}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette intervention ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InterventionCard({
  intervention,
  onEdit,
  onDelete,
  onClick,
}: {
  intervention: Intervention;
  onEdit: (e: React.MouseEvent, intervention: Intervention) => void;
  onDelete: (e: React.MouseEvent, intervention: Intervention) => void;
  onClick: (intervention: Intervention) => void;
}) {
  const { data: authorProfile } = useGetUserProfile(intervention.employee);

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onClick(intervention)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {intervention.date.day.toString().padStart(2, '0')}/
            {intervention.date.month.toString().padStart(2, '0')}/
            {intervention.date.year}
          </CardTitle>
          <div className="flex gap-1">
            {intervention.canEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => onEdit(e, intervention)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {intervention.canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={(e) => onDelete(e, intervention)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
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
