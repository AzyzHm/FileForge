import { useCallback, useState } from "react";
import { convertDocxToHtml, isDocxFile } from "../services/wordToPdfService";
import { createId } from "../utils/id";
import type { WordToPdfItem } from "../types/wordToPdf";

export function useWordToPdf() {
  const [items, setItems] = useState<WordToPdfItem[]>([]);

  const addFiles = useCallback((files: FileList | File[]): number => {
    const incoming = Array.from(files)
      .filter((file) => isDocxFile(file))
      .map((file): WordToPdfItem => ({
        id: createId(),
        file,
        status: "idle",
      }));

    if (incoming.length > 0) {
      setItems((prev) => [...prev, ...incoming]);
    }
    return incoming.length;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const convertItem = useCallback(async (item: WordToPdfItem) => {
    const { id, file } = item;

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
      const result = await convertDocxToHtml(file);
      setItems((prev) =>
        prev.map((current) =>
          current.id === id ? { ...current, status: "done", result } : current,
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
    const pending = items.filter((item) => item.status !== "processing");
    await Promise.all(pending.map((item) => convertItem(item)));
  }, [items, convertItem]);

  const reset = useCallback(() => setItems([]), []);

  return {
    items,
    addFiles,
    removeItem,
    convertItem,
    convertAll,
    reset,
  };
}
