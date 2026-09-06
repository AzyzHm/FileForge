interface Tool {
  id: string;
  label: string;
}

interface ToolTabsProps {
  tools: Tool[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ToolTabs({ tools, activeId, onChange }: ToolTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Tools"
      className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
    >
      {tools.map((tool) => {
        const isActive = tool.id === activeId;
        return (
          <button
            key={tool.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tool.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tool.label}
          </button>
        );
      })}
    </div>
  );
}
