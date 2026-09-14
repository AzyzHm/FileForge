import { Eraser, X } from "lucide-react";
import { Button } from "./Button";
import { DownloadButton } from "./DownloadButton";
import { FileAvatar } from "./FileAvatar";
import { IconButton } from "./IconButton";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { formatFileSize } from "../utils/formatFileSize";
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

function ResultPreview({ result }: { result: BackgroundRemovalResult }) {
  const previewUrl = useObjectUrl(result.file);

  if (!previewUrl) {
    return <FileAvatar icon={Eraser} />;
  }

  return (
    <img
      src={previewUrl}
      alt={`${result.fileName} with the background removed`}
      style={CHECKERBOARD_STYLE}
      className="h-10 w-10 shrink-0 rounded-xl object-cover"
    />
  );
}

export function BackgroundRemovalItemRow({
  item,
  onProcess,
  onRemove,
}: BackgroundRemovalItemRowProps) {
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {item.status === "done" && item.result ? (
          <ResultPreview result={item.result} />
        ) : (
          <FileAvatar icon={Eraser} />
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
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all"
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
          <DownloadButton
            blob={item.result.file}
            fileName={item.result.fileName}
          />
        ) : (
          <Button
            onClick={() => onProcess(item)}
            disabled={item.status === "processing"}
          >
            {item.status === "processing"
              ? `Processing… ${item.progress}%`
              : item.status === "error"
                ? "Retry"
                : "Remove background"}
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
