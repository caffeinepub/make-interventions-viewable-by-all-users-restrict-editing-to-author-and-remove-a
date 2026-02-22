import { ExternalBlob } from '../../backend';
import { useState } from 'react';
import DocumentViewer from '../technical-folder/DocumentViewer';
import { FileQuestion } from 'lucide-react';

interface MediaPreviewProps {
  media: ExternalBlob[];
  clickable?: boolean;
}

export default function MediaPreview({ media, clickable = false }: MediaPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ blob: ExternalBlob; index: number } | null>(null);
  const [failedMedia, setFailedMedia] = useState<Set<number>>(new Set());

  if (media.length === 0) {
    return null;
  }

  const handleMediaClick = (item: ExternalBlob, index: number) => {
    if (clickable) {
      setSelectedMedia({ blob: item, index });
      setViewerOpen(true);
    }
  };

  const handleImageError = (index: number) => {
    setFailedMedia(prev => new Set(prev).add(index));
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {media.map((item, index) => {
          let mediaUrl: string;
          try {
            mediaUrl = item.getDirectURL();
          } catch (error) {
            console.error('Error getting media URL:', error);
            return (
              <div 
                key={index} 
                className="relative aspect-video overflow-hidden rounded-lg bg-muted flex items-center justify-center"
              >
                <div className="text-center p-4">
                  <FileQuestion className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Erreur de chargement</p>
                </div>
              </div>
            );
          }

          return (
            <div 
              key={index} 
              className={`relative aspect-video overflow-hidden rounded-lg bg-muted ${
                clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
              }`}
              onClick={() => handleMediaClick(item, index)}
            >
              {failedMedia.has(index) ? (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-center p-4">
                    <FileQuestion className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Image non disponible</p>
                  </div>
                </div>
              ) : (
                <img
                  src={mediaUrl}
                  alt={`Media ${index + 1}`}
                  className="h-full w-full object-cover"
                  onError={() => handleImageError(index)}
                />
              )}
            </div>
          );
        })}
      </div>

      {clickable && selectedMedia && (
        <DocumentViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          blob={selectedMedia.blob}
          fileName={`Media ${selectedMedia.index + 1}`}
        />
      )}
    </>
  );
}
