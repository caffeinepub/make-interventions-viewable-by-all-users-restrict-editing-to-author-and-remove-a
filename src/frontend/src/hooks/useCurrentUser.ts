import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { UserProfile } from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor non disponible");
      try {
        return await actor.getCallerUserProfile();
      } catch {
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useUserProfilesByPrincipals(principals: Principal[]) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Map<string, string>>({
    queryKey: ["userProfiles", principals.map((p) => p.toString()).join(",")],
    queryFn: async () => {
      if (!actor) return new Map();
      try {
        const results = await actor.getUserProfilesByPrincipals(principals);
        const map = new Map<string, string>();
        for (const [principal, profile] of results) {
          map.set(principal.toString(), profile.name);
        }
        return map;
      } catch {
        return new Map();
      }
    },
    enabled: !!actor && !actorFetching && principals.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

function isCanisterStoppedError(err: unknown): boolean {
  const str = JSON.stringify(err) + String((err as Error)?.message ?? "");
  return (
    str.includes("IC0508") ||
    str.includes("stopped") ||
    str.includes('reject_code":"5') ||
    str.includes("reject_code: 5") ||
    str.includes('"reject_code":5')
  );
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor non disponible");
      let lastError: unknown;
      for (let i = 0; i < 5; i++) {
        try {
          await actor.saveCallerUserProfile(profile);
          return;
        } catch (err: unknown) {
          lastError = err;
          if (isCanisterStoppedError(err)) {
            // Canister is starting up, wait and retry with exponential backoff
            await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
    onError: (error: Error) => {
      toast.error(
        `Erreur lors de l'enregistrement du profil: ${error.message}`,
      );
    },
  });
}
