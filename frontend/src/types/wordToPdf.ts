import type { ProcessingStatus } from "./compression";

export interface WordToPdfResult {
  html: string;
  warnings: string[];
}

export interface WordToPdfItem {
  id: string;
  file: File;
  status: ProcessingStatus;
  result?: WordToPdfResult;
  error?: string;
}
