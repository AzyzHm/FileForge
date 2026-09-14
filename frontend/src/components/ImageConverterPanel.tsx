import { useState } from "react";
import { Card } from "./Card";
import { ConversionItemRow } from "./ConversionItemRow";
import { Dropzone } from "./Dropzone";
import { FileListHeader } from "./FileListHeader";
import { useImageConverter } from "../hooks/useImageConverter";

export function ImageConverterPanel() {
  const {
    items,
    addFiles,
    setTargetFormat,
    convertItem,
    convertAll,
    removeItem,
    reset,
  } = useImageConverter();
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
      <Dropzone onFiles={handleFiles} />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a PNG, JPG, or SVG."
            : `${skippedCount} files were skipped because they are not PNG, JPG, or SVG.`}
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
              <ConversionItemRow
                key={item.id}
                item={item}
                onTargetFormatChange={setTargetFormat}
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
