import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCw, Download } from 'lucide-react';
import type { ExternalBlob } from '../../backend';

interface DocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blob: ExternalBlob;
  fileName: string;
}

export default function DocumentViewer({
  open,
  onOpenChange,
  blob,
  fileName,
}: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const [initialDistance, setInitialDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(100);

  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const directUrl = blob.getDirectURL();

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(fileExtension || '');
  const isPDF = fileExtension === 'pdf';
  const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(fileExtension || '');

  useEffect(() => {
    if (!open) {
      setZoom(100);
      setRotation(0);
      setIsFullscreen(false);
    }
  }, [open]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleReset = () => {
    setZoom(100);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = async () => {
    try {
      const bytes = await blob.getBytes();
      const mimeType = isPDF ? 'application/pdf' : isImage ? 'image/jpeg' : 'application/octet-stream';
      const blobObj = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blobObj);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
    }
  };

  const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      setInitialDistance(getDistance(e.touches[0], e.touches[1]));
      setInitialZoom(zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance;
      const newZoom = Math.max(25, Math.min(400, initialZoom * scale));
      setZoom(newZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
  };

  const renderContent = () => {
    if (isImage) {
      return (
        <div 
          className="flex items-center justify-center overflow-auto touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={directUrl}
            alt={fileName}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: isPinching ? 'none' : 'transform 0.2s ease-out',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            className="select-none"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="w-full h-full">
          <iframe
            src={directUrl}
            className="w-full h-full border-0"
            title={fileName}
          />
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex items-center justify-center">
          <video
            src={directUrl}
            controls
            className="max-w-full max-h-full"
            style={{
              transform: `scale(${zoom / 100})`,
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-6xl">📄</div>
        <p className="text-lg font-medium">{fileName}</p>
        <p className="text-sm text-muted-foreground">
          Ce type de fichier ne peut pas être prévisualisé dans le navigateur.
        </p>
        <Button onClick={handleDownload} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Télécharger le fichier
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${isFullscreen ? 'max-w-full h-screen' : 'max-w-4xl h-[90vh]'} p-0 flex flex-col`}
      >
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate flex-1 mr-4">{fileName}</DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              {(isImage || isVideo) && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomOut}
                    disabled={zoom <= 25}
                    title="Zoom arrière"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[3rem] text-center">
                    {Math.round(zoom)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleZoomIn}
                    disabled={zoom >= 400}
                    title="Zoom avant"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              )}
              {isImage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRotate}
                  title="Rotation"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                title="Réinitialiser"
                className="text-xs"
              >
                Reset
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFullscreen}
                title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                title="Télécharger"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/20">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
