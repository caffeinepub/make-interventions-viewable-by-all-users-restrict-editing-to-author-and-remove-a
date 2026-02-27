import { useState, useMemo } from 'react';
import { useListTechnicalFiles } from '../hooks/useTechnicalFolder';
import { ExternalBlob } from '../backend';
import { Button } from '@/components/ui/button';
import { FolderOpen, ChevronRight, Home, AlertTriangle, RefreshCw } from 'lucide-react';
import TechnicalFileRow from '../components/technical-folder/TechnicalFileRow';
import TechnicalFolderUploadCard from '../components/technical-folder/TechnicalFolderUploadCard';
import CreateFolderDialog from '../components/technical-folder/CreateFolderDialog';
import RenameFolderDialog from '../components/technical-folder/RenameFolderDialog';

interface FolderNode {
  name: string;
  path: string;
  files: { name: string; path: string; blob: ExternalBlob }[];
  subfolders: Map<string, FolderNode>;
}

function buildFolderTree(files: [string, ExternalBlob][]): Map<string, FolderNode> {
  const root = new Map<string, FolderNode>();

  for (const [path, blob] of files) {
    const parts = path.split('/');
    if (parts.length < 2) continue;

    const topFolder = parts[0];
    if (!root.has(topFolder)) {
      root.set(topFolder, { name: topFolder, path: topFolder, files: [], subfolders: new Map() });
    }

    let current = root.get(topFolder)!;
    for (let i = 1; i < parts.length - 1; i++) {
      const folderName = parts[i];
      if (!current.subfolders.has(folderName)) {
        const folderPath = parts.slice(0, i + 1).join('/');
        current.subfolders.set(folderName, {
          name: folderName,
          path: folderPath,
          files: [],
          subfolders: new Map(),
        });
      }
      current = current.subfolders.get(folderName)!;
    }

    const fileName = parts[parts.length - 1];
    current.files.push({ name: fileName, path, blob });
  }

  return root;
}

export default function TechnicalFolderPage() {
  const { data: files, isLoading, error, refetch } = useListTechnicalFiles();
  const [currentPath, setCurrentPath] = useState<string[]>([]);

  const folderTree = useMemo(() => {
    if (!files) return new Map<string, FolderNode>();
    return buildFolderTree(files);
  }, [files]);

  const getCurrentFolder = (): FolderNode | null => {
    if (currentPath.length === 0) return null;
    let node = folderTree.get(currentPath[0]);
    if (!node) return null;
    for (let i = 1; i < currentPath.length; i++) {
      node = node.subfolders.get(currentPath[i]);
      if (!node) return null;
    }
    return node;
  };

  const currentFolder = getCurrentFolder();
  const currentFolderPath = currentPath.join('/');

  const navigateTo = (path: string[]) => setCurrentPath(path);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Erreur de chargement</h2>
          <p className="text-muted-foreground text-sm mt-1">{(error as Error).message}</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Dossier Technique</h1>
          </div>
          <div className="flex items-center gap-2">
            <CreateFolderDialog currentPath={currentFolderPath} />
            <TechnicalFolderUploadCard currentPath={currentFolderPath} />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm overflow-x-auto">
          <button
            onClick={() => navigateTo([])}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Racine</span>
          </button>
          {currentPath.map((segment, index) => (
            <div key={index} className="flex items-center gap-1 shrink-0">
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              <button
                onClick={() => navigateTo(currentPath.slice(0, index + 1))}
                className={`hover:text-foreground transition-colors ${
                  index === currentPath.length - 1
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {segment}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : currentPath.length === 0 ? (
          // Root level - show top-level folders
          <div className="flex flex-col gap-1">
            {folderTree.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <FolderOpen className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">
                  Aucun dossier. Créez un dossier pour commencer.
                </p>
              </div>
            ) : (
              Array.from(folderTree.entries()).map(([name]) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <button
                    onClick={() => navigateTo([name])}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <FolderOpen className="w-5 h-5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{name}</span>
                  </button>
                  <RenameFolderDialog folderPath={name} currentName={name} />
                </div>
              ))
            )}
          </div>
        ) : currentFolder ? (
          <div className="flex flex-col gap-1">
            {/* Subfolders */}
            {Array.from(currentFolder.subfolders.entries()).map(([name, subfolder]) => (
              <div
                key={name}
                className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <button
                  onClick={() => navigateTo([...currentPath, name])}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <FolderOpen className="w-5 h-5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{name}</span>
                </button>
                <RenameFolderDialog folderPath={subfolder.path} currentName={name} />
              </div>
            ))}

            {/* Files */}
            {currentFolder.files.map((file) => (
              <TechnicalFileRow
                key={file.path}
                fileName={file.name}
                filePath={file.path}
                currentFolderPath={currentFolderPath}
                blob={file.blob}
              />
            ))}

            {currentFolder.subfolders.size === 0 && currentFolder.files.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <FolderOpen className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground text-center">Dossier vide</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground">Dossier introuvable</p>
            <Button variant="outline" size="sm" onClick={() => navigateTo([])}>
              Retour à la racine
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
