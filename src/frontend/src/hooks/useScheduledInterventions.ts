import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  ExternalBlob,
  ScheduledIntervention,
  UserProfile,
} from "../backend";
import { useActor } from "./useActor";

export function useGetScheduledInterventionsByWeek(
  weekNumber: number,
  weekYear: number,
) {
  const { actor, isFetching } = useActor();

  return useQuery<ScheduledIntervention[]>({
    queryKey: ["scheduledInterventions", weekNumber, weekYear],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getScheduledInterventionsByWeek(
        BigInt(weekNumber),
        BigInt(weekYear),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetScheduledInterventionById(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ScheduledIntervention | null>({
    queryKey: ["scheduledIntervention", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getScheduledInterventionById(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetApprovedEmployees() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ["approvedEmployees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getApprovedEmployees();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateScheduledIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      clientId: string;
      clientName: string;
      assignedEmployee: Principal;
      reason: string;
      startTime: string;
      endTime: string;
      description: string;
      media: ExternalBlob[];
      day: number;
      month: number;
      year: number;
      weekNumber: number;
      weekYear: number;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.createScheduledIntervention(
        params.clientId,
        params.clientName,
        params.assignedEmployee,
        params.reason,
        params.startTime,
        params.endTime,
        params.description,
        params.media,
        BigInt(params.day),
        BigInt(params.month),
        BigInt(params.year),
        BigInt(params.weekNumber),
        BigInt(params.weekYear),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "scheduledInterventions",
          variables.weekNumber,
          variables.weekYear,
        ],
      });
      toast.success("Intervention planifiée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateScheduledIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      clientId: string;
      clientName: string;
      assignedEmployee: Principal;
      reason: string;
      startTime: string;
      endTime: string;
      description: string;
      media: ExternalBlob[];
      employeeSignature: string | null;
      clientSignature: string | null;
      day: number;
      month: number;
      year: number;
      weekNumber: number;
      weekYear: number;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.updateScheduledIntervention(
        params.id,
        params.clientId,
        params.clientName,
        params.assignedEmployee,
        params.reason,
        params.startTime,
        params.endTime,
        params.description,
        params.media,
        params.employeeSignature,
        params.clientSignature,
        BigInt(params.day),
        BigInt(params.month),
        BigInt(params.year),
        BigInt(params.weekNumber),
        BigInt(params.weekYear),
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "scheduledInterventions",
          variables.weekNumber,
          variables.weekYear,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["scheduledIntervention", variables.id],
      });
      toast.success("Intervention mise à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteScheduledIntervention() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
    }: { id: string; weekNumber: number; weekYear: number }) => {
      if (!actor) throw new Error("Actor non disponible");
      return actor.deleteScheduledIntervention(id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "scheduledInterventions",
          variables.weekNumber,
          variables.weekYear,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["scheduledIntervention", variables.id],
      });
      toast.success("Intervention supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
