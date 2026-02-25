import React, { useState } from 'react';
import { AlertTriangle, ShieldOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
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
import { useMarkAsBlacklisted, useUnmarkAsBlacklisted } from '../../hooks/useBlacklist';
import { Client, ExternalBlob } from '../../backend';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';

interface BlacklistPanelProps {
  clientId: string;
  client: Client;
}

export default function BlacklistPanel({ clientId, client }: BlacklistPanelProps) {
  const markBlacklisted = useMarkAsBlacklisted(clientId);
  const unmarkBlacklisted = useUnmarkAsBlacklisted(clientId);

  const [showMarkForm, setShowMarkForm] = useState(false);
  const [showUnmarkConfirm, setShowUnmarkConfirm] = useState(false);
  const [comments, setComments] = useState('');
  const [media, setMedia] = useState<ExternalBlob[]>([]);

  const handleMark = async (e: React.FormEvent) => {
    e.preventDefault();
    await markBlacklisted.mutateAsync({ comments, media });
    setComments('');
    setMedia([]);
    setShowMarkForm(false);
  };

  const handleUnmark = async () => {
    await unmarkBlacklisted.mutateAsync();
    setShowUnmarkConfirm(false);
  };

  if (client.isBlacklisted) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span className="font-semibold text-destructive text-sm">Client sur liste noire</span>
        </div>

        {client.blacklistComments && (
          <p className="text-sm text-foreground">{client.blacklistComments}</p>
        )}

        {client.blacklistMedia.length > 0 && (
          <MediaPreview media={client.blacklistMedia} clickable />
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUnmarkConfirm(true)}
          className="self-start"
        >
          <ShieldOff className="mr-2 h-3.5 w-3.5" />
          Retirer de la liste noire
        </Button>

        <AlertDialog open={showUnmarkConfirm} onOpenChange={setShowUnmarkConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Retirer de la liste noire ?</AlertDialogTitle>
              <AlertDialogDescription>
                Ce client sera retiré de la liste noire et pourra à nouveau être mis à jour.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnmark} disabled={unmarkBlacklisted.isPending}>
                {unmarkBlacklisted.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Liste noire</span>
        </div>
        {!showMarkForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMarkForm(true)}
          >
            <AlertTriangle className="mr-2 h-3.5 w-3.5 text-destructive" />
            Marquer
          </Button>
        )}
      </div>

      {showMarkForm && (
        <form onSubmit={handleMark} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="blacklist-comments">Raison</Label>
            <Textarea
              id="blacklist-comments"
              placeholder="Raison de la mise sur liste noire..."
              value={comments}
              onChange={e => setComments(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Preuves (optionnel)</Label>
            <MediaPicker
              media={media}
              onAdd={(blob) => setMedia(prev => [...prev, blob])}
              onRemove={(index) => setMedia(prev => prev.filter((_, i) => i !== index))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowMarkForm(false);
                setComments('');
                setMedia([]);
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={markBlacklisted.isPending}
            >
              {markBlacklisted.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
