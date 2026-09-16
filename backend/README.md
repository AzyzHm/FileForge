# FileForge Backend

Express API for the conversions a browser can't do on its own: Word to PDF and PDF to Word through LibreOffice, and PDF compression through Ghostscript. Everything else in FileForge runs client-side; this service only exists for the handful of features that need a real desktop conversion engine.

No database, no file storage, no accounts. Uploaded files land in the OS temp directory for the duration of a single request and are deleted immediately after the response is sent, whether the conversion succeeds or fails.

---

## Requirements

- Node.js 22 or later (CI runs on Node 24)
- [LibreOffice](https://www.libreoffice.org/) installed locally, with `soffice` reachable either on `PATH` or via `LIBREOFFICE_BIN_PATH`
- [Ghostscript](https://www.ghostscript.com/) installed locally, with `gs` (Linux/macOS) or `gswin64c`/`gswin32c` (Windows) reachable either on `PATH` or via `GHOSTSCRIPT_BIN_PATH`

Both binaries are invoked directly as external processes. Neither is an npm dependency, so nothing gets auto-downloaded during `npm install`. If a binary is missing or misconfigured, the affected endpoints respond with `503 Service Unavailable` instead of crashing the server.

---

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The dev server runs on `http://localhost:3000` by default, with hot reload via `tsx watch`.

### On Windows

Set `LIBREOFFICE_BIN_PATH` and `GHOSTSCRIPT_BIN_PATH` explicitly in `.env`. Windows installs LibreOffice and Ghostscript into `Program Files` and does not reliably add either to `PATH`, and Ghostscript's install folder is version-numbered (for example `C:\Program Files\gs\gs10.05.0\bin\gswin64c.exe`), so autodetection is not something to rely on here.

npm scripts that set inline environment variables (the test scripts below) use `cross-env`, since `cmd.exe` and PowerShell don't support the `VAR=value` prefix syntax that `p-queue`'s dynamic import needs at test time.

---

## Environment variables

| Variable                 | Default            | Description                                                                                                             |
| ------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `development`      | `development`, `production`, or `test`                                                                                  |
| `PORT`                   | `3000`             | Port the server listens on                                                                                              |
| `CORS_ORIGIN`            | `*`                | Allowed origin for CORS. Set this to the frontend's URL in production                                                   |
| `LOG_LEVEL`              | `info`             | Pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`                                            |
| `MAX_UPLOAD_BYTES`       | `52428800` (50 MB) | Maximum accepted upload size. Oversized uploads get a `413`                                                             |
| `LIBREOFFICE_BIN_PATH`   | unset              | Absolute path to the `soffice` binary. Leave unset to use the OS-default locations `libreoffice-convert` already checks |
| `LIBREOFFICE_TIMEOUT_MS` | `60000`            | How long a single LibreOffice conversion is allowed to run before it's killed                                           |
| `GHOSTSCRIPT_BIN_PATH`   | unset              | Absolute path to the Ghostscript binary. Leave unset to invoke it by command name via `PATH`                            |
| `GHOSTSCRIPT_TIMEOUT_MS` | `60000`            | How long a single Ghostscript conversion is allowed to run before it's killed                                           |

See `.env.example` for the same list with inline comments.

> **`CORS_ORIGIN` must match the browser's `Origin` header exactly, including no trailing slash.** The `cors` package doesn't normalize this value; it echoes back whatever string is set. A value like `http://localhost:5173/` (trailing slash) does not match the `http://localhost:5173` a browser actually sends, so the browser will reject the response even though the server processed it. This means the three server-backed frontend tools (Word to PDF, PDF to Word, Compress PDF) will look like they're failing, when the real problem is a mismatched `CORS_ORIGIN` value.

---

## API

All conversion endpoints live under `/api/v1/convert` and expect a `multipart/form-data` upload with the file in a field named `file`. On success they respond with the converted file as a binary download and a `Content-Disposition` header carrying the output filename. On failure they respond with JSON:

```json
{ "status": "error", "message": "Human-readable description" }
```

In non-production environments, error responses also include a `stack` field.

| Method | Path                           | Accepts                         | Notes                                                                                                                                                         |
| ------ | ------------------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/health`                      | —                               | Returns `{ "status": "ok" }`. No queue or binary checks                                                                                                       |
| `POST` | `/api/v1/convert/word-to-pdf`  | `.doc`, `.docx`, `.odt`, `.rtf` | Converts via LibreOffice                                                                                                                                      |
| `POST` | `/api/v1/convert/pdf-to-word`  | `.pdf`                          | Converts via LibreOffice's `writer_pdf_import` filter. See the [known limitation](../README.md#-known-limitations) with right-to-left and complex-script text |
| `POST` | `/api/v1/convert/compress-pdf` | `.pdf`                          | Also accepts a `quality` form field: `screen`, `ebook` (default), `printer`, or `prepress`. Converts via Ghostscript                                          |
| `POST` | `/api/v1/convert/dummy`        | any                             | Echoes back file metadata as plain text. Used to exercise the upload/queue/cleanup pipeline without a real conversion engine                                  |

Common error statuses: `400` (bad input, such as an invalid quality value), `413` (file over `MAX_UPLOAD_BYTES`), `415` (wrong file extension for the endpoint), `503` (LibreOffice or Ghostscript binary not found), `504` (conversion exceeded its timeout).

### Request flow

1. `uploadSingleFile` (multer, disk storage) writes the upload to the OS temp directory and enforces `MAX_UPLOAD_BYTES`.
2. The controller hands the file to `enqueueConversion`, a single-concurrency `p-queue` shared by every conversion endpoint, so only one LibreOffice or Ghostscript process runs at a time.
3. The conversion service runs, writes its output to a second temp file, and returns its path.
4. The controller streams that file back with `res.download`, then deletes both the input and output temp files regardless of whether the download succeeded.

---

## Testing

```bash
npm test              # everything
npm run test:unit     # unit tests only
npm run test:integration
npm run test:cov      # with coverage
```

Unit and integration tests run as separate Jest projects (see `jest.config.js`). Integration tests that exercise real LibreOffice or Ghostscript conversions check for the binary first (`tests/setup/soffice-availability.ts`, `tests/setup/gs-availability.ts`) and skip cleanly rather than fail when it isn't installed, so CI and contributors without either binary still get a passing suite for everything else.

---

## Scripts

| Script                            | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `npm run dev`                     | Start the dev server with hot reload |
| `npm run build`                   | Compile TypeScript to `dist/`        |
| `npm start`                       | Run the compiled server from `dist/` |
| `npm run lint` / `lint:fix`       | ESLint                               |
| `npm run typecheck`               | `tsc --noEmit`                       |
| `npm run format` / `format:check` | Prettier                             |

---

## Project structure

```
backend/
├── src/
│   ├── api/v1/
│   │   ├── controllers/     # Request handling, delegates to services
│   │   └── routes/          # Route definitions
│   ├── config/              # Env parsing, logger setup
│   ├── exceptions/          # AppError and HTTP-status-specific subclasses
│   ├── middlewares/         # Upload handling, 404, centralized error formatting
│   ├── services/            # Conversion logic (LibreOffice, Ghostscript), queue
│   ├── utils/                # Small shared helpers (safe file cleanup)
│   ├── app.ts                # Express app assembly
│   └── server.ts             # Process entry point, listens and handles shutdown signals
└── tests/
    ├── setup/                # Jest setup files, binary-availability checks
    ├── unit/                 # Service-level tests
    └── integration/          # Full-request tests via supertest
```