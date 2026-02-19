import { Button } from '@/components/ui/button';
import { Camera, Image } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCamera } from '../../camera/useCamera';

interface MediaPickerProps {
  onCapture: (files: File[]) => void;
}

export default function MediaPicker({ onCapture }: MediaPickerProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const {
    isActive,
    isSupported,
    error,
    isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: 'environment' });

  const handleCameraOpen = async () => {
    setIsCameraOpen(true);
    await startCamera();
  };

  const handleCameraClose = async () => {
    await stopCamera();
    setIsCameraOpen(false);
  };

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      onCapture([file]);
      handleCameraClose();
    }
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onCapture(files);
      }
    };
    input.click();
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleCameraOpen}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Appareil photo
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleGallerySelect}
          className="flex-1"
        >
          <Image className="h-4 w-4 mr-2" />
          Galerie
        </Button>
      </div>

      <Dialog open={isCameraOpen} onOpenChange={handleCameraClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prendre une photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isSupported === false && (
              <div className="text-center text-destructive">
                Appareil photo non pris en charge
              </div>
            )}
            {error && (
              <div className="text-center text-destructive">
                Erreur: {error.message}
              </div>
            )}
            <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg"
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleCapture}
                disabled={!isActive || isLoading}
                size="lg"
              >
                {isLoading ? 'Chargement...' : 'Capturer'}
              </Button>
              <Button
                onClick={handleCameraClose}
                variant="outline"
                size="lg"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
