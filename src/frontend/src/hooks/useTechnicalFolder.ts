import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export function useListTechnicalFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, ExternalBlob][]>({
    queryKey: ["technicalFiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTechnicalFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUploadTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      path,
      blob,
    }: {
      path: string;
      blob: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.uploadTechnicalFileWithFolderPath(path, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicalFiles"] });
      toast.success("Fichier téléchargé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du téléchargement: ${error.message}`);
    },
  });
}

export function useDeleteTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path }: { path: string }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.deleteTechnicalFileWithPath(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicalFiles"] });
      toast.success("Fichier supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la suppression: ${error.message}`);
    },
  });
}

export function useMoveTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      oldPath,
      newPath,
    }: {
      oldPath: string;
      newPath: string;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.moveTechnicalFile(oldPath, newPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicalFiles"] });
      toast.success("Fichier déplacé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du déplacement: ${error.message}`);
    },
  });
}

export function useCreateFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path }: { path: string }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.createFolder(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicalFiles"] });
      toast.success("Dossier créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors de la création du dossier: ${error.message}`);
    },
  });
}

export function useRenameFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      oldPath,
      newName,
    }: {
      oldPath: string;
      newName: string;
    }) => {
      if (!actor) throw new Error("Actor non disponible");
      await actor.renameFolder(oldPath, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicalFiles"] });
      toast.success("Dossier renommé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur lors du renommage: ${error.message}`);
    },
  });
}
