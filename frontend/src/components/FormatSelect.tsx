import { Select } from "./Select";
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
  const options = IMAGE_FORMATS.filter((format) => format !== exclude).map(
    (format) => ({ value: format, label: FORMAT_LABELS[format] }),
  );

  return (
    <Select
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
      monospace
    />
  );
}
