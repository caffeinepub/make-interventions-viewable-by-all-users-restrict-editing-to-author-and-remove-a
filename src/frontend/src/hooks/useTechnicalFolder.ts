import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useListTechnicalFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, ExternalBlob]>>({
    queryKey: ['technicalFiles'],
    queryFn: async () => {
      if (!actor) {
        return [];
      }
      
      try {
        const files = await actor.listTechnicalFiles();
        return files;
      } catch (error) {
        console.error('Error fetching technical files:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUploadTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { path: string; blob: ExternalBlob }) => {
      if (!actor) {
        throw new Error('Acteur non disponible');
      }
      
      await actor.uploadTechnicalFileWithFolderPath(params.path, params.blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Fichier téléchargé avec succès');
    },
    onError: (error: any) => {
      console.error('Error uploading file:', error);
      const message = error.message || 'Échec du téléchargement du fichier';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Veuillez vous reconnecter');
      } else if (message.includes('non valide')) {
        toast.error('Chemin de fichier non valide');
      } else {
        toast.error(`Erreur: ${message}`);
      }
    },
  });
}

export function useDeleteTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      if (!actor) {
        throw new Error('Acteur non disponible');
      }
      
      await actor.deleteTechnicalFileWithPath(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Fichier supprimé avec succès');
    },
    onError: (error: any) => {
      console.error('Error deleting file:', error);
      const message = error.message || 'Échec de la suppression du fichier';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Veuillez vous reconnecter');
      } else if (message.includes('introuvable')) {
        toast.error('Fichier introuvable - Veuillez rafraîchir la page');
      } else {
        toast.error(`Erreur: ${message}`);
      }
    },
  });
}

export function useMoveFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { oldPath: string; newPath: string }) => {
      if (!actor) {
        throw new Error('Acteur non disponible');
      }
      
      await actor.moveTechnicalFile(params.oldPath, params.newPath);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Fichier déplacé avec succès');
    },
    onError: (error: any) => {
      console.error('Error moving file:', error);
      const message = error.message || 'Échec du déplacement du fichier';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Veuillez vous reconnecter');
      } else if (message.includes('introuvable')) {
        toast.error('Fichier introuvable - Veuillez rafraîchir la page');
      } else {
        toast.error(`Erreur: ${message}`);
      }
    },
  });
}

export function useCreateFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (path: string) => {
      if (!actor) {
        throw new Error('Acteur non disponible');
      }
      
      await actor.createFolder(path);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Dossier créé avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating folder:', error);
      const message = error.message || 'Échec de la création du dossier';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Veuillez vous reconnecter');
      } else if (message.includes('non valide')) {
        toast.error('Nom de dossier non valide');
      } else {
        toast.error(`Erreur: ${message}`);
      }
    },
  });
}

export function useRenameFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { oldPath: string; newName: string }) => {
      if (!actor) {
        throw new Error('Acteur non disponible');
      }
      
      await actor.renameFolder(params.oldPath, params.newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('Dossier renommé avec succès');
    },
    onError: (error: any) => {
      console.error('Error renaming folder:', error);
      const message = error.message || 'Échec du renommage du dossier';
      if (message.includes('Non autorisé')) {
        toast.error('Accès refusé - Veuillez vous reconnecter');
      } else if (message.includes('introuvable')) {
        toast.error('Dossier introuvable - Veuillez rafraîchir la page');
      } else {
        toast.error(`Erreur: ${message}`);
      }
    },
  });
}
