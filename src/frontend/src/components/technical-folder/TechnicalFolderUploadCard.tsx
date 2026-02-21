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
import { useUploadTechnicalFile } from '../../hooks/useTechnicalFolder';
import { ExternalBlob } from '../../backend';
import { Progress } from '@/components/ui/progress';

interface TechnicalFolderUploadCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
}

export default function TechnicalFolderUploadCard({
  open,
  onOpenChange,
  currentPath,
}: TechnicalFolderUploadCardProps) {
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { mutate: uploadFile, isPending } = useUploadTechnicalFile();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!fileName) {
        setFileName(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileName.trim()) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const fullPath = currentPath ? `${currentPath}/${fileName}` : fileName;

      uploadFile(
        { path: fullPath, blob },
        {
          onSuccess: () => {
            setFileName('');
            setSelectedFile(null);
            setUploadProgress(0);
            onOpenChange(false);
          },
          onError: () => {
            setUploadProgress(0);
          },
        }
      );
    } catch (error) {
      console.error('Erreur lors de la préparation du fichier:', error);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setFileName('');
      setSelectedFile(null);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Télécharger un fichier</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier à télécharger dans le dossier technique
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Fichier *</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileSelect}
                disabled={isPending}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fileName">Nom du fichier *</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.pdf"
                disabled={isPending}
                required
              />
            </div>
            {currentPath && (
              <p className="text-sm text-muted-foreground">
                Chemin: {currentPath}/{fileName || '...'}
              </p>
            )}
            {isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Téléchargement: {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending || !selectedFile || !fileName.trim()}>
              {isPending ? 'Téléchargement...' : 'Télécharger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
