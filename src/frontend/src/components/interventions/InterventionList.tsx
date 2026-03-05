import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Edit,
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Intervention } from "../../backend";
import {
  useDeleteIntervention,
  useGetClientInterventions,
} from "../../hooks/useInterventions";
import AddInterventionDialog from "./AddInterventionDialog";
import EditInterventionDialog from "./EditInterventionDialog";
import InterventionDetailsDialog from "./InterventionDetailsDialog";

interface InterventionListProps {
  clientId: string;
}

function formatDate(date: {
  day: bigint;
  month: bigint;
  year: bigint;
}): string {
  const d = Number(date.day).toString().padStart(2, "0");
  const m = Number(date.month).toString().padStart(2, "0");
  const y = Number(date.year);
  return `${d}/${m}/${y}`;
}

export default function InterventionList({ clientId }: InterventionListProps) {
  const {
    data: interventions,
    isLoading,
    error,
    refetch,
  } = useGetClientInterventions(clientId);
  const { mutate: deleteIntervention, isPending: isDeleting } =
    useDeleteIntervention();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (intervention: Intervention) => {
    setDeletingId(intervention.id);
    deleteIntervention(
      { interventionId: intervention.id, clientId },
      { onSettled: () => setDeletingId(null) },
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Interventions</h2>
        <AddInterventionDialog clientId={clientId} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-muted-foreground text-center">
            {(error as Error).message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </Button>
        </div>
      ) : !interventions || interventions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Aucune intervention enregistrée
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {interventions.map((intervention) => (
            <li
              key={intervention.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
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
                <div className="flex items-center gap-1 shrink-0">
                  <InterventionDetailsDialog intervention={intervention} />
                  {intervention.canEdit && (
                    <EditInterventionDialog
                      intervention={intervention}
                      clientId={clientId}
                    />
                  )}
                  {intervention.canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={
                            isDeleting && deletingId === intervention.id
                          }
                        >
                          {isDeleting && deletingId === intervention.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Supprimer l'intervention ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(intervention)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
