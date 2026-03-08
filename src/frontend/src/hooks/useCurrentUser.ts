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
      return actor.getCallerUserProfile();
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
      const results = await actor.getUserProfilesByPrincipals(principals);
      const map = new Map<string, string>();
      for (const [principal, profile] of results) {
        map.set(principal.toString(), profile.name);
      }
      return map;
    },
    enabled: !!actor && !actorFetching && principals.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Profil enregistré avec succès");
    },
    onError: (error: Error) => {
      toast.error(
        `Erreur lors de l'enregistrement du profil: ${error.message}`,
      );
    },
  });
}
