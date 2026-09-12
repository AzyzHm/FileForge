import {
  PDF_COMPRESSION_QUALITIES,
  type PdfCompressionQuality,
} from "../types/pdfCompression";

interface PdfCompressionQualitySelectProps {
  value: PdfCompressionQuality;
  onChange: (quality: PdfCompressionQuality) => void;
  disabled?: boolean;
  label: string;
}

const QUALITY_LABELS: Record<PdfCompressionQuality, string> = {
  screen: "Screen (smallest)",
  ebook: "eBook (balanced)",
  printer: "Printer",
  prepress: "Prepress (highest quality)",
};

export function PdfCompressionQualitySelect({
  value,
  onChange,
  disabled,
  label,
}: PdfCompressionQualitySelectProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value as PdfCompressionQuality)
        }
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      >
        {PDF_COMPRESSION_QUALITIES.map((quality) => (
          <option key={quality} value={quality}>
            {QUALITY_LABELS[quality]}
          </option>
        ))}
      </select>
    </label>
  );
}
