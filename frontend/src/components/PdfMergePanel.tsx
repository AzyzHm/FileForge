import { useState } from "react";
import { ArrowDown, ArrowUp, FileText, X } from "lucide-react";
import { Card } from "./Card";
import { DownloadButton } from "./DownloadButton";
import { Dropzone } from "./Dropzone";
import { FileListHeader } from "./FileListHeader";
import { IconButton } from "./IconButton";
import { usePdfMerge } from "../hooks/usePdfMerge";
import { formatFileSize } from "../utils/formatFileSize";

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
        <Card>
          <FileListHeader
            count={items.length}
            primaryLabel={status === "processing" ? "Merging…" : "Merge"}
            onPrimary={() => void merge()}
            primaryDisabled={!canMerge}
            onClear={reset}
          />

          <ul className="divide-y divide-slate-200 px-4 dark:divide-slate-800">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <FileText
                    aria-hidden
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-brand-600 dark:text-brand-300"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {index + 1}. {item.file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(item.file.size)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    icon={ArrowUp}
                    onClick={() => moveItem(item.id, "up")}
                    disabled={index === 0}
                    aria-label={`Move ${item.file.name} up`}
                  />
                  <IconButton
                    icon={ArrowDown}
                    onClick={() => moveItem(item.id, "down")}
                    disabled={index === items.length - 1}
                    aria-label={`Move ${item.file.name} down`}
                  />
                  <IconButton
                    icon={X}
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remove ${item.file.name}`}
                  />
                </div>
              </li>
            ))}
          </ul>

          {error && (
            <p className="border-t border-slate-200 px-4 py-3 text-xs text-red-600 dark:border-slate-800 dark:text-red-400">
              {error}
            </p>
          )}

          {status === "done" && result && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
              <DownloadButton
                blob={result.blob}
                fileName={result.fileName}
                label={`Download ${result.fileName}`}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
