import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import type { Intervention } from '../../backend';
import MediaPreview from '../media/MediaPreview';

interface InterventionDetailsDialogProps {
  intervention: Intervention;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authorLabel: string;
  canEdit: boolean;
  onEdit?: () => void;
}

export default function InterventionDetailsDialog({
  intervention,
  open,
  onOpenChange,
  authorLabel,
  canEdit,
  onEdit,
}: InterventionDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Intervention Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <div className="text-lg font-medium">
              {String(intervention.date.day).padStart(2, '0')}/
              {String(intervention.date.month).padStart(2, '0')}/{intervention.date.year}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Employee</Label>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{authorLabel}</span>
            </div>
          </div>
          {intervention.comments && (
            <div className="space-y-2">
              <Label>Comments</Label>
              <div className="text-sm whitespace-pre-wrap rounded-md border bg-muted/50 p-3">
                {intervention.comments}
              </div>
            </div>
          )}
          {intervention.media.length > 0 && (
            <div className="space-y-2">
              <Label>Photos / Videos</Label>
              <MediaPreview media={intervention.media} />
            </div>
          )}
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Close
          </Button>
          {canEdit && onEdit && (
            <Button onClick={onEdit} className="flex-1">
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
