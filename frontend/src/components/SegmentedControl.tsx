import type { LucideIcon } from "lucide-react";

interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  as: "tablist" | "radiogroup";
  ariaLabel: string;
  options: SegmentedControlOption<T>[];
  activeId: T;
  onChange: (id: T) => void;
  scrollable?: boolean;
}

export function SegmentedControl<T extends string>({
  as,
  ariaLabel,
  options,
  activeId,
  onChange,
  scrollable = false,
}: SegmentedControlProps<T>) {
  const itemRole = as === "tablist" ? "tab" : "radio";

  return (
    <div
      role={as}
      aria-label={ariaLabel}
      className={`flex gap-1 rounded-full bg-slate-100 p-1 dark:bg-slate-900 ${
        scrollable
          ? "no-scrollbar scroll-fade-x overflow-x-auto"
          : "overflow-hidden"
      }`}
    >
      {options.map(({ id, label, icon: Icon }) => {
        const isActive = id === activeId;
        return (
          <button
            key={id}
            type="button"
            role={itemRole}
            aria-selected={as === "tablist" ? isActive : undefined}
            aria-checked={as === "radiogroup" ? isActive : undefined}
            onClick={() => onChange(id)}
            className={`flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.97] ${
              scrollable ? "shrink-0" : "flex-1"
            } ${
              isActive
                ? "bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {Icon && <Icon aria-hidden size={15} strokeWidth={2.25} />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
