import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";

export interface WorkHours {
  id: string;
  employee: Principal;
  date: { day: bigint; month: bigint; year: bigint };
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  updatedAt: bigint;
}

function getWorkHoursActor(actor: unknown) {
  return actor as {
    saveWorkHours: (
      day: bigint,
      month: bigint,
      year: bigint,
      morningStart: string,
      morningEnd: string,
      afternoonStart: string,
      afternoonEnd: string,
    ) => Promise<void>;
    getWorkHoursForMonth: (
      employee: Principal,
      month: bigint,
      year: bigint,
    ) => Promise<WorkHours[]>;
    getAllEmployeesWorkHoursForMonth: (
      month: bigint,
      year: bigint,
    ) => Promise<WorkHours[]>;
  };
}

export function useGetWorkHoursForMonth(
  employee: Principal | null,
  month: number,
  year: number,
) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkHours[]>({
    queryKey: ["workHours", employee?.toString(), month, year],
    queryFn: async () => {
      if (!actor || !employee) return [];
      return getWorkHoursActor(actor).getWorkHoursForMonth(
        employee,
        BigInt(month),
        BigInt(year),
      );
    },
    enabled: !!actor && !isFetching && !!employee,
  });
}

export function useGetAllEmployeesWorkHoursForMonth(
  month: number,
  year: number,
) {
  const { actor, isFetching } = useActor();

  return useQuery<WorkHours[]>({
    queryKey: ["allWorkHours", month, year],
    queryFn: async () => {
      if (!actor) return [];
      return getWorkHoursActor(actor).getAllEmployeesWorkHoursForMonth(
        BigInt(month),
        BigInt(year),
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveWorkHours() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      day: number;
      month: number;
      year: number;
      morningStart: string;
      morningEnd: string;
      afternoonStart: string;
      afternoonEnd: string;
      employeePrincipal?: string;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      return getWorkHoursActor(actor).saveWorkHours(
        BigInt(params.day),
        BigInt(params.month),
        BigInt(params.year),
        params.morningStart,
        params.morningEnd,
        params.afternoonStart,
        params.afternoonEnd,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "workHours",
          variables.employeePrincipal,
          variables.month,
          variables.year,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["allWorkHours", variables.month, variables.year],
      });
      toast.success("Heures enregistr\u00e9es", { duration: 2000 });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
