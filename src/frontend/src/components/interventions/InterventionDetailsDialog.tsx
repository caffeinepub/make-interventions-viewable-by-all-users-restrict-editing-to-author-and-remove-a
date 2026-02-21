import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Edit } from 'lucide-react';
import MediaPreview from '../media/MediaPreview';
import type { Intervention } from '../../backend';
import { useGetUserProfile } from '../../hooks/useCurrentUser';
import { useState } from 'react';
import EditInterventionDialog from './EditInterventionDialog';

interface InterventionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention;
}

export default function InterventionDetailsDialog({
  open,
  onOpenChange,
  intervention,
}: InterventionDetailsDialogProps) {
  const { data: authorProfile } = useGetUserProfile(intervention.employee);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditClick = () => {
    onOpenChange(false);
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      onOpenChange(true);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'intervention</DialogTitle>
            <DialogDescription>
              Informations complètes de l'intervention
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <p className="text-sm">
                {intervention.date.day.toString().padStart(2, '0')}/
                {intervention.date.month.toString().padStart(2, '0')}/
                {intervention.date.year}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Auteur</Label>
              <p className="text-sm">
                {authorProfile?.name || 'Chargement...'}
              </p>
            </div>
            {intervention.comments && (
              <div className="grid gap-2">
                <Label>Commentaires</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {intervention.comments}
                </p>
              </div>
            )}
            {intervention.media.length > 0 && (
              <div className="grid gap-2">
                <Label>Médias</Label>
                <MediaPreview media={intervention.media} clickable />
              </div>
            )}
          </div>
          {intervention.canEdit && (
            <div className="flex justify-end">
              <Button onClick={handleEditClick} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {intervention.canEdit && (
        <EditInterventionDialog
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          intervention={intervention}
        />
      )}
    </>
  );
}
