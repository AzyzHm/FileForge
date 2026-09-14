import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeContext";
import type { ThemePreference } from "./ThemeContext";

const OPTIONS: { id: ThemePreference; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light theme", icon: Sun },
  { id: "dark", label: "Dark theme", icon: Moon },
  { id: "system", label: "Match system theme", icon: Monitor },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = preference === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setPreference(id)}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-all active:scale-90 ${
              isActive
                ? "bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            }`}
          >
            <Icon aria-hidden size={14} strokeWidth={2.25} />
          </button>
        );
      })}
    </div>
  );
}
