import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { Client, Address } from '../backend';
import { toast } from 'sonner';

export function useClients() {
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

export function useClientById(clientId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getClient(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

export function useCreateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      address: Address;
      phone: string;
      email: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createOrUpdateClient(data.id, data.name, data.address, data.phone, data.email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client créé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création du client : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      address: Address;
      phone: string;
      email: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createOrUpdateClient(data.id, data.name, data.address, data.phone, data.email);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
      toast.success('Client mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la mise à jour du client : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}
