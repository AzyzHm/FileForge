import { useCallback, useState } from "react";
import {
  isPdfFile,
  splitPdf,
  splitPdfByRanges,
  type SplitPage,
} from "../services/pdfService";

type SplitStatus = "idle" | "processing" | "done" | "error";
export type SplitMode = "all" | "range";

export function usePdfSplit() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setModeState] = useState<SplitMode>("all");
  const [rangesInput, setRangesInputState] = useState("");
  const [status, setStatus] = useState<SplitStatus>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [pages, setPages] = useState<SplitPage[]>([]);

  const clearResult = useCallback(() => {
    setStatus("idle");
    setError(undefined);
    setPages([]);
  }, []);

  const setSourceFile = useCallback(
    (files: FileList | File[]): boolean => {
      const [candidate] = Array.from(files);
      if (!candidate || !isPdfFile(candidate)) {
        return false;
      }

      setFile(candidate);
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

  const setRangesInput = useCallback(
    (value: string) => {
      setRangesInputState(value);
      clearResult();
    },
    [clearResult],
  );

  const split = useCallback(async () => {
    if (!file) return;

    setStatus("processing");
    setError(undefined);

    try {
      const result =
        mode === "all"
          ? await splitPdf(file)
          : await splitPdfByRanges(file, rangesInput);
      setPages(result);
      setStatus("done");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Split failed.";
      setError(message);
      setStatus("error");
    }
  }, [file, mode, rangesInput]);

  const reset = useCallback(() => {
    setFile(null);
    setModeState("all");
    setRangesInputState("");
    clearResult();
  }, [clearResult]);

  return {
    file,
    mode,
    setMode,
    rangesInput,
    setRangesInput,
    status,
    error,
    pages,
    setSourceFile,
    split,
    reset,
  };
}
