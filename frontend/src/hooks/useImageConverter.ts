import { useCallback, useState } from "react";
import {
  buildOutputFileName,
  convertImage,
  detectImageFormat,
} from "../services/imageConversionService";
import type { ConversionItem, ImageFormat } from "../types/conversion";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function pickDefaultTarget(source: ImageFormat): ImageFormat {
  return source === "png" ? "jpeg" : "png";
}

export function useImageConverter() {
  const [items, setItems] = useState<ConversionItem[]>([]);

  const addFiles = useCallback((files: FileList | File[]): number => {
    const incoming = Array.from(files)
      .map((file): ConversionItem | null => {
        const sourceFormat = detectImageFormat(file);
        if (!sourceFormat) return null;
        return {
          id: createId(),
          file,
          sourceFormat,
          targetFormat: pickDefaultTarget(sourceFormat),
          status: "idle",
        };
      })
      .filter((item): item is ConversionItem => item !== null);

    if (incoming.length > 0) {
      setItems((prev) => [...prev, ...incoming]);
    }
    return incoming.length;
  }, []);

  const setTargetFormat = useCallback(
    (id: string, targetFormat: ImageFormat) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                targetFormat,
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

  const convertItem = useCallback(async (item: ConversionItem) => {
    const { id, file, targetFormat } = item;

    setItems((prev) =>
      prev.map((current) =>
        current.id === id
          ? {
              ...current,
              status: "converting",
              error: undefined,
              result: undefined,
            }
          : current,
      ),
    );

    try {
      const blob = await convertImage(file, targetFormat);
      const fileName = buildOutputFileName(file.name, targetFormat);
      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? {
                ...current,
                status: "done",
                result: { blob, fileName, format: targetFormat },
              }
            : current,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Conversion failed.";
      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? { ...current, status: "error", error: message }
            : current,
        ),
      );
    }
  }, []);

  const convertAll = useCallback(async () => {
    const pending = items.filter((item) => item.status !== "converting");
    await Promise.all(pending.map((item) => convertItem(item)));
  }, [items, convertItem]);

  const reset = useCallback(() => setItems([]), []);

  return {
    items,
    addFiles,
    setTargetFormat,
    removeItem,
    convertItem,
    convertAll,
    reset,
  };
}
