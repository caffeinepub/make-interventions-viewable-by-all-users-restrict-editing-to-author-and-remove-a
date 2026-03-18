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
    syncAdminRole: () => Promise<boolean>;
    hasAdminRegistered: () => Promise<boolean>;
    claimAdminIfNoneExists: () => Promise<void>;
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
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      // Try up to 3 times with delay, in case canister is just starting
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await getApprovalActor(actor).syncAdminRole();
          return result;
        } catch (_err) {
          if (attempt < 2) {
            // Wait before retrying (1s, then 2s)
            await new Promise((r) => setTimeout(r, (attempt + 1) * 1000));
          }
        }
      }
      return false;
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
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
      } catch (_err) {
        console.warn("requestApproval call failed:", _err);
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

export function useHasAdminRegistered() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["hasAdminRegistered"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      // Do NOT catch here — let errors propagate so isError works
      return await getApprovalActor(actor).hasAdminRegistered();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: 2,
    retryDelay: 2000,
  });
}

export function useClaimAdminIfNoneExists() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      await getApprovalActor(actor).claimAdminIfNoneExists();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["hasAdminRegistered"] });
      toast.success("Accès administrateur activé");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Tries to recover admin access by calling syncAdminRole.
// Only works if caller's principal matches the stored adminPrincipal in stable storage.
export function useRecoverAdminAccess() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      // Retry up to 5 times with delay in case canister is starting
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          const isAdmin = await getApprovalActor(actor).syncAdminRole();
          if (isAdmin) {
            return true;
          }
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        } catch {
          if (attempt < 4) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        }
      }
      return false;
    },
    onSuccess: (isAdmin) => {
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
        queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
        toast.success("Accès administrateur restauré");
      } else {
        toast.error(
          "Votre compte n'est pas reconnu comme administrateur. Vérifiez que vous utilisez le bon compte Internet Identity.",
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la récupération: ${error.message}`);
    },
  });
}
