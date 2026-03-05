import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderPlus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreateFolder } from "../../hooks/useTechnicalFolder";

interface CreateFolderDialogProps {
  currentPath: string;
}

export default function CreateFolderDialog({
  currentPath,
}: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const { mutate: createFolder, isPending } = useCreateFolder();

  const isValid = folderName.trim().length > 0 && !folderName.includes("/");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const path = currentPath
      ? `${currentPath}/${folderName.trim()}`
      : folderName.trim();

    createFolder(
      { path },
      {
        onSuccess: () => {
          setFolderName("");
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FolderPlus className="w-4 h-4" />
          Nouveau dossier
        </Button>
      </DialogTrigger>
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
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Nom du dossier"
              autoFocus
              disabled={isPending}
            />
            {folderName.includes("/") && (
              <p className="text-xs text-destructive">
                Le nom ne peut pas contenir de "/"
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
