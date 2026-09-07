import { useCallback, useState } from "react";
import {
  isRemovableImage,
  removeImageBackground,
} from "../services/backgroundRemovalService";
import { createId } from "../utils/id";
import type { BackgroundRemovalItem } from "../types/backgroundRemoval";

export function useBackgroundRemoval() {
  const [items, setItems] = useState<BackgroundRemovalItem[]>([]);

  const addFiles = useCallback((files: FileList | File[]): number => {
    const incoming = Array.from(files)
      .filter((file) => isRemovableImage(file))
      .map((file): BackgroundRemovalItem => ({
        id: createId(),
        file,
        status: "idle",
        progress: 0,
      }));

    if (incoming.length > 0) {
      setItems((prev) => [...prev, ...incoming]);
    }
    return incoming.length;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const processItem = useCallback(async (item: BackgroundRemovalItem) => {
    const { id, file } = item;

    setItems((prev) =>
      prev.map((current) =>
        current.id === id
          ? {
              ...current,
              status: "processing",
              progress: 0,
              error: undefined,
              result: undefined,
            }
          : current,
      ),
    );

    try {
      const resultFile = await removeImageBackground(file, (percent) => {
        setItems((prev) =>
          prev.map((current) =>
            current.id === id ? { ...current, progress: percent } : current,
          ),
        );
      });

      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? {
                ...current,
                status: "done",
                progress: 100,
                result: { file: resultFile, fileName: resultFile.name },
              }
            : current,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Background removal failed.";
      setItems((prev) =>
        prev.map((current) =>
          current.id === id
            ? { ...current, status: "error", error: message }
            : current,
        ),
      );
    }
  }, []);

  const processAll = useCallback(async () => {
    const pending = items.filter((item) => item.status !== "processing");
    await Promise.all(pending.map((item) => processItem(item)));
  }, [items, processItem]);

  const reset = useCallback(() => setItems([]), []);

  return {
    items,
    addFiles,
    removeItem,
    processItem,
    processAll,
    reset,
  };
}
