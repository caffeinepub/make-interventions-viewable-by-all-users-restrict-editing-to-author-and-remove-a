import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Intervention } from '../backend';
import { toast } from 'sonner';
import { enqueueOfflineOperation } from '../offline/outbox';
import { useOnlineStatus } from './useOnlineStatus';
import type { ExternalBlob } from '../backend';

export function useGetClientInterventions(clientId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Intervention[]>({
    queryKey: ['interventions', clientId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClientInterventions(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

export function useAddIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      comments: string;
      media: ExternalBlob[];
      date: { day: bigint; month: bigint; year: bigint };
    }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'addIntervention',
          data: {
            clientId: params.clientId,
            comments: params.comments,
            media: params.media,
            day: params.date.day,
            month: params.date.month,
            year: params.date.year,
          },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Acteur non disponible');
      await actor.addIntervention(
        params.clientId,
        params.comments,
        params.media,
        params.date.day,
        params.date.month,
        params.date.year
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.clientId] });
      toast.success('Intervention ajoutée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec de l\'ajout de l\'intervention'}`);
    },
  });
}

export function useUpdateIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: {
      interventionId: string;
      clientId: string;
      comments: string;
      media: ExternalBlob[];
      date: { day: bigint; month: bigint; year: bigint };
      canEdit: boolean;
    }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'updateIntervention',
          data: {
            interventionId: params.interventionId,
            clientId: params.clientId,
            comments: params.comments,
            media: params.media,
            day: params.date.day,
            month: params.date.month,
            year: params.date.year,
          },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Acteur non disponible');
      await actor.updateIntervention(
        params.interventionId,
        params.clientId,
        params.comments,
        params.media,
        params.date.day,
        params.date.month,
        params.date.year
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.clientId] });
      toast.success('Intervention mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec de la mise à jour de l\'intervention'}`);
    },
  });
}

export function useDeleteIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: { interventionId: string; clientId: string }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'deleteIntervention',
          data: params,
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Acteur non disponible');
      await actor.deleteIntervention(params.interventionId, params.clientId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interventions', variables.clientId] });
      toast.success('Intervention supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec de la suppression de l\'intervention'}`);
    },
  });
}

export function useGetInterventionsByDate(day: bigint, month: bigint, year: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Intervention[]>({
    queryKey: ['interventions', 'date', day.toString(), month.toString(), year.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInterventionsByDate(day, month, year);
    },
    enabled: !!actor && !isFetching,
  });
}
