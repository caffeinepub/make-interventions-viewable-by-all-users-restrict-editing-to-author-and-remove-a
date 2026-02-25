import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FilePickerProps {
  onSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}

export default function FilePicker({
  onSelect,
  accept = '*/*',
  multiple = false,
}: FilePickerProps) {
  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        onSelect(files);
      }
    };
    input.click();
  };

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      <Upload className="h-4 w-4 mr-2" />
      Sélectionner un fichier
    </Button>
  );
}
