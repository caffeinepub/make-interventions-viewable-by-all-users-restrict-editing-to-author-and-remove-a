import { useCamera } from "@/camera/useCamera";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { ExternalBlob } from "../../backend";

interface MediaPickerProps {
  media: ExternalBlob[];
  onChange: (media: ExternalBlob[]) => void;
  disabled?: boolean;
}

function CameraDialog({
  open,
  onClose,
  onCapture,
}: {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: ExternalBlob) => void;
}) {
  const {
    isActive,
    isLoading,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef,
  } = useCamera({ facingMode: "environment" });

  const handleOpen = async () => {
    if (open && !isActive) {
      await startCamera();
    }
  };

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  const handleCapture = async () => {
    const file = await capturePhoto();
    if (file) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const externalBlob = ExternalBlob.fromBytes(bytes);
      onCapture(externalBlob);
      await stopCamera();
      onClose();
    }
  };

  // Start camera when dialog opens
  if (open && !isActive && !isLoading) {
    handleOpen();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prendre une photo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative w-full" style={{ minHeight: "240px" }}>
            <video
              ref={videoRef}
              className="w-full rounded-lg bg-black"
              style={{
                minHeight: "240px",
                maxHeight: "360px",
                objectFit: "cover",
              }}
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
                <p className="text-white text-sm text-center px-4">
                  {error.message}
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuler
            </Button>
            <Button
              onClick={handleCapture}
              disabled={!isActive || isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Capturer"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MediaPicker({
  media,
  onChange,
  disabled,
}: MediaPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newBlobs: ExternalBlob[] = [];
    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      newBlobs.push(ExternalBlob.fromBytes(bytes));
    }
    onChange([...media, ...newBlobs]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(media.filter((_, i) => i !== index));
  };

  const handleCapture = (blob: ExternalBlob) => {
    onChange([...media, blob]);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnails */}
      {media.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {media.map((blob, index) => (
            <div
              key={blob.getDirectURL()}
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-border"
            >
              <img
                src={blob.getDirectURL()}
                alt={`Media ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {!disabled && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
          >
            <ImagePlus className="w-4 h-4" />
            Galerie
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCameraOpen(true)}
            className="gap-2"
          >
            <Camera className="w-4 h-4" />
            Caméra
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      <CameraDialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />
    </div>
  );
}
