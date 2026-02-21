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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      queryClient.invalidateQueries({ queryKey: ['interventions', 'date'] });
      toast.success('Intervention ajoutée avec succès');
    },
    onError: (error: any) => {
      const message = error.message || 'Échec de l\'ajout de l\'intervention';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Veuillez vous reconnecter');
      } else if (message.includes('non trouvé')) {
        toast.error('Client introuvable');
      } else {
        toast.error(`Erreur: ${message}`);
      }
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
      queryClient.invalidateQueries({ queryKey: ['interventions', 'date'] });
      toast.success('Intervention mise à jour avec succès');
    },
    onError: (error: any) => {
      const message = error.message || 'Échec de la mise à jour de l\'intervention';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Vous ne pouvez modifier que vos propres interventions');
      } else if (message.includes('non trouvé')) {
        toast.error('Intervention introuvable');
      } else {
        toast.error(`Erreur: ${message}`);
      }
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
      queryClient.invalidateQueries({ queryKey: ['interventions', 'date'] });
      toast.success('Intervention supprimée avec succès');
    },
    onError: (error: any) => {
      const message = error.message || 'Échec de la suppression de l\'intervention';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Vous ne pouvez supprimer que vos propres interventions');
      } else if (message.includes('non trouvé')) {
        toast.error('Intervention introuvable');
      } else {
        toast.error(`Erreur: ${message}`);
      }
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
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
