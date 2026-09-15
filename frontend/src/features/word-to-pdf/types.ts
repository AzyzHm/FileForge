import type { ProcessingStatus } from "../../types/shared";

export interface WordToPdfResult {
  blob: Blob;
  filename: string;
}

export interface WordToPdfItem {
  id: string;
  file: File;
  status: ProcessingStatus;
  result?: WordToPdfResult;
  error?: string;
}
