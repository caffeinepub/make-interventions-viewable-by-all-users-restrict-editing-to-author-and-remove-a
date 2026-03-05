import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useState } from "react";
import type { Intervention } from "../../backend";
import MediaPreview from "../media/MediaPreview";

interface InterventionDetailsDialogProps {
  intervention: Intervention;
  trigger?: React.ReactNode;
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

export default function InterventionDetailsDialog({
  intervention,
  trigger,
}: InterventionDetailsDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon">
            <Eye className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails de l'intervention</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              Date
            </span>
            <span className="font-medium">{formatDate(intervention.date)}</span>
          </div>
          {intervention.comments && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Commentaires
              </span>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {intervention.comments}
              </p>
            </div>
          )}
          {intervention.media.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Médias
              </span>
              <MediaPreview media={intervention.media} clickable />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
