import { useEffect, useMemo, useState } from "react";
import { Dropzone } from "./Dropzone";
import { usePdfMerge } from "../hooks/usePdfMerge";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfMergePanel() {
  const {
    items,
    status,
    error,
    result,
    addFiles,
    removeItem,
    moveItem,
    merge,
    reset,
  } = usePdfMerge();
  const [skippedCount, setSkippedCount] = useState(0);

  const handleFiles = (files: FileList) => {
    const added = addFiles(files);
    setSkippedCount(files.length - added);
  };

  const downloadUrl = useMemo(
    () => (result ? URL.createObjectURL(result.blob) : null),
    [result],
  );

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const canMerge = items.length >= 2 && status !== "processing";

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept="application/pdf"
        label="Drag PDFs here, or"
        helperText="Works with two or more PDF files"
        onFiles={handleFiles}
      />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a PDF."
            : `${skippedCount} files were skipped because they are not PDFs.`}
        </p>
      )}

      {items.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {items.length} {items.length === 1 ? "file" : "files"}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void merge()}
                disabled={!canMerge}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-40 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                {status === "processing" ? "Merging…" : "Merge"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            </div>
          </div>

          <ul className="px-4">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {index + 1}. {item.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, "up")}
                    disabled={index === 0}
                    aria-label={`Move ${item.file.name} up`}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30 dark:hover:text-slate-200"
                  >
                    &uarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(item.id, "down")}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${item.file.name} down`}
                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30 dark:hover:text-slate-200"
                  >
                    &darr;
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {error && (
            <p className="border-t border-slate-200 px-4 py-3 text-xs text-red-600 dark:border-slate-800 dark:text-red-400">
              {error}
            </p>
          )}

          {status === "done" && downloadUrl && result && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <a
                href={downloadUrl}
                download={result.fileName}
                className="inline-block rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
              >
                Download {result.fileName}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
