import { useState } from "react";
import { Card } from "./Card";
import { CompressionItemRow } from "./CompressionItemRow";
import { Dropzone } from "./Dropzone";
import { FileListHeader } from "./FileListHeader";
import { useImageCompression } from "../hooks/useImageCompression";

export function CompressionPanel() {
  const {
    items,
    addFiles,
    setLevel,
    compressItem,
    compressAll,
    removeItem,
    reset,
  } = useImageCompression();
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
        accept="image/png,image/jpeg"
        label="Drag images here to compress, or"
        helperText="Works with PNG and JPG files"
      />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a PNG or JPG."
            : `${skippedCount} files were skipped because they are not PNG or JPG.`}
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
              <CompressionItemRow
                key={item.id}
                item={item}
                onLevelChange={setLevel}
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
