import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, User } from 'lucide-react';
import { Intervention } from '../../backend';
import MediaPreview from '../media/MediaPreview';
import EditInterventionDialog from './EditInterventionDialog';

interface InterventionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention;
}

export default function InterventionDetailsDialog({ open, onOpenChange, intervention }: InterventionDetailsDialogProps) {
  const [showEdit, setShowEdit] = useState(false);

  const formatDate = (date: { day: bigint; month: bigint; year: bigint }) => {
    return `${String(Number(date.day)).padStart(2, '0')}/${String(Number(date.month)).padStart(2, '0')}/${Number(date.year)}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'intervention</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(intervention.date)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-mono text-xs">{intervention.employee.toString().slice(0, 20)}...</span>
            </div>

            {intervention.comments && (
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-foreground">Commentaires</span>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{intervention.comments}</p>
              </div>
            )}

            {intervention.media.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-foreground">Médias</span>
                <MediaPreview media={intervention.media} clickable />
              </div>
            )}

            {intervention.canEdit && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setShowEdit(true);
                }}
                className="w-full"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showEdit && (
        <EditInterventionDialog
          open={showEdit}
          onOpenChange={setShowEdit}
          intervention={intervention}
          clientId={intervention.clientId}
        />
      )}
    </>
  );
}
