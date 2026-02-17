import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, Video, Trash2, Download } from 'lucide-react';
import { ExternalBlob } from '../../backend';

interface TechnicalFileRowProps {
  fileId: string;
  blob: ExternalBlob;
  onDelete: (fileId: string) => void;
  isDeleting: boolean;
}

export default function TechnicalFileRow({ fileId, blob, onDelete, isDeleting }: TechnicalFileRowProps) {
  const directUrl = blob.getDirectURL();
  
  // Extract filename and determine type from fileId
  const fileName = fileId.split('-').slice(1).join('-').replace(/_/g, ' ');
  const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const isPDF = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
  const isVideo = ['mp4', 'webm', 'mov', 'avi'].includes(fileExtension);

  const getIcon = () => {
    if (isPDF) return <FileText className="h-5 w-5 text-red-500" />;
    if (isImage) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (isVideo) return <Video className="h-5 w-5 text-purple-500" />;
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const timestamp = fileId.split('-')[0];
  const uploadDate = new Date(parseInt(timestamp));
  const formattedDate = uploadDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">{fileName}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
            
            {/* Preview section */}
            <div className="mt-3">
              {isImage && (
                <a href={directUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={directUrl}
                    alt={fileName}
                    className="max-w-full h-auto max-h-48 rounded-lg border border-border object-contain"
                  />
                </a>
              )}
              {isVideo && (
                <video
                  src={directUrl}
                  controls
                  className="max-w-full h-auto max-h-48 rounded-lg border border-border"
                />
              )}
              {isPDF && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={directUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="mr-2 h-4 w-4" />
                      Open PDF
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={directUrl} download={fileName}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(fileId)}
            disabled={isDeleting}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
