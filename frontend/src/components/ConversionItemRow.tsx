import { useEffect, useMemo } from "react";
import { FormatSelect } from "./FormatSelect";
import type { ConversionItem, ImageFormat } from "../types/conversion";

interface ConversionItemRowProps {
  item: ConversionItem;
  onTargetFormatChange: (id: string, format: ImageFormat) => void;
  onConvert: (item: ConversionItem) => void;
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ConversionItemRow({
  item,
  onTargetFormatChange,
  onConvert,
  onRemove,
}: ConversionItemRowProps) {
  const downloadUrl = useMemo(
    () => (item.result ? URL.createObjectURL(item.result.blob) : null),
    [item.result],
  );

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  return (
    <li className="flex flex-col gap-3 border-b border-slate-200 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div className="min-w-0 flex-1">
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

        {item.status === "done" && downloadUrl ? (
          <a
            href={downloadUrl}
            download={item.result?.fileName}
            className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Download
          </a>
        ) : (
          <button
            type="button"
            onClick={() => onConvert(item)}
            disabled={item.status === "converting"}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {item.status === "converting"
              ? "Converting…"
              : item.status === "error"
                ? "Retry"
                : "Convert"}
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.file.name}`}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          &times;
        </button>
      </div>
    </li>
  );
}
