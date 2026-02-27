import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUploadTechnicalFile } from '../../hooks/useTechnicalFolder';
import { ExternalBlob } from '../../backend';
import { useCamera } from '@/camera/useCamera';
import { Upload, Camera, Loader2, X } from 'lucide-react';

interface TechnicalFolderUploadCardProps {
  currentPath: string;
}

export default function TechnicalFolderUploadCard({ currentPath }: TechnicalFolderUploadCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [cameraMode, setCameraMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: uploadFile, isPending } = useUploadTechnicalFile();

  const {
    isActive,
    isLoading: cameraLoading,
    error: cameraError,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment' });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleCameraCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      setSelectedFile(file);
      setFileName(`photo-${Date.now()}.jpg`);
      await stopCamera();
      setCameraMode(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !fileName.trim()) return;

    const targetPath = currentPath
      ? `${currentPath}/${fileName.trim()}`
      : `documents/${fileName.trim()}`;

    const bytes = new Uint8Array(await selectedFile.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
      setUploadProgress(pct);
    });

    uploadFile(
      { path: targetPath, blob },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setUploadProgress(0);
    setCameraMode(false);
  };

  const handleOpenCamera = async () => {
    setCameraMode(true);
    await startCamera();
  };

  const handleCloseCamera = async () => {
    await stopCamera();
    setCameraMode(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Upload className="w-4 h-4" />
          Uploader
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Télécharger un fichier</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {currentPath && (
            <p className="text-sm text-muted-foreground">
              Dossier cible: <span className="font-medium text-foreground">{currentPath}</span>
            </p>
          )}

          {!cameraMode ? (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                >
                  <Upload className="w-4 h-4" />
                  Choisir un fichier
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenCamera}
                  disabled={isPending}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Caméra
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={isPending}
                />
              </div>

              {selectedFile && (
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <span className="text-sm text-foreground flex-1 truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedFile(null); setFileName(''); }}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label htmlFor="file-name">Nom du fichier</Label>
                <Input
                  id="file-name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="nom-du-fichier.pdf"
                  disabled={isPending}
                />
              </div>

              {isPending && uploadProgress > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Téléchargement...</span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="relative w-full" style={{ minHeight: '240px' }}>
                <video
                  ref={videoRef}
                  className="w-full rounded-lg bg-black"
                  style={{ minHeight: '240px', maxHeight: '360px', objectFit: 'cover' }}
                  playsInline
                  muted
                  autoPlay
                />
                <canvas ref={canvasRef} className="hidden" />
                {cameraLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                    <p className="text-white text-sm text-center px-4">{cameraError.message}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCloseCamera} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={handleCameraCapture}
                  disabled={!isActive || cameraLoading}
                  className="flex-1"
                >
                  {cameraLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Capturer'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isPending || !selectedFile || !fileName.trim() || cameraMode}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Téléchargement...
              </>
            ) : (
              'Télécharger'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
