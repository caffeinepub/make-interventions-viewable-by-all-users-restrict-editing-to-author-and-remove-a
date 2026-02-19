import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Download, FolderInput } from 'lucide-react';
import { useDeleteTechnicalFile, useMoveFile } from '../../hooks/useTechnicalFolder';
import type { ExternalBlob } from '../../backend';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import MoveFolderDialog from './MoveFolderDialog';

interface TechnicalFileRowProps {
  path: string;
  blob: ExternalBlob;
}

export default function TechnicalFileRow({ path, blob }: TechnicalFileRowProps) {
  const { mutate: deleteFile } = useDeleteTechnicalFile();
  const { mutate: moveFile, isPending: isMoving } = useMoveFile();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const fileName = path.split('/').pop() || path;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  const handleDelete = () => {
    deleteFile(path);
    setDeleteDialogOpen(false);
  };

  const handleMove = (destinationPath: string) => {
    moveFile({ oldPath: path, newPath: destinationPath });
  };

  const handleDownload = async () => {
    try {
      const bytes = await blob.getBytes();
      const blobObj = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blobObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
    }
  };

  const renderPreview = () => {
    const directUrl = blob.getDirectURL();

    if (fileExtension === 'pdf') {
      return (
        <div className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
        </div>
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
      return (
        <img
          src={directUrl}
          alt={fileName}
          className="w-16 h-16 object-cover rounded"
        />
      );
    }

    if (['mp4', 'webm', 'ogg'].includes(fileExtension || '')) {
      return (
        <video
          src={directUrl}
          className="w-16 h-16 object-cover rounded"
          controls
        />
      );
    }

    return <span className="text-2xl">📎</span>;
  };

  return (
    <>
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {renderPreview()}
              <CardTitle className="text-sm truncate">{fileName}</CardTitle>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMoveDialogOpen(true)}
                disabled={isMoving}
                title="Déplacer le fichier"
              >
                <FolderInput className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
                title="Supprimer le fichier"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce fichier ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MoveFolderDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        currentFilePath={path}
        onConfirm={handleMove}
      />
    </>
  );
}
