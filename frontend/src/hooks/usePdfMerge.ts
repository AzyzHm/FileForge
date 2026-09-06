import { useCallback, useState } from "react";
import { isPdfFile, mergePdfs } from "../services/pdfService";

const MERGED_FILE_NAME = "merged.pdf";

export interface MergeFileItem {
  id: string;
  file: File;
}

interface MergeResult {
  blob: Blob;
  fileName: string;
}

type MergeStatus = "idle" | "processing" | "done" | "error";

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function usePdfMerge() {
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [status, setStatus] = useState<MergeStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<MergeResult | undefined>(undefined);

  const addFiles = useCallback((files: FileList | File[]): number => {
    const incoming = Array.from(files)
      .filter(isPdfFile)
      .map((file): MergeFileItem => ({ id: createId(), file }));

    if (incoming.length > 0) {
      setItems((prev) => [...prev, ...incoming]);
      setStatus("idle");
      setResult(undefined);
      setError(undefined);
    }
    return incoming.length;
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setStatus("idle");
    setResult(undefined);
  }, []);

  const moveItem = useCallback((id: string, direction: "up" | "down") => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }, []);

  const merge = useCallback(async () => {
    if (items.length < 2) {
      setStatus("error");
      setError("Add at least two PDFs to merge.");
      return;
    }

    setStatus("processing");
    setError(undefined);

    try {
      const blob = await mergePdfs(items.map((item) => item.file));
      setResult({ blob, fileName: MERGED_FILE_NAME });
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Merge failed.";
      setError(message);
      setStatus("error");
    }
  }, [items]);

  const reset = useCallback(() => {
    setItems([]);
    setStatus("idle");
    setError(undefined);
    setResult(undefined);
  }, []);

  return {
    items,
    status,
    error,
    result,
    addFiles,
    removeItem,
    moveItem,
    merge,
    reset,
  };
}
