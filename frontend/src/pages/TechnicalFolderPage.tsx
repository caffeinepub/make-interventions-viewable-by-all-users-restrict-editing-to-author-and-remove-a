import React, { useState, useMemo } from 'react';
import { FolderOpen, FolderPlus, Upload, ChevronRight, Home, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTechnicalFolder } from '../hooks/useTechnicalFolder';
import TechnicalFileRow from '../components/technical-folder/TechnicalFileRow';
import TechnicalFolderUploadCard from '../components/technical-folder/TechnicalFolderUploadCard';
import CreateFolderDialog from '../components/technical-folder/CreateFolderDialog';
import RenameFolderDialog from '../components/technical-folder/RenameFolderDialog';
import { ExternalBlob } from '../backend';

interface FolderNode {
  name: string;
  path: string;
  files: { name: string; path: string; blob: ExternalBlob }[];
  subfolders: FolderNode[];
}

function buildFolderTree(files: [string, ExternalBlob][]): FolderNode {
  const root: FolderNode = { name: '', path: '', files: [], subfolders: [] };

  for (const [path, blob] of files) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      let folder = current.subfolders.find(f => f.name === folderName);
      if (!folder) {
        const folderPath = parts.slice(0, i + 1).join('/');
        folder = { name: folderName, path: folderPath, files: [], subfolders: [] };
        current.subfolders.push(folder);
      }
      current = folder;
    }

    const fileName = parts[parts.length - 1];
    current.files.push({ name: fileName, path, blob });
  }

  return root;
}

function getFolderAtPath(root: FolderNode, pathParts: string[]): FolderNode | null {
  if (pathParts.length === 0) return root;
  let current = root;
  for (const part of pathParts) {
    const found = current.subfolders.find(f => f.name === part);
    if (!found) return null;
    current = found;
  }
  return current;
}

export default function TechnicalFolderPage() {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<{ path: string; name: string } | null>(null);

  const { data: files, isLoading, isError, refetch } = useTechnicalFolder();

  const tree = useMemo(() => {
    if (!files) return null;
    return buildFolderTree(files);
  }, [files]);

  const currentFolder = useMemo(() => {
    if (!tree) return null;
    return getFolderAtPath(tree, currentPath);
  }, [tree, currentPath]);

  const currentFolderPath = currentPath.join('/');

  const navigateTo = (parts: string[]) => setCurrentPath(parts);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Dossier Technique</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setShowCreateFolder(true)}>
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button size="icon" onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm">
        <button
          onClick={() => navigateTo([])}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Racine</span>
        </button>
        {currentPath.map((part, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => navigateTo(currentPath.slice(0, idx + 1))}
              className={`hover:text-foreground transition-colors ${idx === currentPath.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              {part}
            </button>
          </React.Fragment>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">Erreur lors du chargement des fichiers</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      )}

      {!isLoading && !isError && currentFolder && (
        <div className="flex flex-col gap-2">
          {/* Subfolders */}
          {currentFolder.subfolders.map(folder => (
            <div
              key={folder.name}
              className="flex items-center justify-between bg-card border border-border rounded-xl p-3"
            >
              <button
                onClick={() => navigateTo([...currentPath, folder.name])}
                className="flex items-center gap-2 flex-1 text-left hover:text-primary transition-colors"
              >
                <FolderOpen className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{folder.name}</span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setRenamingFolder({ path: folder.path, name: folder.name })}
              >
                Renommer
              </Button>
            </div>
          ))}

          {/* Files */}
          {currentFolder.files.map(file => (
            <TechnicalFileRow
              key={file.path}
              fileName={file.name}
              filePath={file.path}
              blob={file.blob}
              currentFolderPath={currentFolderPath}
            />
          ))}

          {currentFolder.subfolders.length === 0 && currentFolder.files.length === 0 && (
            <div className="text-center py-8">
              <FolderOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Dossier vide</p>
            </div>
          )}
        </div>
      )}

      <TechnicalFolderUploadCard
        open={showUpload}
        onOpenChange={setShowUpload}
        currentPath={currentFolderPath}
      />

      <CreateFolderDialog
        open={showCreateFolder}
        onOpenChange={setShowCreateFolder}
        currentPath={currentFolderPath}
      />

      {renamingFolder && (
        <RenameFolderDialog
          open={!!renamingFolder}
          onOpenChange={(open) => !open && setRenamingFolder(null)}
          folderPath={renamingFolder.path}
          currentName={renamingFolder.name}
        />
      )}
    </div>
  );
}
