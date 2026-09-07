import {
  COMPRESSION_LEVELS,
  type CompressionLevel,
} from "../types/compression";

interface CompressionLevelSelectProps {
  value: CompressionLevel;
  onChange: (level: CompressionLevel) => void;
  disabled?: boolean;
  label: string;
}

const LEVEL_LABELS: Record<CompressionLevel, string> = {
  light: "Light",
  balanced: "Balanced",
  aggressive: "Smallest",
};

export function CompressionLevelSelect({
  value,
  onChange,
  disabled,
  label,
}: CompressionLevelSelectProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as CompressionLevel)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        {COMPRESSION_LEVELS.map((level) => (
          <option key={level} value={level}>
            {LEVEL_LABELS[level]}
          </option>
        ))}
      </select>
    </label>
  );
}
