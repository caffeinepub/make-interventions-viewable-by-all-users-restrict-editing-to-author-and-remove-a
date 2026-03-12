import { useEffect, useState } from "react";
import type { ExternalBlob } from "../../backend";
import DocumentViewer from "../technical-folder/DocumentViewer";

interface MediaPreviewProps {
  media: ExternalBlob[];
  clickable?: boolean;
}

// Detect media type from URL patterns (data URLs and known patterns)
function guessTypeFromUrl(url: string): "video" | "image" | null {
  if (url.startsWith("data:video/")) return "video";
  if (url.startsWith("data:image/")) return "image";
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) return "image";
  return null;
}

// Detect MIME type via HEAD request for blob-storage HTTP URLs
async function detectMimeFromUrl(
  url: string,
): Promise<"video" | "image" | "unknown"> {
  const quick = guessTypeFromUrl(url);
  if (quick) return quick;
  // Only attempt HEAD for http/https URLs
  if (!url.startsWith("http")) return "image";
  try {
    const res = await fetch(url, { method: "HEAD" });
    const ct = res.headers.get("content-type") ?? "";
    if (ct.startsWith("video/")) return "video";
    if (ct.startsWith("image/")) return "image";
    return "image"; // default to image
  } catch {
    return "image";
  }
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
  const [mediaType, setMediaType] = useState<"image" | "video" | "loading">(
    "loading",
  );
  const url = blob.getDirectURL();

  useEffect(() => {
    detectMimeFromUrl(url).then((type) =>
      setMediaType(type === "unknown" ? "image" : type),
    );
  }, [url]);

  const handleClick = () => {
    if (clickable) onClick(index);
  };

  if (mediaType === "loading") {
    return (
      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mediaType === "video") {
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
          <span className="text-white text-2xl">&#9654;</span>
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
        onError={() => setMediaType("video")}
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
  // Track detected MIME types per index
  const [detectedTypes, setDetectedTypes] = useState<
    Record<number, "image" | "video">
  >({});

  if (!media || media.length === 0) return null;

  const handleClick = async (index: number) => {
    if (!clickable) return;
    // Detect media type before opening viewer
    if (!detectedTypes[index]) {
      const url = media[index].getDirectURL();
      const type = await detectMimeFromUrl(url);
      setDetectedTypes((prev) => ({
        ...prev,
        [index]: type === "unknown" ? "image" : type,
      }));
    }
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const _selectedUrl = media[selectedIndex]?.getDirectURL() ?? "";
  const detectedType = detectedTypes[selectedIndex];
  // Use detected type for viewer filename extension
  const fileNameForViewer =
    detectedType === "video"
      ? `media-${selectedIndex + 1}.mp4`
      : `media-${selectedIndex + 1}.jpg`;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {media.map((blob, index) => (
          <MediaItemThumb
            key={`${blob.getDirectURL()}-${index}`}
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
          forceMimeType={detectedType === "video" ? "video/mp4" : "image/jpeg"}
        />
      )}
    </>
  );
}
