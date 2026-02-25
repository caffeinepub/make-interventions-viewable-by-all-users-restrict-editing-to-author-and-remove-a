import React, { useState } from 'react';
import { Eye, Move, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useDeleteTechnicalFile } from '../../hooks/useTechnicalFolder';
import { ExternalBlob } from '../../backend';
import DocumentViewer from './DocumentViewer';
import MoveFolderDialog from './MoveFolderDialog';
import FileTypeIcon from './FileTypeIcon';

interface TechnicalFileRowProps {
  fileName: string;
  filePath: string;
  blob: ExternalBlob;
  currentFolderPath: string;
}

export default function TechnicalFileRow({
  fileName,
  filePath,
  blob,
  currentFolderPath,
}: TechnicalFileRowProps) {
  const deleteFile = useDeleteTechnicalFile();
  const [showViewer, setShowViewer] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    await deleteFile.mutateAsync(filePath);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
        <FileTypeIcon fileName={fileName} className="h-8 w-8 shrink-0" />
        <span className="flex-1 text-sm font-medium text-foreground truncate">{fileName}</span>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowViewer(true)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowMove(true)}
          >
            <Move className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <DocumentViewer
        open={showViewer}
        onOpenChange={setShowViewer}
        blob={blob}
        fileName={fileName}
      />

      <MoveFolderDialog
        open={showMove}
        onOpenChange={setShowMove}
        filePath={filePath}
        currentFolderPath={currentFolderPath}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              "{fileName}" sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
