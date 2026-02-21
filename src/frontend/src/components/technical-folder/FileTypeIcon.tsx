import { FileText, FileImage, FileVideo, File, FileSpreadsheet } from 'lucide-react';

interface FileTypeIconProps {
  fileName: string;
  className?: string;
}

export default function FileTypeIcon({ fileName, className = "h-5 w-5" }: FileTypeIconProps) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension || '')) {
    return <FileImage className={className} />;
  }

  if (extension === 'pdf') {
    return <FileText className={className} />;
  }

  if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension || '')) {
    return <FileVideo className={className} />;
  }

  if (['doc', 'docx'].includes(extension || '')) {
    return <FileText className={className} />;
  }

  if (['xls', 'xlsx', 'csv'].includes(extension || '')) {
    return <FileSpreadsheet className={className} />;
  }

  return <File className={className} />;
}
