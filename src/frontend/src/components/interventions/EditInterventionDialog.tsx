import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpdateIntervention } from '../../hooks/useInterventions';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';
import type { Intervention } from '../../backend';
import { ExternalBlob } from '../../backend';

interface EditInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention;
}

export default function EditInterventionDialog({
  open,
  onOpenChange,
  intervention,
}: EditInterventionDialogProps) {
  const [formData, setFormData] = useState({
    day: '',
    month: '',
    year: '',
    comments: '',
  });
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const { mutate: updateIntervention, isPending } = useUpdateIntervention();

  useEffect(() => {
    if (intervention) {
      setFormData({
        day: intervention.date.day.toString(),
        month: intervention.date.month.toString(),
        year: intervention.date.year.toString(),
        comments: intervention.comments,
      });
      setMedia(intervention.media);
    }
  }, [intervention]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateIntervention(
      {
        interventionId: intervention.id,
        clientId: intervention.clientId,
        comments: formData.comments,
        media,
        date: {
          day: BigInt(formData.day),
          month: BigInt(formData.month),
          year: BigInt(formData.year),
        },
        canEdit: intervention.canEdit,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleMediaCapture = (files: File[]) => {
    const newMedia = files.map((file) => {
      const reader = new FileReader();
      return new Promise<ExternalBlob>((resolve) => {
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(ExternalBlob.fromBytes(uint8Array));
        };
        reader.readAsArrayBuffer(file);
      });
    });

    Promise.all(newMedia).then((blobs) => {
      setMedia([...media, ...blobs]);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier l'intervention</DialogTitle>
            <DialogDescription>
              Mettez à jour les détails de l'intervention
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="day">Jour *</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.day}
                  onChange={(e) =>
                    setFormData({ ...formData, day: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="month">Mois *</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({ ...formData, month: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Année *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comments">Commentaires</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
                placeholder="Détails de l'intervention..."
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>Médias</Label>
              <MediaPicker onCapture={handleMediaCapture} />
              {media.length > 0 && <MediaPreview media={media} />}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
