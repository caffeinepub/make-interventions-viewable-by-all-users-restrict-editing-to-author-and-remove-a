import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import MobileLayout from '../components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderPlus, Upload, Edit2, Loader2, RefreshCw } from 'lucide-react';
import { useListTechnicalFiles } from '../hooks/useTechnicalFolder';
import TechnicalFileRow from '../components/technical-folder/TechnicalFileRow';
import TechnicalFolderUploadCard from '../components/technical-folder/TechnicalFolderUploadCard';
import CreateFolderDialog from '../components/technical-folder/CreateFolderDialog';
import RenameFolderDialog from '../components/technical-folder/RenameFolderDialog';
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
  const navigate = useNavigate();
  const { data: files = [], isLoading, isError, error } = useListTechnicalFiles();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [renameFolderPath, setRenameFolderPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const currentPathString = currentPath.join('/');

  const filteredFiles = files.filter(([path]) => {
    if (currentPath.length === 0) {
      return !path.includes('/') || path.split('/').length === 2;
    }
    const pathPrefix = currentPathString + '/';
    return path.startsWith(pathPrefix) && path.slice(pathPrefix.length).split('/').length === 1;
  });

  const folders = new Set<string>();
  const filesList: Array<[string, any]> = [];

  filteredFiles.forEach(([path, blob]) => {
    const relativePath = currentPath.length === 0 ? path : path.slice(currentPathString.length + 1);
    const parts = relativePath.split('/');

    if (parts.length > 1) {
      folders.add(parts[0]);
    } else {
      filesList.push([path, blob]);
    }
  });

  const handleFolderClick = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setCurrentPath(currentPath.slice(0, index));
  };

  const handleRenameFolder = (folderName: string) => {
    const folderPath = currentPath.length === 0 
      ? folderName 
      : `${currentPathString}/${folderName}`;
    setRenameFolderPath(folderPath);
  };

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['technicalFiles'] });
  };

  return (
    <MobileLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/clients' })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Dossier Technique</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCreateFolderDialogOpen(true)}
            disabled={isLoading}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsUploadDialogOpen(true)}
            disabled={isLoading}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => setCurrentPath([])}
                className="cursor-pointer"
              >
                Racine
              </BreadcrumbLink>
            </BreadcrumbItem>
            {currentPath.map((folder, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === currentPath.length - 1 ? (
                    <BreadcrumbPage>{folder}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      onClick={() => handleBreadcrumbClick(index + 1)}
                      className="cursor-pointer"
                    >
                      {folder}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardHeader>
            <CardTitle>Contenu</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Chargement des fichiers...</p>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-4 text-center py-8">
                <div className="p-3 rounded-full bg-destructive/10">
                  <RefreshCw className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Impossible de charger les fichiers
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error instanceof Error 
                      ? error.message.includes('Non autorisé')
                        ? 'Accès refusé - Veuillez vous reconnecter'
                        : 'Erreur de connexion - Vérifiez votre connexion Internet'
                      : 'Une erreur est survenue lors du chargement des données'}
                  </p>
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                </div>
              </div>
            ) : folders.size === 0 && filesList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun fichier ou dossier
              </div>
            ) : (
              <div className="space-y-2">
                {Array.from(folders).map((folderName) => (
                  <Card
                    key={folderName}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex items-center gap-2 flex-1 cursor-pointer"
                          onClick={() => handleFolderClick(folderName)}
                        >
                          <span className="text-2xl">📁</span>
                          <CardTitle className="text-sm">{folderName}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameFolder(folderName);
                          }}
                          title="Renommer le dossier"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
                {filesList.map(([path, blob]) => (
                  <TechnicalFileRow key={path} path={path} blob={blob} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TechnicalFolderUploadCard
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        currentPath={currentPathString}
      />

      <CreateFolderDialog
        open={isCreateFolderDialogOpen}
        onOpenChange={setIsCreateFolderDialogOpen}
        currentPath={currentPathString}
      />

      {renameFolderPath && (
        <RenameFolderDialog
          open={!!renameFolderPath}
          onOpenChange={(open) => !open && setRenameFolderPath(null)}
          folderPath={renameFolderPath}
        />
      )}
    </MobileLayout>
  );
}
