import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  buildRangeFileName,
  buildSplitFileName,
  getPdfPageCount,
  isPdfFile,
  mergePdfs,
  splitPdf,
  splitPdfByRanges,
} from "../../src/services/pdfService";

async function makePdfFile(name: string, pageCount: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    doc.addPage([200, 200]);
  }
  const bytes = await doc.save();
  return new File([bytes], name, { type: "application/pdf" });
}

describe("isPdfFile", () => {
  it("detects PDFs from MIME type", () => {
    const file = new File(["stub"], "doc.pdf", { type: "application/pdf" });
    expect(isPdfFile(file)).toBe(true);
  });

  it("falls back to the .pdf extension when the MIME type is missing", () => {
    const file = new File(["stub"], "doc.pdf", { type: "" });
    expect(isPdfFile(file)).toBe(true);
  });

  it("returns false for non-PDF files", () => {
    const file = new File(["stub"], "photo.png", { type: "image/png" });
    expect(isPdfFile(file)).toBe(false);
  });
});

describe("getPdfPageCount", () => {
  it("returns the number of pages in the document", async () => {
    const file = await makePdfFile("report.pdf", 7);
    await expect(getPdfPageCount(file)).resolves.toBe(7);
  });

  it("surfaces a helpful error for a corrupted file", async () => {
    const badFile = new File(["not-a-pdf"], "broken.pdf", {
      type: "application/pdf",
    });
    await expect(getPdfPageCount(badFile)).rejects.toThrow(/could not be read/);
  });
});

describe("buildSplitFileName", () => {
  it("pads page numbers to match the width of the total page count", () => {
    expect(buildSplitFileName("report.pdf", 3, 12)).toBe("report-page-03.pdf");
  });

  it("strips the .pdf extension before appending the page suffix", () => {
    expect(buildSplitFileName("report.pdf", 1, 5)).toBe("report-page-1.pdf");
  });
});

describe("buildRangeFileName", () => {
  it("uses a single page suffix when start and end match", () => {
    expect(buildRangeFileName("report.pdf", { start: 4, end: 4 })).toBe(
      "report-page-4.pdf",
    );
  });

  it("uses a range suffix when start and end differ", () => {
    expect(buildRangeFileName("report.pdf", { start: 1, end: 3 })).toBe(
      "report-pages-1-3.pdf",
    );
  });
});

describe("mergePdfs", () => {
  it("rejects fewer than two files", async () => {
    const file = await makePdfFile("a.pdf", 1);
    await expect(mergePdfs([file])).rejects.toThrow(/at least two/);
  });

  it("combines pages from every file in order", async () => {
    const a = await makePdfFile("a.pdf", 2);
    const b = await makePdfFile("b.pdf", 3);

    const blob = await mergePdfs([a, b]);
    const merged = await PDFDocument.load(await blob.arrayBuffer());

    expect(merged.getPageCount()).toBe(5);
  });

  it("surfaces a helpful error for a corrupted file", async () => {
    const goodFile = await makePdfFile("a.pdf", 1);
    const badFile = new File(["not-a-pdf"], "b.pdf", {
      type: "application/pdf",
    });

    await expect(mergePdfs([goodFile, badFile])).rejects.toThrow(
      /could not be read/,
    );
  });
});

describe("splitPdf", () => {
  it("rejects a single-page PDF", async () => {
    const file = await makePdfFile("single.pdf", 1);
    await expect(splitPdf(file)).rejects.toThrow(/only has one page/);
  });

  it("produces one single-page PDF per page, named after the source file", async () => {
    const file = await makePdfFile("multi.pdf", 3);

    const pages = await splitPdf(file);
    expect(pages).toHaveLength(3);

    for (const page of pages) {
      const doc = await PDFDocument.load(await page.blob.arrayBuffer());
      expect(doc.getPageCount()).toBe(1);
    }

    expect(pages.map((page) => page.fileName)).toEqual([
      "multi-page-1.pdf",
      "multi-page-2.pdf",
      "multi-page-3.pdf",
    ]);
  });

  it("surfaces a helpful error for a corrupted file", async () => {
    const badFile = new File(["not-a-pdf"], "broken.pdf", {
      type: "application/pdf",
    });
    await expect(splitPdf(badFile)).rejects.toThrow(/could not be read/);
  });
});

describe("splitPdfByRanges", () => {
  it("produces one PDF per range, each with the requested page count", async () => {
    const file = await makePdfFile("report.pdf", 10);

    const results = await splitPdfByRanges(file, [
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 10 },
    ]);
    expect(results).toHaveLength(3);

    const pageCounts = await Promise.all(
      results.map(async (result) => {
        const doc = await PDFDocument.load(await result.blob.arrayBuffer());
        return doc.getPageCount();
      }),
    );
    expect(pageCounts).toEqual([3, 1, 3]);

    expect(results.map((result) => result.fileName)).toEqual([
      "report-pages-1-3.pdf",
      "report-page-5.pdf",
      "report-pages-8-10.pdf",
    ]);
  });

  it("rejects an empty range list", async () => {
    const file = await makePdfFile("report.pdf", 5);
    await expect(splitPdfByRanges(file, [])).rejects.toThrow(
      /at least one page range/,
    );
  });

  it("rejects a range where the end comes before the start", async () => {
    const file = await makePdfFile("report.pdf", 5);
    await expect(
      splitPdfByRanges(file, [{ start: 4, end: 2 }]),
    ).rejects.toThrow(/not a valid page range/);
  });

  it("rejects a range that exceeds the document's page count", async () => {
    const file = await makePdfFile("report.pdf", 5);
    await expect(
      splitPdfByRanges(file, [{ start: 1, end: 20 }]),
    ).rejects.toThrow(/beyond the document/);
  });

  it("surfaces a helpful error for a corrupted file", async () => {
    const badFile = new File(["not-a-pdf"], "broken.pdf", {
      type: "application/pdf",
    });
    await expect(
      splitPdfByRanges(badFile, [{ start: 1, end: 1 }]),
    ).rejects.toThrow(/could not be read/);
  });
});
