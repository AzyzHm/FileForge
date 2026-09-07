import { useState } from "react";
import { CompressionPanel } from "./components/CompressionPanel";
import { ImageConverterPanel } from "./components/ImageConverterPanel";
import { PdfMergePanel } from "./components/PdfMergePanel";
import { PdfSplitPanel } from "./components/PdfSplitPanel";
import { ToolTabs } from "./components/ToolTabs";

type ToolId = "images" | "compress" | "pdf-merge" | "pdf-split";

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "compress", label: "Compress" },
  { id: "pdf-merge", label: "Merge PDFs" },
  { id: "pdf-split", label: "Split PDF" },
];

const DESCRIPTIONS: Record<ToolId, string> = {
  images:
    "Convert images between PNG, JPG, and SVG. Everything runs in your browser, nothing is uploaded anywhere.",
  compress:
    "Shrink PNG and JPG file sizes. Everything runs in your browser, nothing is uploaded anywhere.",
  "pdf-merge":
    "Combine PDFs into one file, in the order you choose. Everything runs in your browser, nothing is uploaded anywhere.",
  "pdf-split":
    "Split a PDF into one file per page. Everything runs in your browser, nothing is uploaded anywhere.",
};

function App() {
  const [activeTool, setActiveTool] = useState<ToolId>("images");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            FileForge
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {DESCRIPTIONS[activeTool]}
          </p>
        </header>

        <ToolTabs
          tools={TOOLS}
          activeId={activeTool}
          onChange={(id) => setActiveTool(id as ToolId)}
        />

        <main className="mt-6 flex-1">
          {activeTool === "images" && <ImageConverterPanel />}
          {activeTool === "compress" && <CompressionPanel />}
          {activeTool === "pdf-merge" && <PdfMergePanel />}
          {activeTool === "pdf-split" && <PdfSplitPanel />}
        </main>

        <footer className="mt-12 text-xs text-slate-400 dark:text-slate-600">
          No files leave your device. FileForge processes everything locally in
          your browser.
        </footer>
      </div>
    </div>
  );
}

export default App;
