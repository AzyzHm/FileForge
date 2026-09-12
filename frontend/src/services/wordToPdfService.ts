import { convertFileOnServer, withExtension } from "./apiClient";
import type { WordToPdfResult } from "../types/wordToPdf";

const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function isDocxFile(file: File): boolean {
  if (file.type.toLowerCase() === DOCX_MIME_TYPE) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "docx";
}

export async function convertDocxToPdf(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<WordToPdfResult> {
  if (!isDocxFile(file)) {
    throw new Error(`"${file.name}" is not a .docx file.`);
  }

  const { blob, filename } = await convertFileOnServer({
    path: "/api/v1/convert/word-to-pdf",
    file,
    fallbackFilename: withExtension(file.name, "pdf"),
    onUploadProgress: onProgress,
  });

  return { blob, filename };
}
