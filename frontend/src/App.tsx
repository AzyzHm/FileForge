import { useState } from "react";
import {
  Combine,
  Eraser,
  FileArchive,
  FileInput,
  FileOutput,
  Image as ImageIcon,
  Menu,
  Minimize2,
  Scissors,
  type LucideIcon,
} from "lucide-react";
import { BackgroundRemovalPanel } from "./features/background-removal/BackgroundRemovalPanel";
import { CompressionPanel } from "./features/image-compression/CompressionPanel";
import { IconButton } from "./components/IconButton";
import { ImageConverterPanel } from "./features/image-conversion/ImageConverterPanel";
import { PdfCompressionPanel } from "./features/pdf-compression/PdfCompressionPanel";
import { PdfMergePanel } from "./features/pdf-merge/PdfMergePanel";
import { PdfSplitPanel } from "./features/pdf-split/PdfSplitPanel";
import { PdfToWordPanel } from "./features/pdf-to-word/PdfToWordPanel";
import { Sidebar } from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";
import { WordToPdfPanel } from "./features/word-to-pdf/WordToPdfPanel";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const activeToolMeta = TOOLS.find((tool) => tool.id === activeTool)!;
  const ActiveIcon = activeToolMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <IconButton
              icon={Menu}
              onClick={() => setIsSidebarOpen((open) => !open)}
              aria-label={
                isSidebarOpen ? "Close tools menu" : "Open tools menu"
              }
              className="shrink-0"
            />

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

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        tools={TOOLS}
        activeId={activeTool}
        onSelect={(id) => {
          setActiveTool(id);
          setIsSidebarOpen(false);
        }}
      />

      <div className="mx-auto flex max-w-3xl flex-col px-4 py-6 sm:py-10">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <ActiveIcon
            aria-hidden
            size={16}
            strokeWidth={2.25}
            className="text-brand-600 dark:text-brand-400"
          />
          {activeToolMeta.label}
        </div>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {DESCRIPTIONS[activeTool]}
        </p>

        <main className="flex-1">
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
