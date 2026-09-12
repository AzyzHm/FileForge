import type { ProcessingStatus } from "./compression";

export const PDF_COMPRESSION_QUALITIES = [
  "screen",
  "ebook",
  "printer",
  "prepress",
] as const;

export type PdfCompressionQuality = (typeof PDF_COMPRESSION_QUALITIES)[number];

export const DEFAULT_PDF_COMPRESSION_QUALITY: PdfCompressionQuality = "ebook";

export interface PdfCompressionResult {
  blob: Blob;
  filename: string;
  originalSize: number;
  compressedSize: number;
}

export interface PdfCompressionItem {
  id: string;
  file: File;
  quality: PdfCompressionQuality;
  status: ProcessingStatus;
  result?: PdfCompressionResult;
  error?: string;
}
