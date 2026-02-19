import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMarkAsBlacklisted, useUnmarkAsBlacklisted } from '../../hooks/useBlacklist';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';
import type { Client } from '../../backend';
import { ExternalBlob } from '../../backend';
import AppBadge from '../common/AppBadge';

interface BlacklistPanelProps {
  clientId: string;
  client: Client;
}

export default function BlacklistPanel({ clientId, client }: BlacklistPanelProps) {
  const [comments, setComments] = useState(client.blacklistComments || '');
  const [media, setMedia] = useState<ExternalBlob[]>(client.blacklistMedia || []);

  const { mutate: markAsBlacklisted, isPending: isMarking } = useMarkAsBlacklisted();
  const { mutate: unmarkAsBlacklisted, isPending: isUnmarking } = useUnmarkAsBlacklisted();

  const handleMediaCapture = (files: File[]) => {
    const newMedia = files.map((file) => {
      const reader = new FileReader();
      return new Promise<ExternalBlob>((resolve) => {
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          resolve(ExternalBlob.fromBytes(uint8Array));
        };
        reader.readAsArrayBuffer(file);
      });
    });

    Promise.all(newMedia).then((blobs) => {
      setMedia([...media, ...blobs]);
    });
  };

  const handleMarkAsBlacklisted = () => {
    markAsBlacklisted({
      clientId,
      comments,
      media,
    });
  };

  const handleUnmarkAsBlacklisted = () => {
    unmarkAsBlacklisted(clientId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Statut de la liste noire</CardTitle>
          {client.isBlacklisted && (
            <AppBadge variant="destructive">Sur la liste noire</AppBadge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {client.isBlacklisted ? (
          <>
            <div className="space-y-2">
              <Label>Commentaires</Label>
              <p className="text-sm whitespace-pre-wrap">
                {client.blacklistComments || 'Aucun commentaire'}
              </p>
            </div>
            {client.blacklistMedia.length > 0 && (
              <div className="space-y-2">
                <Label>Médias</Label>
                <MediaPreview media={client.blacklistMedia} />
              </div>
            )}
            <Button
              onClick={handleUnmarkAsBlacklisted}
              disabled={isUnmarking}
              variant="outline"
              className="w-full"
            >
              {isUnmarking ? 'Retrait...' : 'Retirer de la liste noire'}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires</Label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Raison de l'ajout à la liste noire..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Médias</Label>
              <MediaPicker onCapture={handleMediaCapture} />
              {media.length > 0 && <MediaPreview media={media} />}
            </div>
            <Button
              onClick={handleMarkAsBlacklisted}
              disabled={isMarking}
              variant="destructive"
              className="w-full"
            >
              {isMarking ? 'Ajout...' : 'Ajouter à la liste noire'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
