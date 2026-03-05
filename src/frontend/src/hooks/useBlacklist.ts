import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export function useMarkAsBlacklisted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      comments,
      media,
    }: {
      clientId: string;
      comments: string;
      media: ExternalBlob[];
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.markAsBlacklisted(clientId, comments, media);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({
        queryKey: ["client", variables.clientId],
      });
      toast.success("Client ajouté à la liste noire");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUnmarkAsBlacklisted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId }: { clientId: string }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.unmarkAsBlacklisted(clientId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({
        queryKey: ["client", variables.clientId],
      });
      toast.success("Client retiré de la liste noire");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
