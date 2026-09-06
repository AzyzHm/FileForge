import { useCallback, useEffect, useState } from "react";
import {
  getPdfPageCount,
  isPdfFile,
  splitPdf,
  splitPdfByRanges,
  type PageRange,
  type SplitPage,
} from "../services/pdfService";

type SplitStatus = "idle" | "processing" | "done" | "error";
export type SplitMode = "all" | "range";

export interface RangeRow {
  id: string;
  from: number | "";
  to: number | "";
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function createEmptyRow(): RangeRow {
  return { id: createId(), from: "", to: "" };
}

export function usePdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setModeState] = useState<SplitMode>("all");
  const [rangeRows, setRangeRows] = useState<RangeRow[]>([createEmptyRow()]);
  const [status, setStatus] = useState<SplitStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState<SplitPage[]>([]);

  const clearResult = useCallback(() => {
    setStatus("idle");
    setError(undefined);
    setPages([]);
  }, []);

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    getPdfPageCount(file)
      .then((count) => {
        if (!cancelled) setPageCount(count);
      })
      .catch(() => {
        if (!cancelled) setPageCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  const setSourceFile = useCallback(
    (files: FileList | File[]): boolean => {
      const [candidate] = Array.from(files);
      if (!candidate || !isPdfFile(candidate)) {
        return false;
      }

      setFile(candidate);
      setPageCount(null);
      setRangeRows([createEmptyRow()]);
      clearResult();
      return true;
    },
    [clearResult],
  );

  const setMode = useCallback(
    (next: SplitMode) => {
      setModeState(next);
      clearResult();
    },
    [clearResult],
  );

  const addRangeRow = useCallback(() => {
    setRangeRows((prev) => [...prev, createEmptyRow()]);
    clearResult();
  }, [clearResult]);

  const removeRangeRow = useCallback(
    (id: string) => {
      setRangeRows((prev) =>
        prev.length > 1 ? prev.filter((row) => row.id !== id) : prev,
      );
      clearResult();
    },
    [clearResult],
  );

  const updateRangeRow = useCallback(
    (id: string, field: "from" | "to", value: number | "") => {
      setRangeRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      );
      clearResult();
    },
    [clearResult],
  );

  const split = useCallback(async () => {
    if (!file) return;

    setStatus("processing");
    setError(undefined);

    try {
      let result: SplitPage[];

      if (mode === "all") {
        result = await splitPdf(file);
      } else {
        const ranges: PageRange[] = rangeRows
          .filter((row) => row.from !== "")
          .map((row) => ({
            start: Number(row.from),
            end: row.to === "" ? Number(row.from) : Number(row.to),
          }));
        result = await splitPdfByRanges(file, ranges);
      }

      setPages(result);
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Split failed.";
      setError(message);
      setStatus("error");
    }
  }, [file, mode, rangeRows]);

  const reset = useCallback(() => {
    setFile(null);
    setPageCount(null);
    setModeState("all");
    setRangeRows([createEmptyRow()]);
    clearResult();
  }, [clearResult]);

  return {
    file,
    pageCount,
    mode,
    setMode,
    rangeRows,
    addRangeRow,
    removeRangeRow,
    updateRangeRow,
    status,
    error,
    pages,
    setSourceFile,
    split,
    reset,
  };
}
