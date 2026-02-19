import { useState } from 'react';
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
import { useAddIntervention } from '../../hooks/useInterventions';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';
import { ExternalBlob } from '../../backend';

interface AddInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export default function AddInterventionDialog({
  open,
  onOpenChange,
  clientId,
}: AddInterventionDialogProps) {
  const today = new Date();
  const [formData, setFormData] = useState({
    day: today.getDate().toString(),
    month: (today.getMonth() + 1).toString(),
    year: today.getFullYear().toString(),
    comments: '',
  });
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const { mutate: addIntervention, isPending } = useAddIntervention();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIntervention(
      {
        clientId,
        comments: formData.comments,
        media,
        date: {
          day: BigInt(formData.day),
          month: BigInt(formData.month),
          year: BigInt(formData.year),
        },
      },
      {
        onSuccess: () => {
          setFormData({
            day: today.getDate().toString(),
            month: (today.getMonth() + 1).toString(),
            year: today.getFullYear().toString(),
            comments: '',
          });
          setMedia([]);
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
            <DialogTitle>Nouvelle intervention</DialogTitle>
            <DialogDescription>
              Enregistrez les détails de l'intervention
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
              {isPending ? 'Ajout...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
