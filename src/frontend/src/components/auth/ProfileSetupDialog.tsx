import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../../hooks/useCurrentUser";

export default function ProfileSetupDialog() {
  const [name, setName] = useState("");
  const { mutate: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveProfile({ name: name.trim() });
  };

  return (
    <Dialog open={true}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Bienvenue !</DialogTitle>
          <DialogDescription>
            Veuillez entrer votre nom pour configurer votre profil.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Votre nom</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Entrez votre nom"
              disabled={isPending}
              autoFocus
            />
          </div>
          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
