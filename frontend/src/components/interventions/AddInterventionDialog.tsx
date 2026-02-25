import React, { useState } from 'react';
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
import { useAddIntervention } from '../../hooks/useInterventions';
import { ExternalBlob } from '../../backend';
import MediaPicker from '../media/MediaPicker';

interface AddInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export default function AddInterventionDialog({ open, onOpenChange, clientId }: AddInterventionDialogProps) {
  const addIntervention = useAddIntervention(clientId);
  const today = new Date();
  const [day, setDay] = useState(String(today.getDate()));
  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [comments, setComments] = useState('');
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addIntervention.mutateAsync({
      comments,
      media,
      day: parseInt(day),
      month: parseInt(month),
      year: parseInt(year),
    });
    setComments('');
    setMedia([]);
    setDay(String(today.getDate()));
    setMonth(String(today.getMonth() + 1));
    setYear(String(today.getFullYear()));
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
          <DialogTitle>Nouvelle intervention</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-day">Jour</Label>
              <Input
                id="add-day"
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={e => setDay(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-month">Mois</Label>
              <Input
                id="add-month"
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={e => setMonth(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="add-year">Année</Label>
              <Input
                id="add-year"
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
            <Label htmlFor="add-comments">Commentaires</Label>
            <Textarea
              id="add-comments"
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
            <Button type="submit" disabled={addIntervention.isPending}>
              {addIntervention.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
