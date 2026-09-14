import { Download } from "lucide-react";
import { useObjectUrl } from "../hooks/useObjectUrl";

interface DownloadButtonProps {
  blob: Blob;
  fileName: string;
  label?: string;
}

export function DownloadButton({
  blob,
  fileName,
  label = "Download",
}: DownloadButtonProps) {
  const downloadUrl = useObjectUrl(blob);

  if (!downloadUrl) {
    return (
      <span className="rounded-lg px-3 py-1.5 text-sm text-slate-400">
        Preparing…
      </span>
    );
  }

  return (
    <a
      href={downloadUrl}
      download={fileName}
      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-105 active:scale-[0.97]"
    >
      <Download aria-hidden size={14} strokeWidth={2.25} />
      {label}
    </a>
  );
}
