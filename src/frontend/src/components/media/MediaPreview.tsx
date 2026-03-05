import { useState } from "react";
import type { ExternalBlob } from "../../backend";
import DocumentViewer from "../technical-folder/DocumentViewer";

interface MediaPreviewProps {
  media: ExternalBlob[];
  clickable?: boolean;
}

export default function MediaPreview({
  media,
  clickable = false,
}: MediaPreviewProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const handleClick = (index: number) => {
    if (!clickable) return;
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {media.map((blob, index) => (
          <button
            type="button"
            key={blob.getDirectURL()}
            className={`relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted ${
              clickable
                ? "cursor-pointer hover:opacity-80 transition-opacity"
                : "cursor-default"
            }`}
            onClick={() => handleClick(index)}
          >
            <img
              src={blob.getDirectURL()}
              alt={`Media ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div class="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">Fichier</div>';
                }
              }}
            />
          </button>
        ))}
      </div>

      {clickable && viewerOpen && media[selectedIndex] && (
        <DocumentViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          fileName={`media-${selectedIndex + 1}`}
          blob={media[selectedIndex]}
        />
      )}
    </>
  );
}
