import { useState } from 'react';
import { useMarkAsBlacklisted, useUnmarkAsBlacklisted } from '../../hooks/useBlacklist';
import type { Client } from '../../backend';
import { ExternalBlob } from '../../backend';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import MediaPicker from '../media/MediaPicker';
import MediaPreview from '../media/MediaPreview';

interface BlacklistPanelProps {
  client: Client;
  clientId: string;
}

export default function BlacklistPanel({ client, clientId }: BlacklistPanelProps) {
  const [comments, setComments] = useState(client.blacklistComments);
  const [media, setMedia] = useState<ExternalBlob[]>(client.blacklistMedia);

  const markAsBlacklisted = useMarkAsBlacklisted();
  const unmarkAsBlacklisted = useUnmarkAsBlacklisted();

  const handleMediaSelected = (files: File[]) => {
    const newMedia = files.map((file) => {
      const reader = new FileReader();
      return new Promise<ExternalBlob>((resolve) => {
        reader.onload = () => {
          const bytes = new Uint8Array(reader.result as ArrayBuffer);
          resolve(ExternalBlob.fromBytes(bytes));
        };
        reader.readAsArrayBuffer(file);
      });
    });

    Promise.all(newMedia).then((blobs) => {
      setMedia([...media, ...blobs]);
    });
  };

  const handleMarkBlacklisted = async () => {
    await markAsBlacklisted.mutateAsync({
      clientId,
      comments: comments.trim(),
      media,
    });
  };

  const handleUnmarkBlacklisted = async () => {
    await unmarkAsBlacklisted.mutateAsync(clientId);
    setComments('');
    setMedia([]);
  };

  if (client.isBlacklisted) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Blacklisted Client</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="blacklist-comments">Reason / Comments</Label>
            <Textarea
              id="blacklist-comments"
              placeholder="Reason for blacklisting..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Documents / Evidence</Label>
            <MediaPicker onMediaSelected={handleMediaSelected} />
            {media.length > 0 && <MediaPreview media={media} />}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleUnmarkBlacklisted}
              disabled={unmarkAsBlacklisted.isPending}
              className="flex-1"
            >
              {unmarkAsBlacklisted.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove from Blacklist'
              )}
            </Button>
            <Button
              onClick={handleMarkBlacklisted}
              disabled={markAsBlacklisted.isPending}
              className="flex-1"
            >
              {markAsBlacklisted.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add to Blacklist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="blacklist-comments">Reason / Comments</Label>
          <Textarea
            id="blacklist-comments"
            placeholder="Reason for blacklisting..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>Documents / Evidence</Label>
          <MediaPicker onMediaSelected={handleMediaSelected} />
          {media.length > 0 && <MediaPreview media={media} />}
        </div>
        <Button
          onClick={handleMarkBlacklisted}
          disabled={markAsBlacklisted.isPending}
          variant="destructive"
          className="w-full"
        >
          {markAsBlacklisted.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <AlertCircle className="mr-2 h-4 w-4" />
              Add to Blacklist
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
