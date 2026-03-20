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
    isCallerAdmin: () => Promise<boolean>;
    requestApproval: () => Promise<void>;
    listApprovals: () => Promise<
      Array<{ principal: Principal; status: ApprovalStatus }>
    >;
    setApproval: (user: Principal, status: ApprovalStatus) => Promise<void>;
    syncAdminRole: () => Promise<boolean>;
    hasAdminRegistered: () => Promise<boolean>;
    claimAdminIfNoneExists: () => Promise<void>;
    getCallerUserRole: () => Promise<"admin" | "user" | "guest">;
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
    retry: 1,
    retryDelay: 2000,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      const a = getApprovalActor(actor);
      // Simple: try syncAdminRole first, then isCallerAdmin
      // React Query handles retries via the retry option below
      try {
        const result = await a.syncAdminRole();
        return result;
      } catch {
        // syncAdminRole failed — fall back to isCallerAdmin
      }
      return await a.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    // CRITICAL: do NOT refetch on window focus — this causes the admin tab to flicker/disappear
    refetchOnWindowFocus: false,
    retry: 5,
    retryDelay: (attempt) => Math.min(3000 * (attempt + 1), 15000),
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
      try {
        return await getApprovalActor(actor).listApprovals();
      } catch {
        return [];
      }
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
      queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
      queryClient.invalidateQueries({ queryKey: ["hasAdminRegistered"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la revendication admin: ${error.message}`);
    },
  });
}

export function useRecoverAdminAccess() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      if (!actor) throw new Error("Actor non disponible");
      const aa = getApprovalActor(actor);
      try {
        const result = await aa.syncAdminRole();
        if (result) return true;
      } catch {
        // ignore
      }
      try {
        const result = await aa.isCallerAdmin();
        if (result) return true;
      } catch {
        // ignore
      }
      try {
        const role = await aa.getCallerUserRole();
        if (role === "admin") return true;
      } catch {
        // ignore
      }
      return false;
    },
    onSuccess: (isAdmin) => {
      if (isAdmin) {
        queryClient.invalidateQueries({ queryKey: ["isCallerAdmin"] });
        queryClient.invalidateQueries({ queryKey: ["isCallerApproved"] });
        queryClient.invalidateQueries({ queryKey: ["hasAdminRegistered"] });
        toast.success("Accès administrateur récupéré !");
      } else {
        toast.error(
          "Récupération impossible: ce compte n'est pas enregistré comme administrateur.",
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}
