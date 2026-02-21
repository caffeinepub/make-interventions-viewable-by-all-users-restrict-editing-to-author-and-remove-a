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
import { Button } from '@/components/ui/button';
import { useRenameFolder } from '../../hooks/useTechnicalFolder';

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
}

export default function RenameFolderDialog({
  open,
  onOpenChange,
  folderPath,
}: RenameFolderDialogProps) {
  const [newName, setNewName] = useState('');
  const { mutate: renameFolder, isPending } = useRenameFolder();

  const currentFolderName = folderPath.split('/').pop() || folderPath;

  useEffect(() => {
    if (open) {
      setNewName(currentFolderName);
    }
  }, [open, currentFolderName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      return;
    }

    if (newName.includes('/')) {
      return;
    }

    if (newName === currentFolderName) {
      onOpenChange(false);
      return;
    }

    renameFolder(
      { oldPath: folderPath, newName: newName.trim() },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Renommer le dossier</DialogTitle>
            <DialogDescription>
              Entrez le nouveau nom pour le dossier "{currentFolderName}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newName">Nouveau nom *</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="nouveau-nom"
                disabled={isPending}
                required
              />
              {newName.includes('/') && (
                <p className="text-sm text-destructive">
                  Le nom ne peut pas contenir de "/"
                </p>
              )}
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
            <Button 
              type="submit" 
              disabled={isPending || !newName.trim() || newName.includes('/') || newName === currentFolderName}
            >
              {isPending ? 'Renommage...' : 'Renommer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
