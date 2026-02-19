import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import MobileLayout from '../components/layout/MobileLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderPlus, Upload } from 'lucide-react';
import { useListTechnicalFiles } from '../hooks/useTechnicalFolder';
import TechnicalFileRow from '../components/technical-folder/TechnicalFileRow';
import TechnicalFolderUploadCard from '../components/technical-folder/TechnicalFolderUploadCard';
import CreateFolderDialog from '../components/technical-folder/CreateFolderDialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function TechnicalFolderPage() {
  const navigate = useNavigate();
  const { data: files = [], isLoading } = useListTechnicalFiles();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);

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
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={() => setIsUploadDialogOpen(true)}
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
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
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
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleFolderClick(folderName)}
                  >
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        📁 {folderName}
                      </CardTitle>
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
    </MobileLayout>
  );
}
