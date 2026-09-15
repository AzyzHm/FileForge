import { useState } from "react";
import { Card } from "../../components/Card";
import { Dropzone } from "../../components/Dropzone";
import { FileListHeader } from "../../components/FileListHeader";
import { WordToPdfItemRow } from "./WordToPdfItemRow";
import { useWordToPdf } from "./useWordToPdf";

export function WordToPdfPanel() {
  const { items, addFiles, convertItem, convertAll, removeItem, reset } =
    useWordToPdf();
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
        accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        label="Drag Word documents here, or"
        helperText="Uploaded to the FileForge server for a faithful, LibreOffice-rendered PDF."
      />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a .docx file."
            : `${skippedCount} files were skipped because they are not .docx files.`}
        </p>
      )}

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
              <WordToPdfItemRow
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
