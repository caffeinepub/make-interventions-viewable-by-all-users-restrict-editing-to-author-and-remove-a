import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Image, Video } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCamera } from '../../camera/useCamera';

interface MediaPickerProps {
  onMediaSelected: (files: File[]) => void;
}

export default function MediaPicker({ onMediaSelected }: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const { isActive, isSupported, error, startCamera, stopCamera, capturePhoto, videoRef, canvasRef } = useCamera({
    facingMode: 'environment',
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onMediaSelected(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenCamera = async () => {
    setShowCamera(true);
    await startCamera();
  };

  const handleCloseCamera = async () => {
    await stopCamera();
    setShowCamera(false);
  };

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      onMediaSelected([photo]);
      handleCloseCamera();
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {isSupported && (
          <Button type="button" variant="outline" onClick={handleOpenCamera} className="flex-1">
            <Camera className="mr-2 h-4 w-4" />
            Photo
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          <Image className="mr-2 h-4 w-4" />
          Galerie
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <Dialog open={showCamera} onOpenChange={handleCloseCamera}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prendre une photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            {error && <p className="text-sm text-destructive">{error.message}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseCamera} className="flex-1">
                Annuler
              </Button>
              <Button onClick={handleCapture} disabled={!isActive} className="flex-1">
                <Camera className="mr-2 h-4 w-4" />
                Capturer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
