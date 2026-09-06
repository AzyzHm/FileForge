import { useState } from "react";
import { Dropzone } from "./Dropzone";
import { PdfSplitPageRow } from "./PdfSplitPageRow";
import { usePdfSplit } from "../hooks/usePdfSplit";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function parseInputNumber(value: string): number | "" {
  if (value === "") return "";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

export function PdfSplitPanel() {
  const {
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
  } = usePdfSplit();
  const [wasSkipped, setWasSkipped] = useState(false);

  const handleFiles = (files: FileList) => {
    const accepted = setSourceFile(files);
    setWasSkipped(!accepted);
  };

  const hasAtLeastOneRange = rangeRows.some((row) => row.from !== "");
  const canSplit =
    status !== "processing" && (mode === "all" || hasAtLeastOneRange);

  return (
    <div className="flex flex-col gap-4">
      <Dropzone
        accept="application/pdf"
        multiple={false}
        label="Drag a PDF here, or"
        helperText="Works with a single PDF file"
        onFiles={handleFiles}
      />

      {wasSkipped && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          That file is not a PDF.
        </p>
      )}

      {file && (
        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">
                {formatFileSize(file.size)}
                {pageCount ? ` · ${pageCount} pages` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="shrink-0 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div
              role="radiogroup"
              aria-label="Split mode"
              className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900"
            >
              <button
                type="button"
                role="radio"
                aria-checked={mode === "all"}
                onClick={() => setMode("all")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "all"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Every page
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "range"}
                onClick={() => setMode("range")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "range"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                Page ranges
              </button>
            </div>

            {mode === "range" && (
              <div className="flex flex-col gap-2">
                {rangeRows.map((row, index) => (
                  <div key={row.id} className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                      Range {index + 1}
                    </span>

                    <label className="sr-only" htmlFor={`${row.id}-from`}>
                      From page
                    </label>
                    <input
                      id={`${row.id}-from`}
                      type="number"
                      min={1}
                      max={pageCount ?? undefined}
                      placeholder="From"
                      value={row.from}
                      onChange={(event) =>
                        updateRangeRow(
                          row.id,
                          "from",
                          parseInputNumber(event.target.value),
                        )
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />

                    <span className="text-xs text-slate-400">to</span>

                    <label className="sr-only" htmlFor={`${row.id}-to`}>
                      To page, optional
                    </label>
                    <input
                      id={`${row.id}-to`}
                      type="number"
                      min={row.from === "" ? 1 : row.from}
                      max={pageCount ?? undefined}
                      placeholder={row.from === "" ? "To" : String(row.from)}
                      value={row.to}
                      onChange={(event) =>
                        updateRangeRow(
                          row.id,
                          "to",
                          parseInputNumber(event.target.value),
                        )
                      }
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() => removeRangeRow(row.id)}
                      disabled={rangeRows.length === 1}
                      aria-label={`Remove range ${index + 1}`}
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-30 dark:hover:text-slate-200"
                    >
                      &times;
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRangeRow}
                  className="self-start text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  + Add another range
                </button>

                <p className="text-xs text-slate-400">
                  {pageCount
                    ? `This PDF has ${pageCount} pages. Leave "to" blank for a single page.`
                    : 'Leave "to" blank to grab a single page.'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => void split()}
              disabled={!canSplit}
              className="self-start text-sm font-medium text-emerald-700 hover:text-emerald-800 disabled:opacity-40 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {status === "processing" ? "Splitting…" : "Split"}
            </button>
          </div>

          {error && (
            <p className="px-4 py-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {status === "done" && pages.length > 0 && (
            <ul className="px-4">
              {pages.map((page, index) => (
                <PdfSplitPageRow
                  key={`${index}-${page.fileName}`}
                  page={page}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
