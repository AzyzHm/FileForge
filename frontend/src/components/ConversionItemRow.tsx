import { Image as ImageIcon, X } from "lucide-react";
import { Button } from "./Button";
import { DownloadButton } from "./DownloadButton";
import { FileAvatar } from "./FileAvatar";
import { FormatSelect } from "./FormatSelect";
import { IconButton } from "./IconButton";
import { formatFileSize } from "../utils/formatFileSize";
import type { ConversionItem, ImageFormat } from "../types/conversion";

interface ConversionItemRowProps {
  item: ConversionItem;
  onTargetFormatChange: (id: string, format: ImageFormat) => void;
  onConvert: (item: ConversionItem) => void;
  onRemove: (id: string) => void;
}

export function ConversionItemRow({
  item,
  onTargetFormatChange,
  onConvert,
  onRemove,
}: ConversionItemRowProps) {
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
          </p>
          {item.status === "error" && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {item.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {item.sourceFormat}
        </span>
        <span aria-hidden className="text-slate-300 dark:text-slate-600">
          &rarr;
        </span>
        <FormatSelect
          label={`Convert ${item.file.name} to`}
          value={item.targetFormat}
          exclude={item.sourceFormat}
          onChange={(format) => onTargetFormatChange(item.id, format)}
          disabled={item.status === "converting"}
        />

        {item.status === "done" && item.result ? (
          <DownloadButton
            blob={item.result.blob}
            fileName={item.result.fileName}
          />
        ) : (
          <Button
            onClick={() => onConvert(item)}
            disabled={item.status === "converting"}
          >
            {item.status === "converting"
              ? "Converting…"
              : item.status === "error"
                ? "Retry"
                : "Convert"}
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
