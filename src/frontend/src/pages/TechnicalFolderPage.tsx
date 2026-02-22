import { useState, useMemo } from 'react';
import { useListTechnicalFiles } from '../hooks/useTechnicalFolder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FolderPlus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import TechnicalFolderUploadCard from '../components/technical-folder/TechnicalFolderUploadCard';
import TechnicalFileRow from '../components/technical-folder/TechnicalFileRow';
import CreateFolderDialog from '../components/technical-folder/CreateFolderDialog';
import MobileLayout from '../components/layout/MobileLayout';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useQueryClient } from '@tanstack/react-query';

export default function TechnicalFolderPage() {
  const { data: files = [], isLoading, isError, error, refetch } = useListTechnicalFiles();
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const queryClient = useQueryClient();

  console.log('[TechnicalFolderPage] Rendering, files count:', files.length, 'isLoading:', isLoading, 'isError:', isError);
  console.log('[TechnicalFolderPage] Current path:', currentPath.join('/'));

  const currentPathString = currentPath.join('/');

  const { folders, currentFiles } = useMemo(() => {
    console.log('[TechnicalFolderPage] Computing folders and files for path:', currentPathString);
    
    const foldersSet = new Set<string>();
    const filesInCurrentPath: Array<[string, any]> = [];

    files.forEach(([path, blob]) => {
      const pathParts = path.split('/').filter(Boolean);
      
      if (currentPath.length === 0) {
        if (pathParts.length > 0) {
          foldersSet.add(pathParts[0]);
        }
      } else {
        const isInCurrentPath = currentPath.every(
          (part, index) => pathParts[index] === part
        );

        if (isInCurrentPath) {
          if (pathParts.length === currentPath.length + 1) {
            filesInCurrentPath.push([path, blob]);
          } else if (pathParts.length > currentPath.length + 1) {
            foldersSet.add(pathParts[currentPath.length]);
          }
        }
      }
    });

    const result = {
      folders: Array.from(foldersSet).sort(),
      currentFiles: filesInCurrentPath,
    };
    
    console.log('[TechnicalFolderPage] Computed folders:', result.folders.length, 'files:', result.currentFiles.length);
    return result;
  }, [files, currentPath, currentPathString]);

  const navigateToFolder = (folderName: string) => {
    console.log('[TechnicalFolderPage] Navigating to folder:', folderName);
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateToPath = (index: number) => {
    console.log('[TechnicalFolderPage] Navigating to path index:', index);
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const navigateToRoot = () => {
    console.log('[TechnicalFolderPage] Navigating to root');
    setCurrentPath([]);
  };

  const handleRetry = () => {
    console.log('[TechnicalFolderPage] Manual retry triggered');
    queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
    refetch();
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dossier Technique</h1>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateFolderOpen(true)}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setIsUploadOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={navigateToRoot}
                className="cursor-pointer"
              >
                Racine
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentPath.map((part, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === currentPath.length - 1 ? (
                    <BreadcrumbPage>{part}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => navigateToPath(index)}
                      className="cursor-pointer"
                    >
                      {part}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Chargement des fichiers...</p>
          </div>
        ) : isError ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Impossible de charger les fichiers
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {error instanceof Error 
                      ? error.message.includes('Non autorisé')
                        ? 'Accès refusé - Veuillez vous reconnecter'
                        : error.message
                      : 'Une erreur est survenue lors du chargement des fichiers'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Vérifiez la console du navigateur (F12) pour plus de détails
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Contenu</CardTitle>
            </CardHeader>
            <CardContent>
              {folders.length === 0 && currentFiles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Ce dossier est vide
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCreateFolderOpen(true)}
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Créer un dossier
                    </Button>
                    <Button size="sm" onClick={() => setIsUploadOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un fichier
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <div
                      key={folder}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => navigateToFolder(folder)}
                    >
                      <FolderPlus className="h-5 w-5 text-primary" />
                      <span className="font-medium">{folder}</span>
                    </div>
                  ))}
                  {currentFiles.map(([path, blob]) => (
                    <TechnicalFileRow
                      key={path}
                      path={path}
                      blob={blob}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <TechnicalFolderUploadCard
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        currentPath={currentPathString}
      />

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        currentPath={currentPathString}
      />
    </MobileLayout>
  );
}
