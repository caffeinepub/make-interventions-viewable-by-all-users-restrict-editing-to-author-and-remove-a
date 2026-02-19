import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Client, Address } from '../backend';
import { toast } from 'sonner';
import { enqueueOfflineOperation } from '../offline/outbox';
import { useOnlineStatus } from './useOnlineStatus';

export function useGetClients() {
  const { actor, isFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClient(clientId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!actor) throw new Error('Acteur non disponible');
      return actor.getClient(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

export function useCreateOrUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      name: string;
      address: Address;
      phone: string;
      email: string;
    }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'createOrUpdateClient',
          data: params,
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Acteur non disponible');
      await actor.createOrUpdateClient(
        params.id,
        params.name,
        params.address,
        params.phone,
        params.email
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client enregistré avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec de l\'enregistrement du client'}`);
    },
  });
}
