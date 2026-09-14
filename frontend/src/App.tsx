import { useState } from "react";
import {
  Combine,
  Eraser,
  FileArchive,
  FileInput,
  FileOutput,
  Image as ImageIcon,
  Minimize2,
  Scissors,
  type LucideIcon,
} from "lucide-react";
import { BackgroundRemovalPanel } from "./components/BackgroundRemovalPanel";
import { CompressionPanel } from "./components/CompressionPanel";
import { ImageConverterPanel } from "./components/ImageConverterPanel";
import { PdfCompressionPanel } from "./components/PdfCompressionPanel";
import { PdfMergePanel } from "./components/PdfMergePanel";
import { PdfSplitPanel } from "./components/PdfSplitPanel";
import { PdfToWordPanel } from "./components/PdfToWordPanel";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
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

const TOOLS: { id: ToolId; label: string; icon: LucideIcon }[] = [
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "compress", label: "Compress", icon: Minimize2 },
  { id: "remove-bg", label: "Remove BG", icon: Eraser },
  { id: "pdf-merge", label: "Merge PDFs", icon: Combine },
  { id: "pdf-split", label: "Split PDF", icon: Scissors },
  { id: "word-to-pdf", label: "Word to PDF", icon: FileOutput },
  { id: "pdf-to-word", label: "PDF to Word", icon: FileInput },
  { id: "compress-pdf", label: "Compress PDF", icon: FileArchive },
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
    "This tool sends your file to the FileForge server for conversion. It's deleted immediately afterward and never stored. PDFs with Arabic, Hebrew, or other right-to-left text may convert into a messy or unstable Word document, a known limitation of the underlying conversion engine.",
  "compress-pdf":
    "This tool sends your file to the FileForge server for conversion. It's deleted immediately afterward and never stored.",
};

function AppShell() {
  const [activeTool, setActiveTool] = useState<ToolId>("images");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/logo.png"
              alt=""
              className="h-8 w-8 shrink-0 rounded-lg shadow-sm"
            />
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                FileForge
              </h1>
              <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">
                Convert files, right in your browser.
              </p>
            </div>
          </div>

          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex max-w-3xl flex-col px-4 py-6 sm:py-10">
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {DESCRIPTIONS[activeTool]}
        </p>

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

function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}

export default App;
