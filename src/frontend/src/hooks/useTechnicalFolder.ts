import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

export function useGetTechnicalFiles() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Array<[string, ExternalBlob]>>({
    queryKey: ['technicalFiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listTechnicalFiles();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUploadTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, blob }: { fileId: string; blob: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.uploadTechnicalFile(fileId, blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('File uploaded successfully');
    },
    onError: (error: any) => {
      if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error uploading file');
      }
    },
  });
}

export function useDeleteTechnicalFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteTechnicalFile(fileId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
      toast.success('File deleted successfully');
    },
    onError: (error: any) => {
      if (error.message?.includes('Unauthorized')) {
        toast.error('Access denied: You must be logged in');
      } else {
        toast.error(error.message || 'Error deleting file');
      }
    },
  });
}
