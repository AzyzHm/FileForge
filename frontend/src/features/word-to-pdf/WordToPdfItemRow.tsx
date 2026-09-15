import { FileText, X } from "lucide-react";
import { Button } from "../../components/Button";
import { DownloadButton } from "../../components/DownloadButton";
import { FileAvatar } from "../../components/FileAvatar";
import { IconButton } from "../../components/IconButton";
import { formatFileSize } from "../../utils/formatFileSize";
import type { WordToPdfItem } from "./types";

interface WordToPdfItemRowProps {
  item: WordToPdfItem;
  onConvert: (item: WordToPdfItem) => void;
  onRemove: (id: string) => void;
}

export function WordToPdfItemRow({
  item,
  onConvert,
  onRemove,
}: WordToPdfItemRowProps) {
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileAvatar icon={FileText} />
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
        {item.status === "done" && item.result ? (
          <DownloadButton
            blob={item.result.blob}
            fileName={item.result.filename}
            label="Download PDF"
          />
        ) : (
          <Button
            onClick={() => onConvert(item)}
            disabled={item.status === "processing"}
          >
            {item.status === "processing"
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
