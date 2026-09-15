import type { ProcessingStatus } from "../../types/shared";

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
