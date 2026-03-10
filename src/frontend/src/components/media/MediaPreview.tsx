import { useEffect, useState } from "react";
import type { ExternalBlob } from "../../backend";
import DocumentViewer from "../technical-folder/DocumentViewer";

interface MediaPreviewProps {
  media: ExternalBlob[];
  clickable?: boolean;
}

function isVideoUrl(url: string): boolean {
  return (
    url.startsWith("data:video/") ||
    url.includes("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(url)
  );
}

function MediaItemThumb({
  blob,
  index,
  clickable,
  onClick,
}: {
  blob: ExternalBlob;
  index: number;
  clickable: boolean;
  onClick: (index: number) => void;
}) {
  const [isVideo, setIsVideo] = useState(false);
  const url = blob.getDirectURL();

  useEffect(() => {
    if (isVideoUrl(url)) {
      setIsVideo(true);
    }
  }, [url]);

  const handleClick = () => {
    if (clickable) onClick(index);
  };

  if (isVideo) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center ${
          clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
        }`}
      >
        <video
          src={url}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-white text-2xl">▶</span>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted ${
        clickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
      }`}
    >
      <img
        src={url}
        alt={`Media ${index + 1}`}
        className="w-full h-full object-cover"
        onError={() => setIsVideo(true)}
      />
    </button>
  );
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

  const selectedUrl = media[selectedIndex]
    ? media[selectedIndex].getDirectURL()
    : "";
  const fileNameForViewer = isVideoUrl(selectedUrl)
    ? `media-${selectedIndex + 1}.mp4`
    : `media-${selectedIndex + 1}.jpg`;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {media.map((blob, index) => (
          <MediaItemThumb
            key={blob.getDirectURL()}
            blob={blob}
            index={index}
            clickable={clickable}
            onClick={handleClick}
          />
        ))}
      </div>

      {clickable && viewerOpen && media[selectedIndex] && (
        <DocumentViewer
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          fileName={fileNameForViewer}
          blob={media[selectedIndex]}
        />
      )}
    </>
  );
}
