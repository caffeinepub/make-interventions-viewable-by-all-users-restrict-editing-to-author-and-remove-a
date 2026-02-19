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
import FilePicker from '../media/FilePicker';
import { ExternalBlob } from '../../backend';

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

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      if (!fileName) {
        setFileName(file.name);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileName.trim()) return;

    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress(
        (percentage) => {
          setUploadProgress(percentage);
        }
      );

      const fullPath = currentPath
        ? `${currentPath}/${fileName.trim()}`
        : fileName.trim();

      uploadFile(
        { path: fullPath, blob },
        {
          onSuccess: () => {
            setFileName('');
            setSelectedFile(null);
            setUploadProgress(0);
            onOpenChange(false);
          },
        }
      );
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Télécharger un fichier</DialogTitle>
            <DialogDescription>
              Sélectionnez un fichier et donnez-lui un nom
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fileName">Nom du fichier *</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="nom-du-fichier.pdf"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Sélectionner un fichier *</Label>
              <FilePicker
                onSelect={handleFileSelect}
                accept="application/pdf,image/*,video/*"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Fichier sélectionné: {selectedFile.name}
                </p>
              )}
            </div>
            {isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <Label>Progression du téléchargement</Label>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress}%
                </p>
              </div>
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
            <Button type="submit" disabled={!selectedFile || !fileName.trim() || isPending}>
              {isPending ? 'Téléchargement...' : 'Télécharger'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
