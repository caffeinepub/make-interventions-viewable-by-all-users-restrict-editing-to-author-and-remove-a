import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useListTechnicalFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, ExternalBlob]>>({
    queryKey: ['technicalFiles'],
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
    mutationFn: async (params: { path: string; blob: ExternalBlob }) => {
      if (!actor) throw new Error('Acteur non disponible');
      await actor.uploadTechnicalFileWithFolderPath(params.path, params.blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Fichier téléchargé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec du téléchargement du fichier'}`);
    },
  });
}

export function useDeleteTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      if (!actor) throw new Error('Acteur non disponible');
      await actor.deleteTechnicalFileWithPath(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Fichier supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec de la suppression du fichier'}`);
    },
  });
}

export function useMoveFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { oldPath: string; newPath: string }) => {
      if (!actor) throw new Error('Acteur non disponible');
      await actor.moveTechnicalFile(params.oldPath, params.newPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Fichier déplacé avec succès');
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || 'Échec du déplacement du fichier'}`);
    },
  });
}
