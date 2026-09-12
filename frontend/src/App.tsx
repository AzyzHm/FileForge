import { useState } from "react";
import { BackgroundRemovalPanel } from "./components/BackgroundRemovalPanel";
import { CompressionPanel } from "./components/CompressionPanel";
import { ImageConverterPanel } from "./components/ImageConverterPanel";
import { PdfCompressionPanel } from "./components/PdfCompressionPanel";
import { PdfMergePanel } from "./components/PdfMergePanel";
import { PdfSplitPanel } from "./components/PdfSplitPanel";
import { PdfToWordPanel } from "./components/PdfToWordPanel";
import { ToolTabs } from "./components/ToolTabs";
import { WordToPdfPanel } from "./components/WordToPdfPanel";

type ToolId =
  | "images"
  | "compress"
  | "remove-bg"
  | "pdf-merge"
  | "pdf-split"
  | "word-to-pdf"
  | "pdf-to-word"
  | "compress-pdf";

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "images", label: "Images" },
  { id: "compress", label: "Compress" },
  { id: "remove-bg", label: "Remove BG" },
  { id: "pdf-merge", label: "Merge PDFs" },
  { id: "pdf-split", label: "Split PDF" },
  { id: "word-to-pdf", label: "Word to PDF" },
  { id: "pdf-to-word", label: "PDF to Word" },
  { id: "compress-pdf", label: "Compress PDF" },
];

const DESCRIPTIONS: Record<ToolId, string> = {
  images:
    "Convert images between PNG, JPG, and SVG. Everything runs in your browser, nothing is uploaded anywhere.",
  compress:
    "Shrink PNG and JPG file sizes. Everything runs in your browser, nothing is uploaded anywhere.",
  "remove-bg":
    "Remove the background from a photo using an on-device AI model. Everything runs in your browser, nothing is uploaded anywhere.",
  "pdf-merge":
    "Combine PDFs into one file, in the order you choose. Everything runs in your browser, nothing is uploaded anywhere.",
  "pdf-split":
    "Split a PDF into one file per page. Everything runs in your browser, nothing is uploaded anywhere.",
  "word-to-pdf":
    "Convert a Word document to PDF using the FileForge server, for accurate, LibreOffice-rendered output.",
  "pdf-to-word":
    "Convert a PDF into an editable Word document, using the FileForge server.",
  "compress-pdf":
    "Shrink a PDF's file size using the FileForge server, with a choice of quality presets.",
};

const FOOTER_NOTES: Record<ToolId, string> = {
  images:
    "No files leave your device. FileForge processes everything locally in your browser.",
  compress:
    "No files leave your device. FileForge processes everything locally in your browser.",
  "remove-bg":
    "No files leave your device. FileForge processes everything locally in your browser.",
  "pdf-merge":
    "No files leave your device. FileForge processes everything locally in your browser.",
  "pdf-split":
    "No files leave your device. FileForge processes everything locally in your browser.",
  "word-to-pdf":
    "This tool sends your file to the FileForge server for conversion. It's deleted immediately afterward and never stored.",
  "pdf-to-word":
    "This tool sends your file to the FileForge server for conversion. It's deleted immediately afterward and never stored.",
  "compress-pdf":
    "This tool sends your file to the FileForge server for conversion. It's deleted immediately afterward and never stored.",
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
          {activeTool === "remove-bg" && <BackgroundRemovalPanel />}
          {activeTool === "pdf-merge" && <PdfMergePanel />}
          {activeTool === "pdf-split" && <PdfSplitPanel />}
          {activeTool === "word-to-pdf" && <WordToPdfPanel />}
          {activeTool === "pdf-to-word" && <PdfToWordPanel />}
          {activeTool === "compress-pdf" && <PdfCompressionPanel />}
        </main>

        <footer className="mt-12 text-xs text-slate-400 dark:text-slate-600">
          {FOOTER_NOTES[activeTool]}
        </footer>
      </div>
    </div>
  );
}

export default App;
