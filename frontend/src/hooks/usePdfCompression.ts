import { useCallback, useState } from "react";
import {
  compressPdfOnServer,
  isPdfFile,
} from "../services/pdfCompressionService";
import { createId } from "../utils/id";
import {
  DEFAULT_PDF_COMPRESSION_QUALITY,
  type PdfCompressionItem,
  type PdfCompressionQuality,
} from "../types/pdfCompression";

export function usePdfCompression() {
  const [items, setItems] = useState<PdfCompressionItem[]>([]);

  const addFiles = useCallback((files: FileList | File[]): number => {
    const incoming = Array.from(files)
      .filter((file) => isPdfFile(file))
      .map((file): PdfCompressionItem => ({
        id: createId(),
        file,
        quality: DEFAULT_PDF_COMPRESSION_QUALITY,
        status: "idle",
      }));

    if (incoming.length > 0) {
      setItems((prev) => [...prev, ...incoming]);
    }
    return incoming.length;
  }, []);

  const setQuality = useCallback(
    (id: string, quality: PdfCompressionQuality) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quality,
                status: "idle",
                result: undefined,
                error: undefined,
              }
            : item,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const compressItem = useCallback(async (item: PdfCompressionItem) => {
    const { id, file, quality } = item;

    setItems((prev) =>
      prev.map((current) =>
        current.id === id
          ? {
              ...current,
              status: "processing",
              error: undefined,
              result: undefined,
            }
          : current,
      ),
    );

    try {
      const { blob, filename } = await compressPdfOnServer(file, quality);
      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? {
                ...current,
                status: "done",
                result: {
                  blob,
                  filename,
                  originalSize: file.size,
                  compressedSize: blob.size,
                },
              }
            : current,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Compression failed.";
      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? { ...current, status: "error", error: message }
            : current,
        ),
      );
    }
  }, []);

  const compressAll = useCallback(async () => {
    const pending = items.filter((item) => item.status !== "processing");
    await Promise.all(pending.map((item) => compressItem(item)));
  }, [items, compressItem]);

  const reset = useCallback(() => setItems([]), []);

  return {
    items,
    addFiles,
    setQuality,
    removeItem,
    compressItem,
    compressAll,
    reset,
  };
}
