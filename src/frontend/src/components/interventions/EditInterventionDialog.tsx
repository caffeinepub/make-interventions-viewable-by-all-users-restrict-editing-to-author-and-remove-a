import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpdateIntervention } from '../../hooks/useInterventions';
import type { Intervention } from '../../backend';
import { ExternalBlob } from '../../backend';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';
import { Loader2 } from 'lucide-react';

interface EditInterventionDialogProps {
  intervention: Intervention;
  clientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditInterventionDialog({
  intervention,
  clientId,
  open,
  onOpenChange,
}: EditInterventionDialogProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [comments, setComments] = useState('');
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const updateIntervention = useUpdateIntervention();

  useEffect(() => {
    if (intervention) {
      setDay(String(intervention.date.day));
      setMonth(String(intervention.date.month));
      setYear(String(intervention.date.year));
      setComments(intervention.comments);
      setMedia(intervention.media);
    }
  }, [intervention]);

  const handleSubmit = async () => {
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (!dayNum || !monthNum || !yearNum) return;

    await updateIntervention.mutateAsync({
      interventionId: intervention.id,
      clientId,
      comments: comments.trim(),
      media,
      date: {
        day: dayNum,
        month: monthNum,
        year: yearNum,
      },
      canEdit: intervention.canEdit,
    });

    onOpenChange(false);
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
          <DialogTitle>Edit Intervention</DialogTitle>
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
            <Button onClick={handleSubmit} disabled={updateIntervention.isPending} className="flex-1">
              {updateIntervention.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
