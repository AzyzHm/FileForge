import { useState } from "react";
import {
  buildDocumentTitle,
  openPrintPreview,
} from "../services/wordToPdfService";
import type { WordToPdfItem } from "../types/wordToPdf";

interface WordToPdfItemRowProps {
  item: WordToPdfItem;
  onConvert: (item: WordToPdfItem) => void;
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WordToPdfItemRow({
  item,
  onConvert,
  onRemove,
}: WordToPdfItemRowProps) {
  const [popupBlocked, setPopupBlocked] = useState(false);

  const handlePreviewAndPrint = () => {
    if (!item.result) return;
    const title = buildDocumentTitle(item.file.name);
    const opened = openPrintPreview(item.result.html, title);
    setPopupBlocked(!opened);
  };

  return (
    <li className="flex flex-col gap-3 border-b border-slate-200 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
          {item.file.name}
        </p>
        <p className="text-xs text-slate-400">
          {formatFileSize(item.file.size)}
        </p>
        {item.status === "done" &&
          item.result &&
          item.result.warnings.length > 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Converted with {item.result.warnings.length}{" "}
              {item.result.warnings.length === 1 ? "note" : "notes"} (some
              formatting may not carry over exactly).
            </p>
          )}
        {item.status === "error" && (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {item.error}
          </p>
        )}
        {popupBlocked && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            Your browser blocked the preview window. Allow pop-ups for this site
            and try again.
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.status === "done" && item.result ? (
          <button
            type="button"
            onClick={handlePreviewAndPrint}
            className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Preview &amp; print
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onConvert(item)}
            disabled={item.status === "processing"}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {item.status === "processing"
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
