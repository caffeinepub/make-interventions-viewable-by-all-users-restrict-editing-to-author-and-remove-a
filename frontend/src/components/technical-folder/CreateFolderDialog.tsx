import React, { useState } from 'react';
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
import { useCreateFolder } from '../../hooks/useTechnicalFolder';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
}

export default function CreateFolderDialog({ open, onOpenChange, currentPath }: CreateFolderDialogProps) {
  const createFolder = useCreateFolder();
  const [folderName, setFolderName] = useState('');

  const isValid = folderName.trim().length > 0 && !folderName.includes('/');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const path = currentPath
      ? `${currentPath}/${folderName.trim()}`
      : folderName.trim();

    await createFolder.mutateAsync(path);
    setFolderName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nouveau dossier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {currentPath && (
            <p className="text-xs text-muted-foreground">
              Dans : <span className="font-mono">{currentPath}</span>
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="folder-name">Nom du dossier</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={e => setFolderName(e.target.value)}
              placeholder="Nom du dossier"
              autoFocus
            />
            {folderName.includes('/') && (
              <p className="text-xs text-destructive">Le nom ne peut pas contenir de "/"</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || createFolder.isPending}>
              {createFolder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
