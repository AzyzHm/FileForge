import { useCallback, useId, useRef, useState } from "react";

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
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
        isDragActive
          ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/30"
          : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40"
      }`}
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {label}{" "}
        <label
          htmlFor={inputId}
          className="cursor-pointer font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
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
