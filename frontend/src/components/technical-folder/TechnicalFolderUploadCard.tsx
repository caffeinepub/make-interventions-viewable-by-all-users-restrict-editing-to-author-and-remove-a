import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { useUploadTechnicalFile } from '../../hooks/useTechnicalFolder';
import { ExternalBlob } from '../../backend';
import { useCamera } from '@/camera/useCamera';

interface TechnicalFolderUploadCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPath: string;
}

function CameraCapture({
  onCapture,
  onCancel,
}: {
  onCapture: (file: File) => void;
  onCancel: () => void;
}) {
  const { isActive, isLoading, error, startCamera, stopCamera, capturePhoto, videoRef, canvasRef } =
    useCamera({ facingMode: 'environment' });

  React.useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      stopCamera();
      onCapture(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ minHeight: '240px' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ minHeight: '240px', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-sm text-center px-4">{error.message}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Annuler
        </Button>
        <Button onClick={handleCapture} disabled={!isActive || isLoading} className="flex-1">
          <Camera className="mr-2 h-4 w-4" />
          Capturer
        </Button>
      </div>
    </div>
  );
}

export default function TechnicalFolderUploadCard({
  open,
  onOpenChange,
  currentPath,
}: TechnicalFolderUploadCardProps) {
  const uploadFile = useUploadTechnicalFile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const handleCameraCapture = (file: File) => {
    setSelectedFile(file);
    setFileName(`photo-${Date.now()}.jpg`);
    setShowCamera(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileName.trim()) return;

    const path = currentPath ? `${currentPath}/${fileName.trim()}` : fileName.trim();

    const bytes = new Uint8Array(await selectedFile.arrayBuffer());
    const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => setProgress(pct));

    await uploadFile.mutateAsync({ path, blob });
    setSelectedFile(null);
    setFileName('');
    setProgress(0);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileName('');
    setProgress(0);
    setShowCamera(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Télécharger un fichier</DialogTitle>
        </DialogHeader>

        {showCamera ? (
          <CameraCapture onCapture={handleCameraCapture} onCancel={() => setShowCamera(false)} />
        ) : (
          <form onSubmit={handleUpload} className="flex flex-col gap-3">
            {currentPath && (
              <p className="text-xs text-muted-foreground">
                Dossier : <span className="font-mono">{currentPath}</span>
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>Fichier</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera className="h-3.5 w-3.5" />
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="upload-filename">Nom du fichier</Label>
              <Input
                id="upload-filename"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="nom-du-fichier.pdf"
                required
              />
            </div>

            {uploadFile.isPending && progress > 0 && (
              <div className="flex flex-col gap-1">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{progress}%</p>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || !fileName.trim() || uploadFile.isPending}
              >
                {uploadFile.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  'Télécharger'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
