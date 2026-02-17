import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetTechnicalFiles, useDeleteTechnicalFile } from '../hooks/useTechnicalFolder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import AuthenticatedOnly from '../components/guards/AuthenticatedOnly';
import TechnicalFolderUploadCard from '../components/technical-folder/TechnicalFolderUploadCard';
import TechnicalFileRow from '../components/technical-folder/TechnicalFileRow';

function TechnicalFolderPageContent() {
  const navigate = useNavigate();
  const { data: files, isLoading } = useGetTechnicalFiles();
  const deleteMutation = useDeleteTechnicalFile();
  const [showUpload, setShowUpload] = useState(false);

  const handleDelete = (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/clients' })}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Technical Folder</h1>
            <p className="text-sm text-muted-foreground">Store and manage your files</p>
          </div>
        </div>

        <Button onClick={() => setShowUpload(true)} className="w-full">
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="py-3 px-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : files && files.length > 0 ? (
        <div className="space-y-2">
          {files.map(([fileId, blob]) => (
            <TechnicalFileRow
              key={fileId}
              fileId={fileId}
              blob={blob}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload PDFs, photos, and videos to get started
            </p>
            <Button onClick={() => setShowUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </CardContent>
        </Card>
      )}

      <TechnicalFolderUploadCard open={showUpload} onOpenChange={setShowUpload} />
    </div>
  );
}

export default function TechnicalFolderPage() {
  return (
    <AuthenticatedOnly>
      <TechnicalFolderPageContent />
    </AuthenticatedOnly>
  );
}
