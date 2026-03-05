import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Folder, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useListTechnicalFiles,
  useMoveTechnicalFile,
} from "../../hooks/useTechnicalFolder";

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filePath: string;
  currentFolderPath: string;
}

export default function MoveFolderDialog({
  open,
  onOpenChange,
  filePath,
  currentFolderPath,
}: MoveFolderDialogProps) {
  const { data: files = [] } = useListTechnicalFiles();
  const { mutate: moveFile, isPending } = useMoveTechnicalFile();
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Build folder structure from file paths
  const folderStructure = useMemo(() => {
    const folders = new Set<string>();

    for (const [path] of files) {
      const parts = path.split("/");
      // Add all folder paths (exclude the file name itself)
      for (let i = 1; i < parts.length; i++) {
        const folderPath = parts.slice(0, i).join("/");
        folders.add(folderPath);
      }
    }

    return Array.from(folders).sort();
  }, [files]);

  // Get folders at current navigation level
  const currentLevelFolders = useMemo(() => {
    const currentPathString = selectedPath.join("/");
    const folders = new Set<string>();

    for (const folderPath of folderStructure) {
      if (currentPathString === "") {
        const parts = folderPath.split("/");
        if (parts.length === 1) {
          folders.add(parts[0]);
        }
      } else if (folderPath.startsWith(`${currentPathString}/`)) {
        const relativePath = folderPath.slice(currentPathString.length + 1);
        const parts = relativePath.split("/");
        if (parts.length === 1) {
          folders.add(parts[0]);
        }
      }
    }

    return Array.from(folders).sort();
  }, [folderStructure, selectedPath]);

  const handleFolderClick = (folderName: string) => {
    setSelectedPath([...selectedPath, folderName]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setSelectedPath(selectedPath.slice(0, index));
  };

  const handleConfirm = () => {
    const fileName = filePath.split("/").pop() || "";
    const destinationPath =
      selectedPath.length > 0
        ? `${selectedPath.join("/")}/${fileName}`
        : fileName;

    moveFile(
      { oldPath: filePath, newPath: destinationPath },
      {
        onSuccess: () => {
          setSelectedPath([]);
          onOpenChange(false);
        },
      },
    );
  };

  const handleCancel = () => {
    setSelectedPath([]);
    onOpenChange(false);
  };

  const selectedPathString = selectedPath.join("/");
  const isCurrentFolder = selectedPathString === currentFolderPath;
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
              <div key={folder} className="flex items-center gap-1">
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
                  const folderPath =
                    selectedPath.length > 0
                      ? `${selectedPathString}/${folderName}`
                      : folderName;
                  const isCurrent = folderPath === currentFolderPath;

                  return (
                    <button
                      type="button"
                      key={folderName}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                        isCurrent
                          ? "opacity-50 cursor-not-allowed bg-muted"
                          : "hover:bg-accent/50 cursor-pointer"
                      }`}
                      onClick={() =>
                        !isCurrent && handleFolderClick(folderName)
                      }
                      disabled={isCurrent}
                    >
                      <Folder className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{folderName}</span>
                      {isCurrent && (
                        <span className="text-xs text-muted-foreground">
                          (actuel)
                        </span>
                      )}
                    </button>
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
          <Button onClick={handleConfirm} disabled={!canConfirm || isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Déplacement...
              </>
            ) : (
              "Déplacer ici"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
