import React, { useRef, useState } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ExternalBlob } from '../../backend';
import { useCamera } from '@/camera/useCamera';

interface MediaPickerProps {
  media: ExternalBlob[];
  onAdd: (blob: ExternalBlob) => void;
  onRemove: (index: number) => void;
}

function CameraDialog({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (blob: ExternalBlob) => void;
}) {
  const { isActive, isLoading, error, startCamera, stopCamera, capturePhoto, videoRef, canvasRef } =
    useCamera({ facingMode: 'environment' });

  React.useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      onCapture(blob);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prendre une photo</DialogTitle>
        </DialogHeader>
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
          <Button onClick={handleCapture} disabled={!isActive || isLoading} className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Capturer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MediaPicker({ media, onAdd, onRemove }: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      onAdd(blob);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((_, index) => (
            <div key={index} className="relative">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-4 h-4 flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-3.5 w-3.5" />
          Galerie
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowCamera(true)}
        >
          <Camera className="mr-2 h-3.5 w-3.5" />
          Caméra
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,application/pdf"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      <CameraDialog open={showCamera} onOpenChange={setShowCamera} onCapture={onAdd} />
    </div>
  );
}
