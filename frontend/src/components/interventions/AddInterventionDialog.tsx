import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAddIntervention } from '../../hooks/useInterventions';
import { ExternalBlob } from '../../backend';
import MediaPicker from '../media/MediaPicker';
import { Plus, Loader2 } from 'lucide-react';

interface AddInterventionDialogProps {
  clientId: string;
}

export default function AddInterventionDialog({ clientId }: AddInterventionDialogProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [day, setDay] = useState(today.getDate().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState(today.getFullYear().toString());
  const [comments, setComments] = useState('');
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const { mutate: addIntervention, isPending } = useAddIntervention();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addIntervention(
      {
        clientId,
        comments,
        media,
        day: parseInt(day),
        month: parseInt(month),
        year: parseInt(year),
      },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    const now = new Date();
    setDay(now.getDate().toString());
    setMonth((now.getMonth() + 1).toString());
    setYear(now.getFullYear().toString());
    setComments('');
    setMedia([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle intervention</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Date</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="day" className="text-xs text-muted-foreground">Jour</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="month" className="text-xs text-muted-foreground">Mois</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  disabled={isPending}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="year" className="text-xs text-muted-foreground">Année</Label>
                <Input
                  id="year"
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
            <Label htmlFor="comments">Commentaires</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Description de l'intervention..."
              rows={4}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Médias</Label>
            <MediaPicker media={media} onChange={setMedia} disabled={isPending} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
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
