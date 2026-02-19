import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useListTechnicalFiles } from '../../hooks/useTechnicalFolder';
import { ChevronRight, Folder } from 'lucide-react';

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFilePath: string;
  onConfirm: (destinationPath: string) => void;
}

export default function MoveFolderDialog({
  open,
  onOpenChange,
  currentFilePath,
  onConfirm,
}: MoveFolderDialogProps) {
  const { data: files = [] } = useListTechnicalFiles();
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Extract current folder from file path
  const currentFolder = currentFilePath.split('/').slice(0, -1).join('/');

  // Build folder structure from file paths
  const folderStructure = useMemo(() => {
    const folders = new Set<string>();
    
    files.forEach(([path]) => {
      const parts = path.split('/');
      // Add all folder paths
      for (let i = 1; i < parts.length; i++) {
        const folderPath = parts.slice(0, i).join('/');
        folders.add(folderPath);
      }
    });

    return Array.from(folders).sort();
  }, [files]);

  // Get folders at current navigation level
  const currentLevelFolders = useMemo(() => {
    const currentPathString = selectedPath.join('/');
    const folders = new Set<string>();

    folderStructure.forEach((folderPath) => {
      if (currentPathString === '') {
        // Root level - show top-level folders
        const parts = folderPath.split('/');
        if (parts.length === 1) {
          folders.add(parts[0]);
        }
      } else if (folderPath.startsWith(currentPathString + '/')) {
        // Show immediate subfolders
        const relativePath = folderPath.slice(currentPathString.length + 1);
        const parts = relativePath.split('/');
        if (parts.length === 1) {
          folders.add(parts[0]);
        }
      }
    });

    return Array.from(folders).sort();
  }, [folderStructure, selectedPath]);

  const handleFolderClick = (folderName: string) => {
    setSelectedPath([...selectedPath, folderName]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setSelectedPath(selectedPath.slice(0, index));
  };

  const handleConfirm = () => {
    const fileName = currentFilePath.split('/').pop() || '';
    const destinationPath = selectedPath.length > 0 
      ? `${selectedPath.join('/')}/${fileName}`
      : fileName;
    
    onConfirm(destinationPath);
    setSelectedPath([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPath([]);
    onOpenChange(false);
  };

  const selectedPathString = selectedPath.join('/');
  const isCurrentFolder = selectedPathString === currentFolder;
  const canConfirm = !isCurrentFolder && selectedPath.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Déplacer le fichier</DialogTitle>
          <DialogDescription>
            Sélectionnez le dossier de destination pour déplacer ce fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Breadcrumb navigation */}
          <div className="flex items-center gap-1 text-sm flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPath([])}
              className="h-7 px-2"
            >
              Racine
            </Button>
            {selectedPath.map((folder, index) => (
              <div key={index} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(index + 1)}
                  className="h-7 px-2"
                >
                  {folder}
                </Button>
              </div>
            ))}
          </div>

          {/* Folder list */}
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-3 space-y-2">
              {currentLevelFolders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun sous-dossier
                </div>
              ) : (
                currentLevelFolders.map((folderName) => {
                  const folderPath = selectedPath.length > 0
                    ? `${selectedPathString}/${folderName}`
                    : folderName;
                  const isCurrent = folderPath === currentFolder;

                  return (
                    <Card
                      key={folderName}
                      className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                        isCurrent ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => !isCurrent && handleFolderClick(folderName)}
                    >
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folderName}
                          {isCurrent && (
                            <span className="text-xs text-muted-foreground ml-auto">
                              (dossier actuel)
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {isCurrentFolder && selectedPath.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Vous ne pouvez pas déplacer un fichier vers son dossier actuel.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Déplacer ici
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
