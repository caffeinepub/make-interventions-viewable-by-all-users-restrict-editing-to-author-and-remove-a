import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Client, Address } from '../backend';
import { toast } from 'sonner';
import { enqueueOfflineOperation } from '../offline/outbox';
import { useOnlineStatus } from './useOnlineStatus';

export function useGetClients() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClients();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetClient(clientId: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Client | null>({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getClient(clientId);
      } catch (error) {
        console.error('Error fetching client:', error);
        return null;
      }
    },
    enabled: !!actor && !actorFetching && !!clientId,
  });
}

export function useSearchClients(searchString: string) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ['searchClients', searchString],
    queryFn: async () => {
      if (!actor || !searchString) return [];
      return actor.searchClients(searchString);
    },
    enabled: !!actor && !actorFetching && !!searchString,
  });
}

export function useCreateOrUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { isOnline } = useOnlineStatus();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      address,
      phone,
      email,
    }: {
      id: string;
      name: string;
      address: Address;
      phone: string;
      email: string;
    }) => {
      if (!isOnline) {
        await enqueueOfflineOperation({
          type: 'createOrUpdateClient',
          data: { id, name, address, phone, email },
          timestamp: Date.now(),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.createOrUpdateClient(id, name, address, phone, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client'] });
      toast.success('Client enregistré');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    },
  });
}
