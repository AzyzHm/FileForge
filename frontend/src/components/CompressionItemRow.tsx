import { CompressionLevelSelect } from "./CompressionLevelSelect";
import { useObjectUrl } from "../hooks/useObjectUrl";
import type {
  CompressionItem,
  CompressionLevel,
  CompressionResult,
} from "../types/compression";

interface CompressionItemRowProps {
  item: CompressionItem;
  onLevelChange: (id: string, level: CompressionLevel) => void;
  onCompress: (item: CompressionItem) => void;
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatReduction(originalSize: number, compressedSize: number): string {
  if (originalSize <= 0) return "";
  const reduction = Math.round((1 - compressedSize / originalSize) * 100);
  return reduction > 0 ? `${reduction}% smaller` : "No size reduction";
}

function DownloadLink({ result }: { result: CompressionResult }) {
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

export function CompressionItemRow({
  item,
  onLevelChange,
  onCompress,
  onRemove,
}: CompressionItemRowProps) {
  return (
    <li className="flex flex-col gap-3 border-b border-slate-200 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div className="min-w-0 flex-1">
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

      <div className="flex shrink-0 items-center gap-2">
        <CompressionLevelSelect
          label={`Compression level for ${item.file.name}`}
          value={item.level}
          onChange={(level) => onLevelChange(item.id, level)}
          disabled={item.status === "processing"}
        />

        {item.status === "done" && item.result ? (
          <DownloadLink result={item.result} />
        ) : (
          <button
            type="button"
            onClick={() => onCompress(item)}
            disabled={item.status === "processing"}
            className="rounded-md bg-slate-800 px-3 py-1 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {item.status === "processing"
              ? "Compressing…"
              : item.status === "error"
                ? "Retry"
                : "Compress"}
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
