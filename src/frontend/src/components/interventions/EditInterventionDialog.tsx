import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2 } from "lucide-react";
import { useState } from "react";
import type { ExternalBlob, Intervention } from "../../backend";
import { useUpdateIntervention } from "../../hooks/useInterventions";
import MediaPicker from "../media/MediaPicker";

interface EditInterventionDialogProps {
  intervention: Intervention;
  clientId: string;
}

export default function EditInterventionDialog({
  intervention,
  clientId,
}: EditInterventionDialogProps) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState(Number(intervention.date.day).toString());
  const [month, setMonth] = useState(
    Number(intervention.date.month).toString(),
  );
  const [year, setYear] = useState(Number(intervention.date.year).toString());
  const [comments, setComments] = useState(intervention.comments);
  const [media, setMedia] = useState<ExternalBlob[]>(intervention.media);

  const { mutate: updateIntervention, isPending } = useUpdateIntervention();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateIntervention(
      {
        interventionId: intervention.id,
        clientId,
        comments,
        media,
        day: Number.parseInt(day),
        month: Number.parseInt(month),
        year: Number.parseInt(year),
      },
      {
        onSuccess: () => setOpen(false),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'intervention</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Date</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="edit-day"
                  className="text-xs text-muted-foreground"
                >
                  Jour
                </Label>
                <Input
                  id="edit-day"
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="edit-month"
                  className="text-xs text-muted-foreground"
                >
                  Mois
                </Label>
                <Input
                  id="edit-month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="edit-year"
                  className="text-xs text-muted-foreground"
                >
                  Année
                </Label>
                <Input
                  id="edit-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-comments">Commentaires</Label>
            <Textarea
              id="edit-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Médias</Label>
            <MediaPicker
              media={media}
              onChange={setMedia}
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
