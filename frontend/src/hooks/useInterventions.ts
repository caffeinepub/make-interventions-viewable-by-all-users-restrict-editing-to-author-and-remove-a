import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Intervention, ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useClientInterventions(clientId: string) {
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

export function useInterventionsByDate(day: number, month: number, year: number) {
  const { actor, isFetching } = useActor();

  return useQuery<Intervention[]>({
    queryKey: ['interventions-by-date', day, month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInterventionsByDate(BigInt(day), BigInt(month), BigInt(year));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIntervention(clientId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      comments: string;
      media: ExternalBlob[];
      day: number;
      month: number;
      year: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addIntervention(
        clientId,
        data.comments,
        data.media,
        BigInt(data.day),
        BigInt(data.month),
        BigInt(data.year)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions', clientId] });
      toast.success('Intervention ajoutée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de l'ajout de l'intervention : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useUpdateIntervention(clientId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      interventionId: string;
      comments: string;
      media: ExternalBlob[];
      day: number;
      month: number;
      year: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateIntervention(
        data.interventionId,
        clientId,
        data.comments,
        data.media,
        BigInt(data.day),
        BigInt(data.month),
        BigInt(data.year)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions', clientId] });
      toast.success('Intervention mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour de l'intervention : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useDeleteIntervention(clientId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (interventionId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteIntervention(interventionId, clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interventions', clientId] });
      toast.success('Intervention supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression de l'intervention : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}
