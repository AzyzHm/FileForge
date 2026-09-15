import { DownloadButton } from "../../components/DownloadButton";
import type { SplitPage } from "../../services/pdfService";

interface PdfSplitPageRowProps {
  page: SplitPage;
}

export function PdfSplitPageRow({ page }: PdfSplitPageRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <p className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
        {page.fileName}
      </p>
      <DownloadButton blob={page.blob} fileName={page.fileName} />
    </li>
  );
}
