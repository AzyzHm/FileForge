export const COMPRESSION_LEVELS = ["light", "balanced", "aggressive"] as const;

export type CompressionLevel = (typeof COMPRESSION_LEVELS)[number];

export type ProcessingStatus = "idle" | "processing" | "done" | "error";

export interface CompressionResult {
  file: File;
  fileName: string;
  originalSize: number;
  compressedSize: number;
}

export interface CompressionItem {
  id: string;
  file: File;
  level: CompressionLevel;
  status: ProcessingStatus;
  result?: CompressionResult;
  error?: string;
}
