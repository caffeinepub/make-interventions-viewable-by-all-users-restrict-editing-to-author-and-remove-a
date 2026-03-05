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
import { Loader2, Pencil } from "lucide-react";
import { useState } from "react";
import { useRenameFolder } from "../../hooks/useTechnicalFolder";

interface RenameFolderDialogProps {
  folderPath: string;
  currentName: string;
}

export default function RenameFolderDialog({
  folderPath,
  currentName,
}: RenameFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(currentName);
  const { mutate: renameFolder, isPending } = useRenameFolder();

  const isValid =
    newName.trim().length > 0 &&
    !newName.includes("/") &&
    newName.trim() !== currentName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    renameFolder(
      { oldPath: folderPath, newName: newName.trim() },
      {
        onSuccess: () => setOpen(false),
      },
    );
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) setNewName(currentName);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      </DialogTrigger>
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
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nouveau nom du dossier"
              autoFocus
              disabled={isPending}
            />
            {newName.includes("/") && (
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
                  Renommage...
                </>
              ) : (
                "Renommer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
