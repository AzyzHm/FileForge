import { useState } from "react";
import { Card } from "../../components/Card";
import { Dropzone } from "../../components/Dropzone";
import { FileListHeader } from "../../components/FileListHeader";
import { PdfCompressionItemRow } from "./PdfCompressionItemRow";
import { usePdfCompression } from "./usePdfCompression";

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
        <Card>
          <FileListHeader
            count={items.length}
            primaryLabel="Compress all"
            onPrimary={() => void compressAll()}
            primaryDisabled={!hasCompressibleItems}
            onClear={reset}
          />
          <ul className="divide-y divide-slate-200 px-4 dark:divide-slate-800">
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
        </Card>
      )}
    </div>
  );
}
