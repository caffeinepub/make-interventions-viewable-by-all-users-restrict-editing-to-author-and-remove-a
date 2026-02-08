import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAddIntervention } from '../../hooks/useInterventions';
import { ExternalBlob } from '../../backend';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';
import { Loader2 } from 'lucide-react';

interface AddInterventionDialogProps {
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddInterventionDialog({ clientId, open, onOpenChange }: AddInterventionDialogProps) {
  const today = new Date();
  const [day, setDay] = useState(today.getDate().toString());
  const [month, setMonth] = useState((today.getMonth() + 1).toString());
  const [year, setYear] = useState(today.getFullYear().toString());
  const [comments, setComments] = useState('');
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const addIntervention = useAddIntervention();

  const handleSubmit = async () => {
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (!dayNum || !monthNum || !yearNum) return;

    await addIntervention.mutateAsync({
      clientId,
      comments: comments.trim(),
      media,
      date: {
        day: dayNum,
        month: monthNum,
        year: yearNum,
      },
    });

    onOpenChange(false);
    setDay(today.getDate().toString());
    setMonth((today.getMonth() + 1).toString());
    setYear(today.getFullYear().toString());
    setComments('');
    setMedia([]);
  };

  const handleMediaSelected = (files: File[]) => {
    const newMedia = files.map((file) => {
      const reader = new FileReader();
      return new Promise<ExternalBlob>((resolve) => {
        reader.onload = () => {
          const bytes = new Uint8Array(reader.result as ArrayBuffer);
          resolve(ExternalBlob.fromBytes(bytes));
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
        <DialogHeader>
          <DialogTitle>New Intervention</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <Input id="day" type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="month">Month</Label>
              <Input
                id="month"
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                min="2000"
                max="2100"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              placeholder="Intervention details..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Photos / Videos</Label>
            <MediaPicker onMediaSelected={handleMediaSelected} />
            {media.length > 0 && <MediaPreview media={media} />}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={addIntervention.isPending} className="flex-1">
              {addIntervention.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
