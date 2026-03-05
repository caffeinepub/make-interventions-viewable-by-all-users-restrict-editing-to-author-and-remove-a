import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { useRef } from "react";

interface FilePickerProps {
  onSelect: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
}

export default function FilePicker({
  onSelect,
  accept = "image/*,video/*,application/pdf",
  multiple = true,
  disabled = false,
  label = "Choisir des fichiers",
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onSelect(files);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="gap-2"
      >
        <Paperclip className="w-4 h-4" />
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
    </>
  );
}
