import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

interface SidebarTool<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps<T extends string> {
  isOpen: boolean;
  onClose: () => void;
  tools: SidebarTool<T>[];
  activeId: T;
  onSelect: (id: T) => void;
}

export function Sidebar<T extends string>({
  isOpen,
  onClose,
  tools,
  activeId,
  onSelect,
}: SidebarProps<T>) {
  return (
    <>
      {isOpen && (
        <div
          aria-hidden
          onClick={onClose}
          className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm transition-opacity"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 flex w-72 max-w-[80vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-900 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tools
          </p>
          <IconButton
            icon={X}
            onClick={onClose}
            aria-label="Close tools menu"
          />
        </div>

        <div
          role="tablist"
          aria-label="Tools"
          aria-orientation="vertical"
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
        >
          {tools.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeId;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(id)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all active:scale-[0.98] ${
                  isActive
                    ? "bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon aria-hidden size={17} strokeWidth={2.25} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
