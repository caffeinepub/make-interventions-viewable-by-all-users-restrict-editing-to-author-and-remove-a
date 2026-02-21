import { ExternalBlob } from '../../backend';
import { useState } from 'react';
import DocumentViewer from '../technical-folder/DocumentViewer';

interface MediaPreviewProps {
  media: ExternalBlob[];
  clickable?: boolean;
}

export default function MediaPreview({ media, clickable = false }: MediaPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ blob: ExternalBlob; index: number } | null>(null);

  if (media.length === 0) return null;

  const handleMediaClick = (item: ExternalBlob, index: number) => {
    if (clickable) {
      setSelectedMedia({ blob: item, index });
      setViewerOpen(true);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {media.map((item, index) => (
          <div 
            key={index} 
            className={`relative aspect-video overflow-hidden rounded-lg bg-muted ${
              clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
            }`}
            onClick={() => handleMediaClick(item, index)}
          >
            <img
              src={item.getDirectURL()}
              alt={`Media ${index + 1}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        ))}
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
