import { isPdfFile } from "./pdfService";
import { convertFileOnServer } from "./apiClient";
import type { PdfCompressionQuality } from "../types/pdfCompression";

export { isPdfFile };

export async function compressPdfOnServer(
  file: File,
  quality: PdfCompressionQuality,
  onProgress?: (percent: number) => void,
): Promise<{ blob: Blob; filename: string }> {
  if (!isPdfFile(file)) {
    throw new Error(`"${file.name}" is not a .pdf file.`);
  }

  const { blob, filename } = await convertFileOnServer({
    path: "/api/v1/convert/compress-pdf",
    file,
    fields: { quality },
    onUploadProgress: onProgress,
  });

  return { blob, filename };
}
