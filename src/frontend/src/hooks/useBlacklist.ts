import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { enqueueOfflineOperation } from '../offline/outbox';
import { useOnlineStatus } from './useOnlineStatus';

export function useMarkAsBlacklisted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async ({
      clientId,
      comments,
      media,
    }: {
      clientId: string;
      comments: string;
      media: ExternalBlob[];
    }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'markAsBlacklisted',
          data: { clientId, comments, media },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.markAsBlacklisted(clientId, comments, media);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      toast.success('Client added to blacklist');
    },
    onError: (error: any) => {
      if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error adding to blacklist');
      }
    },
  });
}

export function useUnmarkAsBlacklisted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'unmarkAsBlacklisted',
          data: { clientId },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.unmarkAsBlacklisted(clientId);
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success('Client removed from blacklist');
    },
    onError: (error: any) => {
      if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error removing from blacklist');
      }
    },
  });
}
