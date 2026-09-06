import { ImageConverterPanel } from "./components/ImageConverterPanel";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-12">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            FileForge
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Convert images between PNG, JPG, and SVG. Everything runs in your
            browser, nothing is uploaded anywhere.
          </p>
        </header>

        <main className="flex-1">
          <ImageConverterPanel />
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
