import { lazy, Suspense, useState } from "react";
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
import { IconButton } from "./components/IconButton";
import { Sidebar } from "./components/Sidebar";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

const ImageConverterPanel = lazy(() =>
  import("./features/image-conversion/ImageConverterPanel").then((m) => ({
    default: m.ImageConverterPanel,
  })),
);
const CompressionPanel = lazy(() =>
  import("./features/image-compression/CompressionPanel").then((m) => ({
    default: m.CompressionPanel,
  })),
);
const BackgroundRemovalPanel = lazy(() =>
  import("./features/background-removal/BackgroundRemovalPanel").then((m) => ({
    default: m.BackgroundRemovalPanel,
  })),
);
const PdfMergePanel = lazy(() =>
  import("./features/pdf-merge/PdfMergePanel").then((m) => ({
    default: m.PdfMergePanel,
  })),
);
const PdfSplitPanel = lazy(() =>
  import("./features/pdf-split/PdfSplitPanel").then((m) => ({
    default: m.PdfSplitPanel,
  })),
);
const WordToPdfPanel = lazy(() =>
  import("./features/word-to-pdf/WordToPdfPanel").then((m) => ({
    default: m.WordToPdfPanel,
  })),
);
const PdfToWordPanel = lazy(() =>
  import("./features/pdf-to-word/PdfToWordPanel").then((m) => ({
    default: m.PdfToWordPanel,
  })),
);
const PdfCompressionPanel = lazy(() =>
  import("./features/pdf-compression/PdfCompressionPanel").then((m) => ({
    default: m.PdfCompressionPanel,
  })),
);

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

function AppShell() {
  const [activeTool, setActiveTool] = useState<ToolId>("images");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeToolMeta = TOOLS.find((tool) => tool.id === activeTool)!;
  const ActiveIcon = activeToolMeta.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
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
            <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              FileForge
            </h1>
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
        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <ActiveIcon
            aria-hidden
            size={16}
            strokeWidth={2.25}
            className="text-brand-600 dark:text-brand-400"
          />
          {activeToolMeta.label}
        </div>

        <main className="flex-1">
          <Suspense
            fallback={
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Loading tool…
              </p>
            }
          >
            {activeTool === "images" && <ImageConverterPanel />}
            {activeTool === "compress" && <CompressionPanel />}
            {activeTool === "remove-bg" && <BackgroundRemovalPanel />}
            {activeTool === "pdf-merge" && <PdfMergePanel />}
            {activeTool === "pdf-split" && <PdfSplitPanel />}
            {activeTool === "word-to-pdf" && <WordToPdfPanel />}
            {activeTool === "pdf-to-word" && <PdfToWordPanel />}
            {activeTool === "compress-pdf" && <PdfCompressionPanel />}
          </Suspense>
        </main>
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
