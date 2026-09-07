import imageCompression, { type Options } from "browser-image-compression";
import type { CompressionLevel } from "../types/compression";

const LEVEL_OPTIONS: Record<CompressionLevel, Options> = {
  light: { maxSizeMB: 2, initialQuality: 0.9, useWebWorker: true },
  balanced: { maxSizeMB: 1, initialQuality: 0.75, useWebWorker: true },
  aggressive: { maxSizeMB: 0.3, initialQuality: 0.5, useWebWorker: true },
};

export function isCompressibleImage(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/png" || type === "image/jpeg" || type === "image/jpg") {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "png" || extension === "jpg" || extension === "jpeg";
}

export function buildCompressedFileName(originalName: string): string {
  const dotIndex = originalName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return `${originalName}-compressed`;
  }

  const base = originalName.slice(0, dotIndex);
  const extension = originalName.slice(dotIndex);
  return `${base}-compressed${extension}`;
}

export async function compressImage(
  file: File,
  level: CompressionLevel,
): Promise<File> {
  if (!isCompressibleImage(file)) {
    throw new Error(
      `"${file.name}" is not a supported image type. Use PNG or JPG.`,
    );
  }

  try {
    return await imageCompression(file, LEVEL_OPTIONS[level]);
  } catch {
    throw new Error(
      `"${file.name}" could not be compressed. It may be corrupted or unsupported.`,
    );
  }
}
