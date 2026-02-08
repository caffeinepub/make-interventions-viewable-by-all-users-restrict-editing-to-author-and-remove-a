import { ExternalBlob } from '../../backend';

interface MediaPreviewProps {
  media: ExternalBlob[];
}

export default function MediaPreview({ media }: MediaPreviewProps) {
  if (media.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2">
      {media.map((item, index) => (
        <div key={index} className="relative aspect-video overflow-hidden rounded-lg bg-muted">
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
  );
}
