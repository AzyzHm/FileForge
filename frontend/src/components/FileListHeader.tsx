import { Button } from "./Button";

interface FileListHeaderProps {
  count: number;
  onClear: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
}

export function FileListHeader({
  count,
  onClear,
  primaryLabel,
  onPrimary,
  primaryDisabled,
}: FileListHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {count} {count === 1 ? "file" : "files"}
      </p>
      <div className="flex items-center gap-2">
        {primaryLabel && onPrimary && (
          <Button
            variant="secondary"
            onClick={onPrimary}
            disabled={primaryDisabled}
          >
            {primaryLabel}
          </Button>
        )}
        <Button variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
