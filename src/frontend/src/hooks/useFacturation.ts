import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BillingPart, BillingRecord } from "../backend";
import { useActor } from "./useActor";

export function useGetBillingRecords() {
  const { actor, isFetching } = useActor();
  return useQuery<BillingRecord[]>({
    queryKey: ["billingRecords"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBillingRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateBillingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      interventionId: string;
      clientId: string;
      clientName: string;
      employeeName: string;
      reason: string;
      day: number;
      month: number;
      year: number;
      parts: BillingPart[];
      comment: string;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.createBillingRecord(
        params.interventionId,
        params.clientId,
        params.clientName,
        params.employeeName,
        params.reason,
        BigInt(params.day),
        BigInt(params.month),
        BigInt(params.year),
        params.parts,
        params.comment,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingRecords"] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur facturation: ${error.message}`);
    },
  });
}

export function useUpdateBillingRecordStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.updateBillingRecordStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingRecords"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteBillingRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.deleteBillingRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billingRecords"] });
      toast.success("Enregistrement supprimé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
