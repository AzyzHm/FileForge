import type { ProcessingStatus } from "../../types/shared";

export const COMPRESSION_LEVELS = ["light", "balanced", "aggressive"] as const;

export type CompressionLevel = (typeof COMPRESSION_LEVELS)[number];

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
