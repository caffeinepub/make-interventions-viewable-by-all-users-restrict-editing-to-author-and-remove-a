import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useTechnicalFolder() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, ExternalBlob][]>({
    queryKey: ['technical-folder'],
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
    mutationFn: async (data: { path: string; blob: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.uploadTechnicalFileWithFolderPath(data.path, data.blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-folder'] });
      toast.success('Fichier téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors du téléchargement : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useDeleteTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteTechnicalFileWithPath(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-folder'] });
      toast.success('Fichier supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la suppression : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useMoveTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { oldPath: string; newPath: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.moveTechnicalFile(data.oldPath, data.newPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-folder'] });
      toast.success('Fichier déplacé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors du déplacement : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useCreateFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createFolder(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-folder'] });
      toast.success('Dossier créé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors de la création du dossier : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}

export function useRenameFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { oldPath: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.renameFolder(data.oldPath, data.newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technical-folder'] });
      toast.success('Dossier renommé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur lors du renommage : ${error?.message ?? 'Erreur inconnue'}`);
    },
  });
}
