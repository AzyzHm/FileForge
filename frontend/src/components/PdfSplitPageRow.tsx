import { useObjectUrl } from "../hooks/useObjectUrl";
import type { SplitPage } from "../services/pdfService";

interface PdfSplitPageRowProps {
  page: SplitPage;
}

export function PdfSplitPageRow({ page }: PdfSplitPageRowProps) {
  const downloadUrl = useObjectUrl(page.blob);

  return (
    <li className="flex items-center justify-between gap-3 border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-800">
      <p className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {page.fileName}
      </p>
      {downloadUrl ? (
        <a
          href={downloadUrl}
          download={page.fileName}
          className="shrink-0 rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Download
        </a>
      ) : (
        <span className="shrink-0 text-xs text-slate-400">Preparing…</span>
      )}
    </li>
  );
}
