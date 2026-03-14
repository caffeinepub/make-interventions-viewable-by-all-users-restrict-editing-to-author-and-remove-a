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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import ScheduledInterventionFormDialog from "../components/planning/ScheduledInterventionFormDialog";
import SignatureCanvas from "../components/planning/SignatureCanvas";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useDeleteScheduledIntervention,
  useGetScheduledInterventionById,
} from "../hooks/useScheduledInterventions";
import { useIsCallerAdmin } from "../hooks/useUserApproval";
import { getISOWeek, getISOWeekYear } from "../utils/dateUtils";

export default function ScheduledInterventionDetailPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();

  const { data: intervention, isLoading } = useGetScheduledInterventionById(
    params.interventionId ?? "",
  );
  const deleteMutation = useDeleteScheduledIntervention();

  const [editOpen, setEditOpen] = useState(false);

  const callerPrincipal = identity?.getPrincipal().toString();
  const isCreator = callerPrincipal === intervention?.createdBy.toString();
  const canEdit = isAdmin || isCreator;

  const handleDelete = async () => {
    if (!intervention) return;
    const d = intervention.date;
    const dateObj = new Date(
      Number(d.year),
      Number(d.month) - 1,
      Number(d.day),
    );
    await deleteMutation.mutateAsync({
      id: intervention.id,
      weekNumber: getISOWeek(dateObj),
      weekYear: getISOWeekYear(dateObj),
    });
    navigate({ to: "/planning" });
  };

  const getMediaType = (url: string) => {
    const lower = url.toLowerCase();
    if (/\.(mp4|webm|mov|avi|mkv)/.test(lower)) return "video";
    return "image";
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh] gap-3"
        data-ocid="planning.loading_state"
      >
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Chargement...</span>
      </div>
    );
  }

  if (!intervention) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center"
        data-ocid="planning.error_state"
      >
        <p className="text-muted-foreground">Intervention introuvable.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/planning" })}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  const d = intervention.date;
  const dateStr = `${String(Number(d.day)).padStart(2, "0")}/${String(Number(d.month)).padStart(2, "0")}/${Number(d.year)}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          data-ocid="planning.button"
          onClick={() => navigate({ to: "/planning" })}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Planning
        </Button>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              data-ocid="planning.edit_button"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  data-ocid="planning.delete_button"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="planning.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Supprimer l&apos;intervention ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="planning.cancel_button">
                    Annuler
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="planning.confirm_button"
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground mb-1">
        {intervention.clientName}
      </h1>
      {intervention.reason && (
        <Badge variant="secondary" className="mb-4">
          {intervention.reason}
        </Badge>
      )}

      <Separator className="mb-4" />

      {/* Meta info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-start gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="text-sm font-medium">{dateStr}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Horaire</p>
            <p className="text-sm font-medium">
              {intervention.startTime} – {intervention.endTime}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-medium">{intervention.clientName}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm">
              {intervention.description || "Aucune description"}
            </p>
          </div>
        </div>
      </div>

      {/* Media */}
      {intervention.media.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Photos / Vidéos
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {intervention.media.map((blob, i) => {
              const url = blob.getDirectURL();
              const type = getMediaType(url);
              const mediaKey = `media-${i}`;
              return type === "video" ? (
                // biome-ignore lint/a11y/useMediaCaption: captions not applicable for user uploads
                <video
                  key={mediaKey}
                  src={url}
                  controls
                  className="w-full rounded-lg"
                />
              ) : (
                <img
                  key={mediaKey}
                  src={url}
                  alt={`Media ${i + 1}`}
                  className="w-full rounded-lg object-cover aspect-square"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Signatures */}
      {(intervention.employeeSignature || intervention.clientSignature) && (
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-sm font-semibold text-foreground">Signatures</h2>
          {intervention.employeeSignature && (
            <SignatureCanvas
              label="Signature de l'employé"
              value={intervention.employeeSignature}
              readOnly
            />
          )}
          {intervention.clientSignature && (
            <SignatureCanvas
              label="Signature du client"
              value={intervention.clientSignature}
              readOnly
            />
          )}
        </div>
      )}

      {/* Edit dialog */}
      <ScheduledInterventionFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        existing={intervention}
      />
    </div>
  );
}
