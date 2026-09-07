import { useObjectUrl } from "../hooks/useObjectUrl";
import type {
  BackgroundRemovalItem,
  BackgroundRemovalResult,
} from "../types/backgroundRemoval";

interface BackgroundRemovalItemRowProps {
  item: BackgroundRemovalItem;
  onProcess: (item: BackgroundRemovalItem) => void;
  onRemove: (id: string) => void;
}

const CHECKERBOARD_STYLE = {
  backgroundImage:
    "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)",
  backgroundSize: "8px 8px",
  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResultPreview({ result }: { result: BackgroundRemovalResult }) {
  const previewUrl = useObjectUrl(result.file);

  if (!previewUrl) {
    return (
      <div className="h-12 w-12 shrink-0 rounded-md bg-slate-100 dark:bg-slate-800" />
    );
  }

  return (
    <img
      src={previewUrl}
      alt={`${result.fileName} with the background removed`}
      style={CHECKERBOARD_STYLE}
      className="h-12 w-12 shrink-0 rounded-md object-cover"
    />
  );
}

function DownloadLink({ result }: { result: BackgroundRemovalResult }) {
  const downloadUrl = useObjectUrl(result.file);

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
      download={result.fileName}
      className="rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
    >
      Download
    </a>
  );
}

export function BackgroundRemovalItemRow({
  item,
  onProcess,
  onRemove,
}: BackgroundRemovalItemRowProps) {
  return (
    <li className="flex flex-col gap-3 border-b border-slate-200 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {item.status === "done" && item.result ? (
          <ResultPreview result={item.result} />
        ) : (
          <div className="h-12 w-12 shrink-0 rounded-md bg-slate-100 dark:bg-slate-800" />
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
            {item.file.name}
          </p>
          <p className="text-xs text-slate-400">
            {formatFileSize(item.file.size)}
          </p>
          {item.status === "processing" && (
            <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
          {item.status === "error" && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {item.error}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.status === "done" && item.result ? (
          <DownloadLink result={item.result} />
        ) : (
          <button
            type="button"
            onClick={() => onProcess(item)}
            disabled={item.status === "processing"}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {item.status === "processing"
              ? `Processing… ${item.progress}%`
              : item.status === "error"
                ? "Retry"
                : "Remove background"}
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
