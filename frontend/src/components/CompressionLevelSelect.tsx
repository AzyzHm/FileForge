import { Select } from "./Select";
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
  const options = COMPRESSION_LEVELS.map((level) => ({
    value: level,
    label: LEVEL_LABELS[level],
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
