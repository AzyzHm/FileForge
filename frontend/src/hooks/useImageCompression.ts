import { useCallback, useState } from "react";
import {
  buildCompressedFileName,
  compressImage,
  isCompressibleImage,
} from "../services/compressionService";
import { createId } from "../utils/id";
import type { CompressionItem, CompressionLevel } from "../types/compression";

const DEFAULT_LEVEL: CompressionLevel = "balanced";

export function useImageCompression() {
  const [items, setItems] = useState<CompressionItem[]>([]);

  const addFiles = useCallback((files: FileList | File[]): number => {
    const incoming = Array.from(files)
      .filter((file) => isCompressibleImage(file))
      .map((file): CompressionItem => ({
        id: createId(),
        file,
        level: DEFAULT_LEVEL,
        status: "idle",
      }));

    if (incoming.length > 0) {
      setItems((prev) => [...prev, ...incoming]);
    }
    return incoming.length;
  }, []);

  const setLevel = useCallback((id: string, level: CompressionLevel) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              level,
              status: "idle",
              result: undefined,
              error: undefined,
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const compressItem = useCallback(async (item: CompressionItem) => {
    const { id, file, level } = item;

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
      const compressedFile = await compressImage(file, level);
      const fileName = buildCompressedFileName(file.name);
      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? {
                ...current,
                status: "done",
                result: {
                  file: compressedFile,
                  fileName,
                  originalSize: file.size,
                  compressedSize: compressedFile.size,
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
    setLevel,
    removeItem,
    compressItem,
    compressAll,
    reset,
  };
}
