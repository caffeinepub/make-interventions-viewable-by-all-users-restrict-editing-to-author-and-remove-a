import React, { useState } from 'react';
import { Plus, AlertTriangle, RefreshCw, Trash2, Edit, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useClientInterventions, useDeleteIntervention } from '../../hooks/useInterventions';
import { Intervention } from '../../backend';
import AddInterventionDialog from './AddInterventionDialog';
import EditInterventionDialog from './EditInterventionDialog';
import InterventionDetailsDialog from './InterventionDetailsDialog';

interface InterventionListProps {
  clientId: string;
}

export default function InterventionList({ clientId }: InterventionListProps) {
  const { data: interventions, isLoading, isError, refetch } = useClientInterventions(clientId);
  const deleteIntervention = useDeleteIntervention(clientId);

  const [showAdd, setShowAdd] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [viewingIntervention, setViewingIntervention] = useState<Intervention | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (date: { day: bigint; month: bigint; year: bigint }) => {
    return `${String(Number(date.day)).padStart(2, '0')}/${String(Number(date.month)).padStart(2, '0')}/${Number(date.year)}`;
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteIntervention.mutateAsync(deletingId);
    setDeletingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Interventions</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          Ajouter
        </Button>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm text-muted-foreground">Erreur lors du chargement des interventions</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !isError && (!interventions || interventions.length === 0) && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Aucune intervention enregistrée</p>
        </div>
      )}

      {!isLoading && !isError && interventions && interventions.length > 0 && (
        <div className="flex flex-col gap-2">
          {interventions.map(intervention => (
            <div
              key={intervention.id}
              className="bg-card border border-border rounded-xl p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => setViewingIntervention(intervention)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(intervention.date)}</span>
                  </div>
                  {intervention.comments && (
                    <p className="text-sm text-foreground mt-1 line-clamp-2">{intervention.comments}</p>
                  )}
                  {intervention.media.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{intervention.media.length} média(s)</p>
                  )}
                </button>
                <div className="flex gap-1 shrink-0">
                  {intervention.canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingIntervention(intervention)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {intervention.canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(intervention.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddInterventionDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        clientId={clientId}
      />

      {editingIntervention && (
        <EditInterventionDialog
          open={!!editingIntervention}
          onOpenChange={(open) => !open && setEditingIntervention(null)}
          intervention={editingIntervention}
          clientId={clientId}
        />
      )}

      {viewingIntervention && (
        <InterventionDetailsDialog
          open={!!viewingIntervention}
          onOpenChange={(open) => !open && setViewingIntervention(null)}
          intervention={viewingIntervention}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'intervention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'intervention sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
