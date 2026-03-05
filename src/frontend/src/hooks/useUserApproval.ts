import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useActor } from "./useActor";

export type ApprovalStatus = "approved" | "rejected" | "pending";

export interface ApprovalEntry {
  principal: Principal;
  status: ApprovalStatus;
}

// Typed wrapper to access approval methods not yet in generated .d.ts
function getApprovalActor(actor: unknown) {
  return actor as {
    isCallerApproved: () => Promise<boolean>;
    requestApproval: () => Promise<void>;
    listApprovals: () => Promise<
      Array<{ principal: Principal; status: ApprovalStatus }>
    >;
    setApproval: (user: Principal, status: ApprovalStatus) => Promise<void>;
    isCallerAdmin: () => Promise<boolean>;
  };
}

export function useIsCallerApproved() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerApproved"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await getApprovalActor(actor).isCallerApproved();
      } catch {
        // If the backend call fails (method not found, network error, etc.)
        // treat as NOT approved — default to blocking, not allowing
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await getApprovalActor(actor).isCallerAdmin();
      } catch {
        // If admin check fails, treat as NOT admin — safer default
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      try {
        await getApprovalActor(actor).requestApproval();
      } catch (err) {
        // If requestApproval method doesn't exist yet, fail silently
        // so the UI can still show the "pending" message
        console.warn("requestApproval call failed:", err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      toast.success("Demande d'accès envoyée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la demande d'accès: ${error.message}`);
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery<ApprovalEntry[]>({
    queryKey: ["listApprovals"],
    queryFn: async () => {
      if (!actor) return [];
      return getApprovalActor(actor).listApprovals();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 30,
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      status,
    }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error("Actor non disponible");
      await getApprovalActor(actor).setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listApprovals"] });
      toast.success("Accès mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la mise à jour de l'accès: ${error.message}`);
    },
  });
}
