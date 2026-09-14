import { useState } from "react";
import { BackgroundRemovalItemRow } from "./BackgroundRemovalItemRow";
import { Card } from "./Card";
import { Dropzone } from "./Dropzone";
import { FileListHeader } from "./FileListHeader";
import { useBackgroundRemoval } from "../hooks/useBackgroundRemoval";

export function BackgroundRemovalPanel() {
  const { items, addFiles, processItem, processAll, removeItem, reset } =
    useBackgroundRemoval();
  const [skippedCount, setSkippedCount] = useState(0);

  const handleFiles = (files: FileList) => {
    const added = addFiles(files);
    setSkippedCount(files.length - added);
  };

  const hasItems = items.length > 0;
  const hasProcessableItems = items.some(
    (item) => item.status === "idle" || item.status === "error",
  );

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        onFiles={handleFiles}
        accept="image/png,image/jpeg,image/webp"
        label="Drag photos here to remove the background, or"
        helperText="Works with PNG, JPG, and WEBP. The first run downloads an AI model, so it takes a bit longer."
      />

      {skippedCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          {skippedCount === 1
            ? "1 file was skipped because it is not a PNG, JPG, or WEBP."
            : `${skippedCount} files were skipped because they are not PNG, JPG, or WEBP.`}
        </p>
      )}

      {hasItems && (
        <Card>
          <FileListHeader
            count={items.length}
            primaryLabel="Remove all backgrounds"
            onPrimary={() => void processAll()}
            primaryDisabled={!hasProcessableItems}
            onClear={reset}
          />
          <ul className="divide-y divide-slate-200 px-4 dark:divide-slate-800">
            {items.map((item) => (
              <BackgroundRemovalItemRow
                key={item.id}
                item={item}
                onProcess={(item) => void processItem(item)}
                onRemove={removeItem}
              />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
