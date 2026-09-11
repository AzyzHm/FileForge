import os from "os";
import path from "path";
import { promises as fs } from "fs";
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from "../../../src/exceptions/http-exceptions";

jest.mock("../../../src/services/libreoffice.service", () => ({
  convertWithLibreOffice: jest.fn(),
}));

jest.mock("../../../src/services/ghostscript.service", () => {
  const actual = jest.requireActual(
    "../../../src/services/ghostscript.service",
  );
  return {
    ...actual,
    compressWithGhostscript: jest.fn(),
  };
});

import { convertWithLibreOffice } from "../../../src/services/libreoffice.service";
import { compressWithGhostscript } from "../../../src/services/ghostscript.service";
import {
  compressPdf,
  convertPdfToWord,
  convertWordToPdf,
  dummyConvert,
} from "../../../src/services/convert.service";

const mockedConvertWithLibreOffice = jest.mocked(convertWithLibreOffice);
const mockedCompressWithGhostscript = jest.mocked(compressWithGhostscript);

describe("convert.service dummyConvert", () => {
  const tmpInputs: string[] = [];
  const tmpOutputs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      [...tmpInputs, ...tmpOutputs].map((filePath) =>
        fs.unlink(filePath).catch(() => undefined),
      ),
    );
    tmpInputs.length = 0;
    tmpOutputs.length = 0;
  });

  it("reads the input file and writes a converted output file to the tmp dir", async () => {
    const inputPath = path.join(
      os.tmpdir(),
      `convert-service-test-${Date.now()}.txt`,
    );
    const inputContent = "hello fileforge";
    await fs.writeFile(inputPath, inputContent, "utf-8");
    tmpInputs.push(inputPath);

    const result = await dummyConvert(inputPath, "original.txt");
    tmpOutputs.push(result.outputPath);

    expect(result.inputBytes).toBe(Buffer.byteLength(inputContent));
    expect(result.outputBytes).toBeGreaterThan(0);
    expect(path.dirname(result.outputPath)).toBe(os.tmpdir());

    const outputContent = await fs.readFile(result.outputPath, "utf-8");
    expect(outputContent).toContain("FileForge dummy conversion");
    expect(outputContent).toContain("original.txt");
    expect(outputContent).toContain(String(inputContent.length));
  });

  it("rejects when the input file does not exist", async () => {
    const missingPath = path.join(
      os.tmpdir(),
      `does-not-exist-${Date.now()}.txt`,
    );
    await expect(dummyConvert(missingPath, "missing.txt")).rejects.toThrow();
  });
});

describe("convert.service convertWordToPdf", () => {
  const tmpInputs: string[] = [];
  const tmpOutputs: string[] = [];

  beforeEach(() => {
    mockedConvertWithLibreOffice.mockReset();
  });

  afterEach(async () => {
    await Promise.all(
      [...tmpInputs, ...tmpOutputs].map((filePath) =>
        fs.unlink(filePath).catch(() => undefined),
      ),
    );
    tmpInputs.length = 0;
    tmpOutputs.length = 0;
  });

  it("rejects unsupported extensions before touching the filesystem", async () => {
    await expect(
      convertWordToPdf("/does/not/matter.exe", "malicious.exe"),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(mockedConvertWithLibreOffice).not.toHaveBeenCalled();
  });

  it.each([".doc", ".docx", ".odt", ".rtf"])(
    "accepts %s files and converts them to pdf",
    async (extension) => {
      const inputPath = path.join(
        os.tmpdir(),
        `convert-service-word-${Date.now()}${extension}`,
      );
      await fs.writeFile(inputPath, "pretend word document bytes");
      tmpInputs.push(inputPath);

      const convertedBuffer = Buffer.from("pretend pdf bytes");
      mockedConvertWithLibreOffice.mockResolvedValue(convertedBuffer);

      const result = await convertWordToPdf(inputPath, `original${extension}`);
      tmpOutputs.push(result.outputPath);

      expect(mockedConvertWithLibreOffice).toHaveBeenCalledWith(
        expect.objectContaining({
          fileName: `original${extension}`,
          targetFormat: "pdf",
        }),
      );
      expect(result.outputFilename.endsWith(".pdf")).toBe(true);
      expect(result.outputBytes).toBe(convertedBuffer.byteLength);

      const written = await fs.readFile(result.outputPath);
      expect(written.equals(convertedBuffer)).toBe(true);
    },
  );

  it("propagates errors thrown by the LibreOffice service", async () => {
    const inputPath = path.join(
      os.tmpdir(),
      `convert-service-word-err-${Date.now()}.docx`,
    );
    await fs.writeFile(inputPath, "pretend word document bytes");
    tmpInputs.push(inputPath);

    mockedConvertWithLibreOffice.mockRejectedValue(
      new Error("soffice exploded"),
    );

    await expect(convertWordToPdf(inputPath, "original.docx")).rejects.toThrow(
      "soffice exploded",
    );
  });
});

describe("convert.service convertPdfToWord", () => {
  const tmpInputs: string[] = [];
  const tmpOutputs: string[] = [];

  beforeEach(() => {
    mockedConvertWithLibreOffice.mockReset();
  });

  afterEach(async () => {
    await Promise.all(
      [...tmpInputs, ...tmpOutputs].map((filePath) =>
        fs.unlink(filePath).catch(() => undefined),
      ),
    );
    tmpInputs.length = 0;
    tmpOutputs.length = 0;
  });

  it("rejects non-pdf extensions before touching the filesystem", async () => {
    await expect(
      convertPdfToWord("/does/not/matter.docx", "original.docx"),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(mockedConvertWithLibreOffice).not.toHaveBeenCalled();
  });

  it("converts pdf input to docx using the writer_pdf_import filter", async () => {
    const inputPath = path.join(
      os.tmpdir(),
      `convert-service-pdf-${Date.now()}.pdf`,
    );
    await fs.writeFile(inputPath, "pretend pdf bytes");
    tmpInputs.push(inputPath);

    const convertedBuffer = Buffer.from("pretend docx bytes");
    mockedConvertWithLibreOffice.mockResolvedValue(convertedBuffer);

    const result = await convertPdfToWord(inputPath, "original.pdf");
    tmpOutputs.push(result.outputPath);

    expect(mockedConvertWithLibreOffice).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "original.pdf",
        targetFormat: "docx",
        additionalArgs: ["--infilter=writer_pdf_import"],
      }),
    );
    expect(result.outputFilename.endsWith(".docx")).toBe(true);
    expect(result.outputBytes).toBe(convertedBuffer.byteLength);
  });
});

describe("convert.service compressPdf", () => {
  const tmpInputs: string[] = [];
  const tmpOutputs: string[] = [];

  beforeEach(() => {
    mockedCompressWithGhostscript.mockReset();
  });

  afterEach(async () => {
    await Promise.all(
      [...tmpInputs, ...tmpOutputs].map((filePath) =>
        fs.unlink(filePath).catch(() => undefined),
      ),
    );
    tmpInputs.length = 0;
    tmpOutputs.length = 0;
  });

  it("rejects non-pdf extensions before touching the filesystem", async () => {
    await expect(
      compressPdf("/does/not/matter.docx", "original.docx"),
    ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
    expect(mockedCompressWithGhostscript).not.toHaveBeenCalled();
  });

  it("rejects an invalid quality option before touching the filesystem", async () => {
    await expect(
      compressPdf("/does/not/matter.pdf", "original.pdf", {
        quality: "ultra",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockedCompressWithGhostscript).not.toHaveBeenCalled();
  });

  it("defaults to ebook quality when none is provided", async () => {
    const inputPath = path.join(
      os.tmpdir(),
      `convert-service-compress-${Date.now()}.pdf`,
    );
    await fs.writeFile(inputPath, "pretend original pdf bytes");
    tmpInputs.push(inputPath);

    mockedCompressWithGhostscript.mockImplementation(async ({ outputPath }) => {
      await fs.writeFile(outputPath, "pretend smaller pdf bytes");
    });

    const result = await compressPdf(inputPath, "original.pdf");
    tmpOutputs.push(result.outputPath);

    expect(mockedCompressWithGhostscript).toHaveBeenCalledWith(
      expect.objectContaining({ inputPath, quality: "ebook" }),
    );
    expect(result.outputFilename.endsWith(".pdf")).toBe(true);
    expect(result.inputBytes).toBe(
      Buffer.byteLength("pretend original pdf bytes"),
    );
    expect(result.outputBytes).toBe(
      Buffer.byteLength("pretend smaller pdf bytes"),
    );
  });

  it.each(["screen", "ebook", "printer", "prepress"] as const)(
    "accepts the %s quality option and forwards it to ghostscript",
    async (quality) => {
      const inputPath = path.join(
        os.tmpdir(),
        `convert-service-compress-${quality}-${Date.now()}.pdf`,
      );
      await fs.writeFile(inputPath, "pretend original pdf bytes");
      tmpInputs.push(inputPath);

      mockedCompressWithGhostscript.mockImplementation(
        async ({ outputPath }) => {
          await fs.writeFile(outputPath, "pretend smaller pdf bytes");
        },
      );

      const result = await compressPdf(inputPath, "original.pdf", {
        quality,
      });
      tmpOutputs.push(result.outputPath);

      expect(mockedCompressWithGhostscript).toHaveBeenCalledWith(
        expect.objectContaining({ quality }),
      );
    },
  );

  it("propagates errors thrown by the Ghostscript service", async () => {
    const inputPath = path.join(
      os.tmpdir(),
      `convert-service-compress-err-${Date.now()}.pdf`,
    );
    await fs.writeFile(inputPath, "pretend original pdf bytes");
    tmpInputs.push(inputPath);

    mockedCompressWithGhostscript.mockRejectedValue(new Error("gs exploded"));

    await expect(compressPdf(inputPath, "original.pdf")).rejects.toThrow(
      "gs exploded",
    );
  });
});
