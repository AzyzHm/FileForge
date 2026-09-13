import os from "os";
import path from "path";
import { promises as fs } from "fs";
import request from "supertest";
import { createApp } from "../../src/app";
import { isSofficeAvailable } from "../setup/soffice-availability";
import { isGhostscriptAvailable } from "../setup/gs-availability";

const FIXTURES_DIR = path.join(__dirname, "..", "fixtures");
const SAMPLE_DOCX = path.join(FIXTURES_DIR, "sample.docx");
const SAMPLE_PDF = path.join(FIXTURES_DIR, "sample.pdf");
const SAMPLE_TXT = path.join(FIXTURES_DIR, "sample.txt");
const SAMPLE_HEAVY_PDF = path.join(FIXTURES_DIR, "sample-heavy.pdf");

const LIBREOFFICE_CONVERSION_TIMEOUT_MS = 30_000;
const GHOSTSCRIPT_CONVERSION_TIMEOUT_MS = 30_000;

function bufferParser(
  res: NodeJS.ReadableStream,
  callback: (err: Error | null, body: Buffer) => void,
): void {
  const chunks: Buffer[] = [];
  res.on("data", (chunk: Buffer) => chunks.push(chunk));
  res.on("end", () => callback(null, Buffer.concat(chunks)));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilDeleted(
  filePath: string,
  timeoutMs = 1000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fs.access(filePath);
      await wait(20);
    } catch {
      return true;
    }
  }
  return false;
}

describe("POST /api/v1/convert/dummy", () => {
  it("converts an uploaded file and streams the result back", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", Buffer.from("hello fileforge"), "sample.txt");

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.text).toContain("FileForge dummy conversion");
    expect(response.text).toContain("sample.txt");
  });

  it("rejects a request with no file attached", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/convert/dummy");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects a file larger than the configured upload cap with a 413", async () => {
    const app = createApp();
    const oversizedBuffer = Buffer.alloc(2 * 1024 * 1024, "x");

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", oversizedBuffer, "too-big.bin");

    expect(response.status).toBe(413);
    expect(response.body.status).toBe("error");
  });

  it("deletes both the uploaded input and generated output from /tmp after responding", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", Buffer.from("cleanup check"), "cleanup.txt");

    expect(response.status).toBe(200);

    const disposition = response.headers["content-disposition"] as string;
    const match = /filename="(.+?)"/.exec(disposition);
    expect(match).not.toBeNull();

    const outputPath = path.join(os.tmpdir(), (match as RegExpExecArray)[1]);

    const wasDeleted = await waitUntilDeleted(outputPath);
    expect(wasDeleted).toBe(true);
  });

  it("rejects an empty (0-byte) file with a 400", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", Buffer.alloc(0), "empty.txt");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects an upload sent under the wrong multipart field name with a 400", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("document", Buffer.from("hello"), "sample.txt");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects more than one file in the same request with a 400", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", Buffer.from("first"), "first.txt")
      .attach("file", Buffer.from("second"), "second.txt");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects other malformed-multipart Multer errors (e.g. an oversized text field) with a 400", async () => {
    const app = createApp();
    const oversizedField = "x".repeat(2 * 1024 * 1024); // over multer's default 1 MB field-value limit

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .field("note", oversizedField)
      .attach("file", Buffer.from("hello"), "sample.txt");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("processes concurrent uploads one at a time through the shared queue", async () => {
    const app = createApp();

    const start = Date.now();

    await Promise.all([
      request(app)
        .post("/api/v1/convert/dummy")
        .attach("file", Buffer.from("a"), "a.txt"),
      request(app)
        .post("/api/v1/convert/dummy")
        .attach("file", Buffer.from("b"), "b.txt"),
    ]);

    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeGreaterThanOrEqual(90);
  });
});

const sofficeAvailable = isSofficeAvailable();
const describeIfSoffice = sofficeAvailable ? describe : describe.skip;

if (!sofficeAvailable) {
  console.warn(
    "Skipping LibreOffice-backed integration tests: no soffice binary found on this machine or via LIBREOFFICE_BIN_PATH.",
  );
}

describeIfSoffice("POST /api/v1/convert/word-to-pdf", () => {
  it(
    "converts a real docx to pdf and streams the result back",
    async () => {
      const app = createApp();
      const docxBuffer = await fs.readFile(SAMPLE_DOCX);

      const response = await request(app)
        .post("/api/v1/convert/word-to-pdf")
        .attach("file", docxBuffer, "sample.docx")
        .buffer(true)
        .parse(bufferParser);

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect((response.body as Buffer).subarray(0, 4).toString("ascii")).toBe(
        "%PDF",
      );
    },
    LIBREOFFICE_CONVERSION_TIMEOUT_MS,
  );

  it("rejects a file with an unsupported extension with a 415", async () => {
    const app = createApp();
    const txtBuffer = await fs.readFile(SAMPLE_TXT);

    const response = await request(app)
      .post("/api/v1/convert/word-to-pdf")
      .attach("file", txtBuffer, "sample.txt");

    expect(response.status).toBe(415);
    expect(response.body.status).toBe("error");
  });

  it("rejects a .docx-named file whose content isn't actually a docx with a 415", async () => {
    const app = createApp();
    const txtBuffer = await fs.readFile(SAMPLE_TXT);

    const response = await request(app)
      .post("/api/v1/convert/word-to-pdf")
      .attach("file", txtBuffer, "renamed.docx");

    expect(response.status).toBe(415);
    expect(response.body.status).toBe("error");
  });

  it(
    "rejects a structurally invalid docx (valid zip signature, not a real document) with a 422",
    async () => {
      const app = createApp();
      // Valid ZIP/OOXML magic bytes so it clears the signature check, but
      // not a real docx internally, so LibreOffice itself rejects it.
      const fakeDocx = Buffer.concat([
        Buffer.from([0x50, 0x4b, 0x03, 0x04]),
        Buffer.from("not actually a valid docx body"),
      ]);

      const response = await request(app)
        .post("/api/v1/convert/word-to-pdf")
        .attach("file", fakeDocx, "corrupt.docx");

      expect(response.status).toBe(422);
      expect(response.body.status).toBe("error");
    },
    LIBREOFFICE_CONVERSION_TIMEOUT_MS,
  );

  it("rejects a request with no file attached", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/convert/word-to-pdf");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it(
    "deletes both the uploaded input and generated output from /tmp after responding",
    async () => {
      const app = createApp();
      const docxBuffer = await fs.readFile(SAMPLE_DOCX);

      const response = await request(app)
        .post("/api/v1/convert/word-to-pdf")
        .attach("file", docxBuffer, "sample.docx");

      expect(response.status).toBe(200);

      const disposition = response.headers["content-disposition"] as string;
      const match = /filename="(.+?)"/.exec(disposition);
      expect(match).not.toBeNull();

      const outputPath = path.join(os.tmpdir(), (match as RegExpExecArray)[1]);

      const wasDeleted = await waitUntilDeleted(outputPath);
      expect(wasDeleted).toBe(true);
    },
    LIBREOFFICE_CONVERSION_TIMEOUT_MS,
  );
});

describeIfSoffice("POST /api/v1/convert/pdf-to-word", () => {
  it(
    "converts a real pdf to docx and streams the result back",
    async () => {
      const app = createApp();
      const pdfBuffer = await fs.readFile(SAMPLE_PDF);

      const response = await request(app)
        .post("/api/v1/convert/pdf-to-word")
        .attach("file", pdfBuffer, "sample.pdf")
        .buffer(true)
        .parse(bufferParser);

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain("attachment");
      expect((response.body as Buffer).subarray(0, 2).toString("ascii")).toBe(
        "PK",
      );
    },
    LIBREOFFICE_CONVERSION_TIMEOUT_MS,
  );

  it("rejects a file with an unsupported extension with a 415", async () => {
    const app = createApp();
    const docxBuffer = await fs.readFile(SAMPLE_DOCX);

    const response = await request(app)
      .post("/api/v1/convert/pdf-to-word")
      .attach("file", docxBuffer, "sample.docx");

    expect(response.status).toBe(415);
    expect(response.body.status).toBe("error");
  });

  it("rejects a .pdf-named file whose content isn't actually a pdf with a 415", async () => {
    const app = createApp();
    const txtBuffer = await fs.readFile(SAMPLE_TXT);

    const response = await request(app)
      .post("/api/v1/convert/pdf-to-word")
      .attach("file", txtBuffer, "renamed.pdf");

    expect(response.status).toBe(415);
    expect(response.body.status).toBe("error");
  });

  it("rejects a request with no file attached", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/convert/pdf-to-word");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });
});

const gsAvailable = isGhostscriptAvailable();
const describeIfGhostscript = gsAvailable ? describe : describe.skip;

if (!gsAvailable) {
  console.warn(
    "Skipping Ghostscript-backed integration tests: no gs binary found on this machine or via GHOSTSCRIPT_BIN_PATH.",
  );
}

describeIfGhostscript("POST /api/v1/convert/compress-pdf", () => {
  it(
    "compresses a real image-heavy pdf and streams back a smaller file",
    async () => {
      const app = createApp();
      const originalBuffer = await fs.readFile(SAMPLE_HEAVY_PDF);

      const response = await request(app)
        .post("/api/v1/convert/compress-pdf")
        .attach("file", originalBuffer, "sample-heavy.pdf")
        .buffer(true)
        .parse(bufferParser);

      expect(response.status).toBe(200);
      expect(response.headers["content-disposition"]).toContain("attachment");
      const compressedBuffer = response.body as Buffer;
      expect(compressedBuffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
      expect(compressedBuffer.byteLength).toBeLessThan(
        originalBuffer.byteLength,
      );
    },
    GHOSTSCRIPT_CONVERSION_TIMEOUT_MS,
  );

  it(
    "honors an explicit quality field on the multipart form",
    async () => {
      const app = createApp();
      const originalBuffer = await fs.readFile(SAMPLE_HEAVY_PDF);

      const response = await request(app)
        .post("/api/v1/convert/compress-pdf")
        .field("quality", "screen")
        .attach("file", originalBuffer, "sample-heavy.pdf")
        .buffer(true)
        .parse(bufferParser);

      expect(response.status).toBe(200);
      const compressedBuffer = response.body as Buffer;
      expect(compressedBuffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
    },
    GHOSTSCRIPT_CONVERSION_TIMEOUT_MS,
  );

  it("rejects an invalid quality field with a 400", async () => {
    const app = createApp();
    const originalBuffer = await fs.readFile(SAMPLE_HEAVY_PDF);

    const response = await request(app)
      .post("/api/v1/convert/compress-pdf")
      .field("quality", "ultra-max")
      .attach("file", originalBuffer, "sample-heavy.pdf");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects a file with an unsupported extension with a 415", async () => {
    const app = createApp();
    const docxBuffer = await fs.readFile(SAMPLE_DOCX);

    const response = await request(app)
      .post("/api/v1/convert/compress-pdf")
      .attach("file", docxBuffer, "sample.docx");

    expect(response.status).toBe(415);
    expect(response.body.status).toBe("error");
  });

  it("rejects a .pdf-named file whose content isn't actually a pdf with a 415", async () => {
    const app = createApp();
    const txtBuffer = await fs.readFile(SAMPLE_TXT);

    const response = await request(app)
      .post("/api/v1/convert/compress-pdf")
      .attach("file", txtBuffer, "renamed.pdf");

    expect(response.status).toBe(415);
    expect(response.body.status).toBe("error");
  });

  it("rejects an empty (0-byte) file with a 400", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/compress-pdf")
      .attach("file", Buffer.alloc(0), "empty.pdf");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects a request with no file attached", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/convert/compress-pdf");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it(
    "deletes both the uploaded input and generated output from /tmp after responding",
    async () => {
      const app = createApp();
      const originalBuffer = await fs.readFile(SAMPLE_HEAVY_PDF);

      const response = await request(app)
        .post("/api/v1/convert/compress-pdf")
        .attach("file", originalBuffer, "sample-heavy.pdf");

      expect(response.status).toBe(200);

      const disposition = response.headers["content-disposition"] as string;
      const match = /filename="(.+?)"/.exec(disposition);
      expect(match).not.toBeNull();

      const outputPath = path.join(os.tmpdir(), (match as RegExpExecArray)[1]);

      const wasDeleted = await waitUntilDeleted(outputPath);
      expect(wasDeleted).toBe(true);
    },
    GHOSTSCRIPT_CONVERSION_TIMEOUT_MS,
  );
});
