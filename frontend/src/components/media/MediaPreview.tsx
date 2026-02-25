import React, { useState, useEffect } from 'react';
import { ExternalBlob } from '../../backend';
import { ImageIcon } from 'lucide-react';
import DocumentViewer from '../technical-folder/DocumentViewer';

interface MediaPreviewProps {
  media: ExternalBlob[];
  clickable?: boolean;
}

function MediaThumb({ blob, onClick }: { blob: ExternalBlob; onClick?: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const directUrl = blob.getDirectURL();
    if (directUrl) {
      setUrl(directUrl);
    } else {
      blob.getBytes().then(bytes => {
        const b = new Blob([bytes], { type: 'image/jpeg' });
        setUrl(URL.createObjectURL(b));
      }).catch(() => setError(true));
    }
    return () => {
      if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, []);

  if (error) {
    return (
      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
    );
  }

  if (!url) {
    return <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-16 h-16 rounded-lg overflow-hidden bg-muted ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
    >
      <img src={url} alt="Média" className="w-full h-full object-cover" />
    </button>
  );
}

export default function MediaPreview({ media, clickable = false }: MediaPreviewProps) {
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  if (!media || media.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {media.map((blob, index) => (
          <MediaThumb
            key={index}
            blob={blob}
            onClick={clickable ? () => setViewingIndex(index) : undefined}
          />
        ))}
      </div>

      {viewingIndex !== null && (
        <DocumentViewer
          open={viewingIndex !== null}
          onOpenChange={(open) => !open && setViewingIndex(null)}
          blob={media[viewingIndex]}
          fileName={`media-${viewingIndex + 1}`}
        />
      )}
    </>
  );
}
