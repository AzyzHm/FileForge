import type { ProcessingStatus } from "./compression";

export interface PdfToWordResult {
  blob: Blob;
  filename: string;
}

export interface PdfToWordItem {
  id: string;
  file: File;
  status: ProcessingStatus;
  result?: PdfToWordResult;
  error?: string;
}
