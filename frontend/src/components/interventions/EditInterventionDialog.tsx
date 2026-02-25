import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useUpdateIntervention } from '../../hooks/useInterventions';
import { Intervention, ExternalBlob } from '../../backend';
import MediaPicker from '../media/MediaPicker';

interface EditInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention;
  clientId: string;
}

export default function EditInterventionDialog({ open, onOpenChange, intervention, clientId }: EditInterventionDialogProps) {
  const updateIntervention = useUpdateIntervention(clientId);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [comments, setComments] = useState('');
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  useEffect(() => {
    if (intervention) {
      setDay(String(Number(intervention.date.day)));
      setMonth(String(Number(intervention.date.month)));
      setYear(String(Number(intervention.date.year)));
      setComments(intervention.comments);
      setMedia([...intervention.media]);
    }
  }, [intervention]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateIntervention.mutateAsync({
      interventionId: intervention.id,
      comments,
      media,
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
    });
    onOpenChange(false);
  };

  const handleMediaAdd = (blob: ExternalBlob) => {
    setMedia(prev => [...prev, blob]);
  };

  const handleMediaRemove = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'intervention</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-int-day">Jour</Label>
              <Input
                id="edit-int-day"
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={e => setDay(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-int-month">Mois</Label>
              <Input
                id="edit-int-month"
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-int-year">Année</Label>
              <Input
                id="edit-int-year"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={e => setYear(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-int-comments">Commentaires</Label>
            <Textarea
              id="edit-int-comments"
              placeholder="Décrivez l'intervention..."
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Médias</Label>
            <MediaPicker
              media={media}
              onAdd={handleMediaAdd}
              onRemove={handleMediaRemove}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={updateIntervention.isPending}>
              {updateIntervention.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
