import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, ShieldOff } from "lucide-react";
import { useState } from "react";
import type { Client, ExternalBlob } from "../../backend";
import {
  useMarkAsBlacklisted,
  useUnmarkAsBlacklisted,
} from "../../hooks/useBlacklist";
import { useInternetIdentity } from "../../hooks/useInternetIdentity";
import MediaPicker from "../media/MediaPicker";
import MediaPreview from "../media/MediaPreview";

interface BlacklistPanelProps {
  client: Client;
  clientId: string;
}

export default function BlacklistPanel({
  client,
  clientId,
}: BlacklistPanelProps) {
  const { identity } = useInternetIdentity();
  const [comments, setComments] = useState("");
  const [media, setMedia] = useState<ExternalBlob[]>([]);
  const [showForm, setShowForm] = useState(false);

  const { mutate: markBlacklisted, isPending: isMarking } =
    useMarkAsBlacklisted();
  const { mutate: unmarkBlacklisted, isPending: isUnmarking } =
    useUnmarkAsBlacklisted();

  if (!identity) return null;

  const handleMark = () => {
    markBlacklisted(
      { clientId, comments, media },
      {
        onSuccess: () => {
          setShowForm(false);
          setComments("");
          setMedia([]);
        },
      },
    );
  };

  const handleUnmark = () => {
    unmarkBlacklisted({ clientId });
  };

  if (client.isBlacklisted) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Liste noire</h2>
          <Badge variant="destructive">Blacklisté</Badge>
        </div>
        {client.blacklistComments && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-sm text-foreground">
              {client.blacklistComments}
            </p>
          </div>
        )}
        {client.blacklistMedia.length > 0 && (
          <MediaPreview media={client.blacklistMedia} />
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 self-start"
              disabled={isUnmarking}
            >
              {isUnmarking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldOff className="w-4 h-4" />
              )}
              Retirer de la liste noire
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer de la liste noire ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action retirera ce client de la liste noire. Êtes-vous sûr
                ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnmark}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Liste noire</h2>
        <Badge variant="secondary">Non blacklisté</Badge>
      </div>
      {!showForm ? (
        <Button
          variant="outline"
          className="gap-2 self-start border-destructive text-destructive hover:bg-destructive/10"
          onClick={() => setShowForm(true)}
        >
          <AlertTriangle className="w-4 h-4" />
          Ajouter à la liste noire
        </Button>
      ) : (
        <div className="flex flex-col gap-3 bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col gap-2">
            <Label>Commentaires</Label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Raison du blacklistage..."
              rows={3}
              disabled={isMarking}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Pièces jointes</Label>
            <MediaPicker
              media={media}
              onChange={setMedia}
              disabled={isMarking}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setComments("");
                setMedia([]);
              }}
              disabled={isMarking}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleMark}
              disabled={isMarking}
            >
              {isMarking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                "Confirmer le blacklistage"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
