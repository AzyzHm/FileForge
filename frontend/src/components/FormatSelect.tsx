import { IMAGE_FORMATS, type ImageFormat } from "../types/conversion";

interface FormatSelectProps {
  value: ImageFormat;
  exclude: ImageFormat;
  onChange: (format: ImageFormat) => void;
  disabled?: boolean;
  label: string;
}

const FORMAT_LABELS: Record<ImageFormat, string> = {
  png: "PNG",
  jpeg: "JPG",
  svg: "SVG",
};

export function FormatSelect({
  value,
  exclude,
  onChange,
  disabled,
  label,
}: FormatSelectProps) {
  const options = IMAGE_FORMATS.filter((format) => format !== exclude);

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as ImageFormat)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs uppercase tracking-wide text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        {options.map((format) => (
          <option key={format} value={format}>
            {FORMAT_LABELS[format]}
          </option>
        ))}
      </select>
    </label>
  );
}
