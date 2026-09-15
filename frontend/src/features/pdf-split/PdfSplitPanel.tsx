import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Dropzone } from "../../components/Dropzone";
import { IconButton } from "../../components/IconButton";
import { PdfSplitPageRow } from "./PdfSplitPageRow";
import { SegmentedControl } from "../../components/SegmentedControl";
import { usePdfSplit } from "./usePdfSplit";
import { formatFileSize } from "../../utils/formatFileSize";

const MODE_OPTIONS = [
  { id: "all" as const, label: "Every page" },
  { id: "range" as const, label: "Page ranges" },
];

function parseInputNumber(value: string): number | "" {
  if (value === "") return "";
  const parsed = Number(value);
  return Number.isNaN(parsed) ? "" : parsed;
}

const inputClasses =
  "w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-800 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

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
        <Card>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                {file.name}
              </p>
              <p className="text-xs text-slate-400">
                {formatFileSize(file.size)}
                {pageCount ? ` · ${pageCount} pages` : ""}
              </p>
            </div>
            <Button variant="ghost" onClick={reset} className="shrink-0">
              Clear
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-800">
            <SegmentedControl
              as="radiogroup"
              ariaLabel="Split mode"
              options={MODE_OPTIONS}
              activeId={mode}
              onChange={setMode}
            />

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
                      className={inputClasses}
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
                      className={inputClasses}
                    />

                    <IconButton
                      icon={X}
                      onClick={() => removeRangeRow(row.id)}
                      disabled={rangeRows.length === 1}
                      aria-label={`Remove range ${index + 1}`}
                    />
                  </div>
                ))}

                <Button
                  variant="link"
                  onClick={addRangeRow}
                  className="self-start"
                >
                  + Add another range
                </Button>

                <p className="text-xs text-slate-400">
                  {pageCount
                    ? `This PDF has ${pageCount} pages. Leave "to" blank for a single page.`
                    : 'Leave "to" blank to grab a single page.'}
                </p>
              </div>
            )}

            <Button
              variant="secondary"
              onClick={() => void split()}
              disabled={!canSplit}
              className="self-start"
            >
              {status === "processing" ? "Splitting…" : "Split"}
            </Button>
          </div>

          {error && (
            <p className="px-4 py-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {status === "done" && pages.length > 0 && (
            <ul className="divide-y divide-slate-200 px-4 dark:divide-slate-800">
              {pages.map((page, index) => (
                <PdfSplitPageRow
                  key={`${index}-${page.fileName}`}
                  page={page}
                />
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
