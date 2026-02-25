import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRenameFolder } from '../../hooks/useTechnicalFolder';

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderPath: string;
  currentName: string;
}

export default function RenameFolderDialog({ open, onOpenChange, folderPath, currentName }: RenameFolderDialogProps) {
  const renameFolder = useRenameFolder();
  const [newName, setNewName] = useState(currentName);

  useEffect(() => {
    setNewName(currentName);
  }, [currentName]);

  const isValid = newName.trim().length > 0 && !newName.includes('/') && newName.trim() !== currentName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    await renameFolder.mutateAsync({ oldPath: folderPath, newName: newName.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Renommer le dossier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-folder">Nouveau nom</Label>
            <Input
              id="rename-folder"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nouveau nom du dossier"
              autoFocus
            />
            {newName.includes('/') && (
              <p className="text-xs text-destructive">Le nom ne peut pas contenir de "/"</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || renameFolder.isPending}>
              {renameFolder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renommage...
                </>
              ) : (
                'Renommer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
