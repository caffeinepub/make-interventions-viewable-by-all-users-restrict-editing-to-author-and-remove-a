import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address, Client } from "../backend";
import { useActor } from "./useActor";

export function useGetClients() {
  const { actor, isFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClientsWithIds() {
  const { actor, isFetching } = useActor();
  return useQuery<Array<{ id: string } & Client>>({
    queryKey: ["clientsWithIds"],
    queryFn: async () => {
      if (!actor) return [];
      // Cast to any because backend.ts may lag behind backend.d.ts declarations
      const pairs = (await (actor as any).getClientsWithIds()) as Array<
        [string, Client]
      >;
      return pairs.map(([id, client]) => ({ id, ...client }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetClient(clientId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Client>({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.getClient(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

export function useSearchClients(searchString: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Client[]>({
    queryKey: ["clients", "search", searchString],
    queryFn: async () => {
      if (!actor) return [];
      if (!searchString.trim()) return actor.getClients();
      return actor.searchClients(searchString);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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
      if (!actor) throw new Error("Actor non disponible");
      await actor.createOrUpdateClient(id, name, address, phone, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clientsWithIds"] });
      toast.success("Client créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création du client: ${error.message}`);
    },
  });
}

export function useUpdateClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

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
      if (!actor) throw new Error("Actor non disponible");
      await actor.createOrUpdateClient(id, name, address, phone, email);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clientsWithIds"] });
      queryClient.invalidateQueries({ queryKey: ["client", variables.id] });
      toast.success("Client mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour du client: ${error.message}`);
    },
  });
}
