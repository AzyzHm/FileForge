import type { LucideIcon } from "lucide-react";

export function FileAvatar({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-300">
      <Icon aria-hidden size={18} strokeWidth={2} />
    </div>
  );
}
