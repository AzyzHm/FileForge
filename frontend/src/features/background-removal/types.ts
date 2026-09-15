import type { ProcessingStatus } from "../../types/shared";

export interface BackgroundRemovalResult {
  file: File;
  fileName: string;
}

export interface BackgroundRemovalItem {
  id: string;
  file: File;
  status: ProcessingStatus;
  progress: number;
  result?: BackgroundRemovalResult;
  error?: string;
}
