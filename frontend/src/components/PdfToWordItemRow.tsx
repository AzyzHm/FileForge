import { useObjectUrl } from "../hooks/useObjectUrl";
import type { PdfToWordItem, PdfToWordResult } from "../types/pdfToWord";

interface PdfToWordItemRowProps {
  item: PdfToWordItem;
  onConvert: (item: PdfToWordItem) => void;
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DownloadLink({ result }: { result: PdfToWordResult }) {
  const downloadUrl = useObjectUrl(result.blob);

  if (!downloadUrl) {
    return (
      <span className="rounded-md px-3 py-1 text-sm text-slate-400">
        Preparing…
      </span>
    );
  }

  return (
    <a
      href={downloadUrl}
      download={result.filename}
      className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
    >
      Download
    </a>
  );
}

export function PdfToWordItemRow({
  item,
  onConvert,
  onRemove,
}: PdfToWordItemRowProps) {
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
        {item.status === "done" && item.result ? (
          <DownloadLink result={item.result} />
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
