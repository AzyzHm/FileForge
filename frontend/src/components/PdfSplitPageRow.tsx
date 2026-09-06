import { useEffect, useMemo } from "react";
import type { SplitPage } from "../services/pdfService";

interface PdfSplitPageRowProps {
  page: SplitPage;
}

export function PdfSplitPageRow({ page }: PdfSplitPageRowProps) {
  const downloadUrl = useMemo(
    () => URL.createObjectURL(page.blob),
    [page.blob],
  );

  useEffect(() => {
    return () => URL.revokeObjectURL(downloadUrl);
  }, [downloadUrl]);

  return (
    <li className="flex items-center justify-between gap-3 border-b border-slate-200 py-3 last:border-b-0 dark:border-slate-800">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
        {page.label}
      </p>
      <a
        href={downloadUrl}
        download={page.fileName}
        className="shrink-0 rounded-md bg-emerald-700 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Download
      </a>
    </li>
  );
}
