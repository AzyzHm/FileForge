import { Select } from "./Select";
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
  const options = PDF_COMPRESSION_QUALITIES.map((quality) => ({
    value: quality,
    label: QUALITY_LABELS[quality],
  }));

  return (
    <Select
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
