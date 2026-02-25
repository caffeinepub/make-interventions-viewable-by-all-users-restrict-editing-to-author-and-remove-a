import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useMarkAsBlacklisted(clientId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { comments: string; media: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.markAsBlacklisted(clientId, data.comments, data.media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success('Client ajouté à la liste noire');
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useUnmarkAsBlacklisted(clientId: string) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.unmarkAsBlacklisted(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success('Client retiré de la liste noire');
    },
    onError: (error: any) => {
      toast.error(`Erreur : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}
