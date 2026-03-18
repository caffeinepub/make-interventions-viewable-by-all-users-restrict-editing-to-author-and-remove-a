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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Pencil,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import FilePicker from "../components/media/FilePicker";
import ScheduledInterventionFormDialog from "../components/planning/ScheduledInterventionFormDialog";
import SignatureCanvas from "../components/planning/SignatureCanvas";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddIntervention } from "../hooks/useInterventions";
import {
  useDeleteScheduledIntervention,
  useGetScheduledInterventionById,
  useUpdateScheduledIntervention,
} from "../hooks/useScheduledInterventions";
import { useIsCallerAdmin } from "../hooks/useUserApproval";
import { useSaveWorkHours } from "../hooks/useWorkHours";
import { getISOWeek, getISOWeekYear } from "../utils/dateUtils";

interface CompletionHours {
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
}

function TimeInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-input rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

export default function ScheduledInterventionDetailPage() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();

  const { data: intervention, isLoading } = useGetScheduledInterventionById(
    params.interventionId ?? "",
  );
  const deleteMutation = useDeleteScheduledIntervention();
  const updateMutation = useUpdateScheduledIntervention();
  const addInterventionMutation = useAddIntervention();
  const { mutateAsync: saveWorkHours } = useSaveWorkHours();

  const [editOpen, setEditOpen] = useState(false);

  // Completion form state
  const [completionHours, setCompletionHours] = useState<CompletionHours>({
    morningStart: "",
    morningEnd: "",
    afternoonStart: "",
    afternoonEnd: "",
  });
  const [actualDescription, setActualDescription] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [employeeSig, setEmployeeSig] = useState<string | null>(null);
  const [clientSig, setClientSig] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const callerPrincipal = identity?.getPrincipal().toString();
  const isCreator = callerPrincipal === intervention?.createdBy.toString();
  const isAssigned =
    callerPrincipal === intervention?.assignedEmployee.toString();
  const canEdit = isAdmin || isCreator;

  const isCompleted = !!(
    intervention?.employeeSignature && intervention.employeeSignature.length > 0
  );

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

  const handleValidate = async () => {
    if (!intervention) return;
    if (!employeeSig) {
      toast.error("La signature de l'employé est obligatoire");
      return;
    }

    setIsValidating(true);
    try {
      const d = intervention.date;
      const day = Number(d.day);
      const month = Number(d.month);
      const year = Number(d.year);
      const dateObj = new Date(year, month - 1, day);
      const weekNumber = getISOWeek(dateObj);
      const weekYear = getISOWeekYear(dateObj);

      // Upload new media files
      const newMediaBlobs: ExternalBlob[] = [];
      for (const file of mediaFiles) {
        const buf = await file.arrayBuffer();
        newMediaBlobs.push(ExternalBlob.fromBytes(new Uint8Array(buf)));
      }
      // Keep existing media + add new ones
      const allMedia = [...(intervention.media ?? []), ...newMediaBlobs];

      // 1. Update scheduled intervention with completion data
      await updateMutation.mutateAsync({
        id: intervention.id,
        clientId: intervention.clientId,
        clientName: intervention.clientName,
        assignedEmployee: intervention.assignedEmployee,
        reason: intervention.reason,
        startTime: intervention.startTime,
        endTime: intervention.endTime,
        description: actualDescription.trim() || intervention.description || "",
        media: allMedia,
        employeeSignature: employeeSig,
        clientSignature: clientSig,
        day,
        month,
        year,
        weekNumber,
        weekYear,
      });

      // 2. Add intervention to client dossier (only if client is linked)
      if (intervention.clientId && !intervention.clientId.startsWith("new-")) {
        await addInterventionMutation.mutateAsync({
          clientId: intervention.clientId,
          comments:
            actualDescription.trim() ||
            intervention.description ||
            `Intervention planifiée : ${intervention.reason || intervention.clientName}`,
          media: newMediaBlobs,
          day,
          month,
          year,
        });
      }

      // 3. Save work hours if any entered
      const hasHours =
        completionHours.morningStart ||
        completionHours.morningEnd ||
        completionHours.afternoonStart ||
        completionHours.afternoonEnd;
      if (hasHours) {
        await saveWorkHours({
          day,
          month,
          year,
          morningStart: completionHours.morningStart,
          morningEnd: completionHours.morningEnd,
          afternoonStart: completionHours.afternoonStart,
          afternoonEnd: completionHours.afternoonEnd,
        });
      }

      // 4. Success & navigate
      toast.success("Intervention validée");
      navigate({ to: "/planning" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur lors de la validation: ${msg}`);
    } finally {
      setIsValidating(false);
    }
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
      <div className="flex flex-wrap gap-2 mb-4">
        {intervention.reason && (
          <Badge variant="secondary">{intervention.reason}</Badge>
        )}
        <Badge
          className={`border-0 ${
            isCompleted ? "bg-green-500 text-white" : "bg-orange-500 text-white"
          }`}
        >
          {isCompleted ? "Réalisé" : "Non réalisé"}
        </Badge>
      </div>

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
            <p className="text-xs text-muted-foreground">Horaire prévu</p>
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
            <p className="text-xs text-muted-foreground">Description prévue</p>
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

      {/* Completed view: show existing signatures */}
      {isCompleted && (
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h2 className="text-sm font-semibold text-foreground">
              Intervention réalisée
            </h2>
          </div>
          <Separator />
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

      {/* Realisation form: shown to assigned employee if not completed */}
      {!isCompleted && isAssigned && (
        <div className="flex flex-col gap-5 mt-2">
          <Separator />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-3 h-3 text-orange-600" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Réaliser l&apos;intervention
            </h2>
          </div>

          {/* Actual hours */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Heures réelles
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-foreground mb-2">
                  Matin
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <TimeInput
                    id="comp-ms"
                    label="Début"
                    value={completionHours.morningStart}
                    onChange={(v) =>
                      setCompletionHours((prev) => ({
                        ...prev,
                        morningStart: v,
                      }))
                    }
                  />
                  <TimeInput
                    id="comp-me"
                    label="Fin"
                    value={completionHours.morningEnd}
                    onChange={(v) =>
                      setCompletionHours((prev) => ({
                        ...prev,
                        morningEnd: v,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground mb-2">
                  Après-midi
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <TimeInput
                    id="comp-as"
                    label="Début"
                    value={completionHours.afternoonStart}
                    onChange={(v) =>
                      setCompletionHours((prev) => ({
                        ...prev,
                        afternoonStart: v,
                      }))
                    }
                  />
                  <TimeInput
                    id="comp-ae"
                    label="Fin"
                    value={completionHours.afternoonEnd}
                    onChange={(v) =>
                      setCompletionHours((prev) => ({
                        ...prev,
                        afternoonEnd: v,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actual description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="actual-desc">
              Description de l&apos;intervention réalisée
            </Label>
            <Textarea
              id="actual-desc"
              data-ocid="planning.textarea"
              value={actualDescription}
              onChange={(e) => setActualDescription(e.target.value)}
              placeholder="Décrivez l'intervention effectuée..."
              rows={3}
            />
          </div>

          {/* Media picker */}
          <div className="flex flex-col gap-2">
            <Label>Photos / Vidéos</Label>
            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {mediaFiles.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs"
                  >
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setMediaFiles((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    >
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FilePicker
              onSelect={(files) => setMediaFiles((prev) => [...prev, ...files])}
              accept="image/*,video/*"
              label="Ajouter des photos / vidéos"
              data-ocid="planning.upload_button"
            />
          </div>

          {/* Employee signature */}
          <SignatureCanvas
            label="Signature de l'employé *"
            value={employeeSig}
            onChange={setEmployeeSig}
          />

          {/* Client signature */}
          <SignatureCanvas
            label="Signature du client"
            value={clientSig}
            onChange={setClientSig}
          />

          {/* Validate button */}
          <Button
            onClick={handleValidate}
            disabled={isValidating}
            data-ocid="planning.confirm_button"
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isValidating ? "Validation en cours..." : "Valider l'intervention"}
          </Button>
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
