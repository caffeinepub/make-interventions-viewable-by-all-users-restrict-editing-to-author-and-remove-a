import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ExternalBlob, Intervention } from "../backend";
import { useActor } from "./useActor";

export function useGetClientInterventions(clientId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Intervention[]>({
    queryKey: ["interventions", clientId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getClientInterventions(clientId);
    },
    enabled: !!actor && !isFetching && !!clientId,
  });
}

export function useGetInterventionsByDate(
  day: number,
  month: number,
  year: number,
) {
  const { actor, isFetching } = useActor();

  return useQuery<Intervention[]>({
    queryKey: ["interventions", "date", day, month, year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getInterventionsByDate(
        BigInt(day),
        BigInt(month),
        BigInt(year),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      comments,
      media,
      day,
      month,
      year,
    }: {
      clientId: string;
      comments: string;
      media: ExternalBlob[];
      day: number;
      month: number;
      year: number;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.addIntervention(
        clientId,
        comments,
        media,
        BigInt(day),
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["interventions", variables.clientId],
      });
      queryClient.invalidateQueries({ queryKey: ["interventions", "date"] });
      toast.success("Intervention ajoutée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de l'ajout de l'intervention: ${error.message}`);
    },
  });
}

export function useUpdateIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interventionId,
      clientId,
      comments,
      media,
      day,
      month,
      year,
    }: {
      interventionId: string;
      clientId: string;
      comments: string;
      media: ExternalBlob[];
      day: number;
      month: number;
      year: number;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.updateIntervention(
        interventionId,
        clientId,
        comments,
        media,
        BigInt(day),
        BigInt(month),
        BigInt(year),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["interventions", variables.clientId],
      });
      queryClient.invalidateQueries({ queryKey: ["interventions", "date"] });
      toast.success("Intervention mise à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(
        `Erreur lors de la mise à jour de l'intervention: ${error.message}`,
      );
    },
  });
}

export function useDeleteIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      interventionId,
      clientId,
    }: {
      interventionId: string;
      clientId: string;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.deleteIntervention(interventionId, clientId);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["interventions", variables.clientId],
      });
      queryClient.invalidateQueries({ queryKey: ["interventions", "date"] });
      toast.success("Intervention supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error(
        `Erreur lors de la suppression de l'intervention: ${error.message}`,
      );
    },
  });
}
