import { Image as ImageIcon, X } from "lucide-react";
import { Button } from "./Button";
import { CompressionLevelSelect } from "./CompressionLevelSelect";
import { DownloadButton } from "./DownloadButton";
import { FileAvatar } from "./FileAvatar";
import { IconButton } from "./IconButton";
import { formatFileSize } from "../utils/formatFileSize";
import type { CompressionItem, CompressionLevel } from "../types/compression";

interface CompressionItemRowProps {
  item: CompressionItem;
  onLevelChange: (id: string, level: CompressionLevel) => void;
  onCompress: (item: CompressionItem) => void;
  onRemove: (id: string) => void;
}

function formatReduction(originalSize: number, compressedSize: number): string {
  if (originalSize <= 0) return "";
  const reduction = Math.round((1 - compressedSize / originalSize) * 100);
  return reduction > 0 ? `${reduction}% smaller` : "No size reduction";
}

export function CompressionItemRow({
  item,
  onLevelChange,
  onCompress,
  onRemove,
}: CompressionItemRowProps) {
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileAvatar icon={ImageIcon} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {item.file.name}
          </p>
          <p className="text-xs text-slate-400">
            {formatFileSize(item.file.size)}
            {item.status === "done" && item.result && (
              <>
                {" "}
                &rarr; {formatFileSize(item.result.compressedSize)} (
                {formatReduction(
                  item.result.originalSize,
                  item.result.compressedSize,
                )}
                )
              </>
            )}
          </p>
          {item.status === "error" && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {item.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <CompressionLevelSelect
          label={`Compression level for ${item.file.name}`}
          value={item.level}
          onChange={(level) => onLevelChange(item.id, level)}
          disabled={item.status === "processing"}
        />

        {item.status === "done" && item.result ? (
          <DownloadButton
            blob={item.result.file}
            fileName={item.result.fileName}
          />
        ) : (
          <Button
            onClick={() => onCompress(item)}
            disabled={item.status === "processing"}
          >
            {item.status === "processing"
              ? "Compressing…"
              : item.status === "error"
                ? "Retry"
                : "Compress"}
          </Button>
        )}

        <IconButton
          icon={X}
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.file.name}`}
        />
      </div>
    </li>
  );
}
