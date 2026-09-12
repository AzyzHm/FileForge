import { isPdfFile } from "./pdfService";
import { convertFileOnServer, withExtension } from "./apiClient";
import type { PdfToWordResult } from "../types/pdfToWord";

export { isPdfFile };

export async function convertPdfToWord(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<PdfToWordResult> {
  if (!isPdfFile(file)) {
    throw new Error(`"${file.name}" is not a .pdf file.`);
  }

  const { blob, filename } = await convertFileOnServer({
    path: "/api/v1/convert/pdf-to-word",
    file,
    fallbackFilename: withExtension(file.name, "docx"),
    onUploadProgress: onProgress,
  });

  return { blob, filename };
}
