import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Intervention } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { enqueueOfflineOperation } from '../offline/outbox';
import { useOnlineStatus } from './useOnlineStatus';

export function useGetClientInterventions(clientId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Intervention[]>({
    queryKey: ['interventions', clientId],
    queryFn: async () => {
      if (!actor) return [];
      const interventions = await actor.getClientInterventions(clientId);
      return interventions.sort((a, b) => Number(b.interventionTimestamp - a.interventionTimestamp));
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useAddIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async ({
      clientId,
      comments,
      media,
      date,
    }: {
      clientId: string;
      comments: string;
      media: ExternalBlob[];
      date: { day: number; month: number; year: number };
    }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'addIntervention',
          data: { clientId, comments, media, date },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.addIntervention(
        clientId,
        comments,
        media,
        BigInt(date.day),
        BigInt(date.month),
        BigInt(date.year)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.clientId] });
      toast.success('Intervention added successfully');
    },
    onError: (error: any) => {
      if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error adding intervention');
      }
    },
  });
}

export function useUpdateIntervention() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async ({
      interventionId,
      clientId,
      comments,
      media,
      date,
      canEdit,
    }: {
      interventionId: string;
      clientId: string;
      comments: string;
      media: ExternalBlob[];
      date: { day: number; month: number; year: number };
      canEdit?: boolean;
    }) => {
      // Frontend guard: prevent unauthorized updates
      if (canEdit === false) {
        throw new Error('You can only update your own interventions');
      }

      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'updateIntervention',
          data: { interventionId, clientId, comments, media, date },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.updateIntervention(
        interventionId,
        clientId,
        comments,
        media,
        BigInt(date.day),
        BigInt(date.month),
        BigInt(date.year)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.clientId] });
      toast.success('Intervention updated successfully');
    },
    onError: (error: any) => {
      if (error.message?.includes('You can only update your own interventions')) {
        toast.error('Access denied: You can only update your own interventions');
      } else if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error updating intervention');
      }
    },
  });
}

export function useDeleteIntervention() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async ({
      interventionId,
      clientId,
      canDelete,
    }: {
      interventionId: string;
      clientId: string;
      canDelete?: boolean;
    }) => {
      // Frontend guard: prevent unauthorized deletes
      if (canDelete === false) {
        throw new Error('You can only delete your own interventions');
      }

      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'deleteIntervention',
          data: { interventionId, clientId },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.deleteIntervention(interventionId, clientId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.clientId] });
      toast.success('Intervention deleted successfully');
    },
    onError: (error: any) => {
      if (error.message?.includes('You can only delete your own interventions')) {
        toast.error('Access denied: You can only delete your own interventions');
      } else if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error deleting intervention');
      }
    },
  });
}
