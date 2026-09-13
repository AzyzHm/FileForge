# FileForge Frontend

React + TypeScript app, built with Vite. Most of FileForge's tools run entirely in the browser; the three that can't are sent to the [backend](../backend/README.md) and the result is streamed straight back, never stored anywhere.

---

## Requirements

- Node.js 22 or later (CI runs on Node 24)
- The [backend](../backend/README.md) running locally if you want to use the server-backed tools (Word to PDF, PDF to Word, Compress PDF). The rest of the app works without it.

---

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server runs on Vite's default port and prints the local URL to the terminal.

---

## Environment variables

| Variable            | Default                 | Description                                                             |
| ------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `VITE_API_BASE_URL` | `http://localhost:3000` | Base URL of the backend API. Only used by the three server-backed tools |

See `.env.example`.

---

## Tools

**Client-side, nothing leaves the browser:**

- Image conversion (PNG, JPG, SVG) via the Canvas API
- Image compression via `browser-image-compression`
- AI background removal via `@imgly/background-removal` (WASM, downloads a model on first use)
- PDF merge and split via `pdf-lib`

**Server-backed, file is uploaded to the backend and deleted immediately after conversion:**

- Word to PDF
- PDF to Word (see the [known limitation](../README.md#-known-limitations) with right-to-left and complex-script text)
- Compress PDF, with a choice of quality presets

All three server-backed tools go through `src/services/apiClient.ts`, a shared upload/download helper built on axios. It maps common HTTP failures (400, 413, 415, 503, 504) to plain-language error messages and reads the converted filename from the `Content-Disposition` response header.

---

## Testing

```bash
npm test          # run once
npm run test:watch
npm run coverage
```

Tests use Vitest with jsdom. Integration tests for the server-backed tools use MSW to mock real HTTP requests against `apiClient.ts`.

jsdom's `Blob`/`Response` implementation is missing `.stream()`, which MSW needs under Node 22+. `tests/setup/polyfills.ts` patches this using `node:buffer` and `undici`, but only in the test files that actually need real HTTP mocking, imported directly rather than through the global `tests/setup/vitest.setup.ts`. Patching it globally breaks other tests (like `pdfService.test.ts`) that rely on jsdom's native `Blob`/`File`/`FileReader` behavior. If you add a new test that mocks HTTP with MSW, import the polyfill file at the top of that test, not in the global setup.

---

## Scripts

| Script                            | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `npm run dev`                     | Start the dev server                 |
| `npm run build`                   | Typecheck, then build for production |
| `npm run typecheck`               | `tsc -b` with no emit                |
| `npm run lint`                    | ESLint                               |
| `npm run format` / `format:check` | Prettier                             |
| `npm run preview`                 | Preview a production build locally   |

---

## Project structure

```
frontend/
├── src/
│   ├── components/   # UI, one panel + item row per tool
│   ├── hooks/         # Per-tool state and orchestration
│   ├── services/      # Conversion logic: client-side libraries or backend calls
│   ├── types/          # Per-tool TypeScript types
│   ├── utils/           # Small shared helpers
│   └── App.tsx           # Tool tabs, descriptions, and footer notes
└── tests/
    ├── setup/            # Vitest setup, MSW server, HTTP polyfill
    ├── unit/              # Service-level tests
    └── integration/       # Component-level tests via Testing Library
```