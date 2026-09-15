export type ImageFormat = "png" | "jpeg" | "svg";

export const IMAGE_FORMATS: ImageFormat[] = ["png", "jpeg", "svg"];

export const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  svg: "image/svg+xml",
};

export const EXTENSION_BY_FORMAT: Record<ImageFormat, string> = {
  png: "png",
  jpeg: "jpg",
  svg: "svg",
};

export type ConversionStatus = "idle" | "converting" | "done" | "error";

export interface ConversionResult {
  blob: Blob;
  fileName: string;
  format: ImageFormat;
}

export interface ConversionItem {
  id: string;
  file: File;
  sourceFormat: ImageFormat;
  targetFormat: ImageFormat;
  status: ConversionStatus;
  result?: ConversionResult;
  error?: string;
}
