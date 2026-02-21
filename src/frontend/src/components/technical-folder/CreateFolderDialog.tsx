import { useState } from 'react';
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
import { useCreateFolder } from '../../hooks/useTechnicalFolder';

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
}

export default function CreateFolderDialog({
  open,
  onOpenChange,
  currentPath,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState('');
  const { mutate: createFolder, isPending } = useCreateFolder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) {
      return;
    }

    if (folderName.includes('/')) {
      return;
    }

    const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;

    createFolder(fullPath, {
      onSuccess: () => {
        setFolderName('');
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer un dossier</DialogTitle>
            <DialogDescription>
              Entrez le nom du nouveau dossier
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Nom du dossier *</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="nom-du-dossier"
                disabled={isPending}
                required
              />
              {folderName.includes('/') && (
                <p className="text-sm text-destructive">
                  Le nom du dossier ne peut pas contenir de "/"
                </p>
              )}
            </div>
            {currentPath && (
              <p className="text-sm text-muted-foreground">
                Chemin: {currentPath}/{folderName || '...'}
              </p>
            )}
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
            <Button type="submit" disabled={isPending || !folderName.trim() || folderName.includes('/')}>
              {isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
