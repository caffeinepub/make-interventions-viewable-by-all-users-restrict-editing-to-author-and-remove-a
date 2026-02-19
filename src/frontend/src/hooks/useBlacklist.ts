import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { ExternalBlob } from '../backend';

export function useMarkAsBlacklisted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      comments: string;
      media: ExternalBlob[];
    }) => {
      if (!actor) throw new Error('Acteur non disponible');
      await actor.markAsBlacklisted(params.clientId, params.comments, params.media);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client ajouté à la liste noire');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec de l\'ajout à la liste noire'}`);
    },
  });
}

export function useUnmarkAsBlacklisted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error('Acteur non disponible');
      await actor.unmarkAsBlacklisted(clientId);
    },
    onSuccess: (_, clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client retiré de la liste noire');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec du retrait de la liste noire'}`);
    },
  });
}
