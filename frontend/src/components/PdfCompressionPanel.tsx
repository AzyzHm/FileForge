import { useState } from "react";
import { Dropzone } from "./Dropzone";
import { PdfCompressionItemRow } from "./PdfCompressionItemRow";
import { usePdfCompression } from "../hooks/usePdfCompression";

export function PdfCompressionPanel() {
  const {
    items,
    addFiles,
    setQuality,
    compressItem,
    compressAll,
    removeItem,
    reset,
  } = usePdfCompression();
  const [skippedCount, setSkippedCount] = useState(0);

  const handleFiles = (files: FileList) => {
    const added = addFiles(files);
    setSkippedCount(files.length - added);
  };

  const hasItems = items.length > 0;
  const hasCompressibleItems = items.some(
    (item) => item.status === "idle" || item.status === "error",
  );

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        onFiles={handleFiles}
        accept=".pdf,application/pdf"
        label="Drag PDF files here, or"
        helperText="Uploaded to the FileForge server, since heavy PDF compression needs more than the browser can do alone."
      />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a PDF."
            : `${skippedCount} files were skipped because they are not PDFs.`}
        </p>
      )}

      {hasItems && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {items.length} {items.length === 1 ? "file" : "files"}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void compressAll()}
                disabled={!hasCompressibleItems}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-40 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Compress all
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
            {items.map((item) => (
              <PdfCompressionItemRow
                key={item.id}
                item={item}
                onQualityChange={setQuality}
                onCompress={(item) => void compressItem(item)}
                onRemove={removeItem}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
