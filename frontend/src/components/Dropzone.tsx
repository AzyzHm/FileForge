import { useCallback, useId, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

interface DropzoneProps {
  onFiles: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
  helperText?: string;
}

export function Dropzone({
  onFiles,
  accept = "image/png,image/jpeg,image/svg+xml",
  multiple = true,
  label = "Drag images here, or",
  helperText = "Works with PNG, JPG, and SVG files",
}: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      if (event.dataTransfer.files.length > 0) {
        onFiles(event.dataTransfer.files);
      }
    },
    [onFiles],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        onFiles(event.target.files);
      }
      event.target.value = "";
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
        isDragActive
          ? "scale-[1.01] border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-950/30"
          : "border-slate-300 bg-slate-50/70 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:border-slate-600"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
          isDragActive
            ? "bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300"
            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
        }`}
      >
        <UploadCloud aria-hidden size={20} strokeWidth={2} />
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        {label}{" "}
        <label
          htmlFor={inputId}
          className="cursor-pointer font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
        >
          browse your files
        </label>
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{helperText}</p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
}
