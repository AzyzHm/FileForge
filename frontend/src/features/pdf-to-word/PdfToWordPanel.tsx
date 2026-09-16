import { useState } from "react";
import { Card } from "../../components/Card";
import { Dropzone } from "../../components/Dropzone";
import { FileListHeader } from "../../components/FileListHeader";
import { PdfToWordItemRow } from "./PdfToWordItemRow";
import { usePdfToWord } from "./usePdfToWord";

export function PdfToWordPanel() {
  const { items, addFiles, convertItem, convertAll, removeItem, reset } =
    usePdfToWord();
  const [skippedCount, setSkippedCount] = useState(0);

  const handleFiles = (files: FileList) => {
    const added = addFiles(files);
    setSkippedCount(files.length - added);
  };

  const hasItems = items.length > 0;
  const hasConvertibleItems = items.some(
    (item) => item.status === "idle" || item.status === "error",
  );

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        onFiles={handleFiles}
        accept=".pdf,application/pdf"
        label="Drag PDF files here, or"
        helperText="Uploaded to the FileForge server for conversion, since this needs more than the browser can do alone."
      />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a PDF."
            : `${skippedCount} files were skipped because they are not PDFs.`}
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-600">
        PDFs with Arabic, Hebrew, or other right-to-left text may convert into a
        messy or unstable Word document, a known limitation of the underlying
        conversion engine.
      </p>

      {hasItems && (
        <Card>
          <FileListHeader
            count={items.length}
            primaryLabel="Convert all"
            onPrimary={() => void convertAll()}
            primaryDisabled={!hasConvertibleItems}
            onClear={reset}
          />
          <ul className="divide-y divide-slate-200 px-4 dark:divide-slate-800">
            {items.map((item) => (
              <PdfToWordItemRow
                key={item.id}
                item={item}
                onConvert={(item) => void convertItem(item)}
                onRemove={removeItem}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
