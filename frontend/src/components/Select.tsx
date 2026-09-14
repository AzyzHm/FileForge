import { ChevronDown } from "lucide-react";

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  monospace?: boolean;
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  monospace,
}: SelectProps<T>) {
  return (
    <label className="relative flex items-center text-sm text-slate-600 dark:text-slate-300">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        className={`appearance-none rounded-lg border border-slate-300 bg-white py-1 pl-2 pr-6 text-xs text-slate-700 transition-colors focus:border-brand-500 focus:outline-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${
          monospace ? "font-mono uppercase tracking-wide" : ""
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        size={13}
        className="pointer-events-none absolute right-1.5 text-slate-400"
      />
    </label>
  );
}
