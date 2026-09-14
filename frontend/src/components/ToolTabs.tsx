import type { LucideIcon } from "lucide-react";
import { SegmentedControl } from "./SegmentedControl";

interface Tool {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface ToolTabsProps {
  tools: Tool[];
  activeId: string;
  onChange: (id: string) => void;
}

export function ToolTabs({ tools, activeId, onChange }: ToolTabsProps) {
  return (
    <SegmentedControl
      as="tablist"
      ariaLabel="Tools"
      options={tools}
      activeId={activeId}
      onChange={onChange}
      scrollable
    />
  );
}
