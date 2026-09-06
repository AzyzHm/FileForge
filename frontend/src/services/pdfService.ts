import { PDFDocument } from "pdf-lib";

const PDF_MIME = "application/pdf";
const PDF_EXTENSION = ".pdf";

export interface SplitPage {
  blob: Blob;
  fileName: string;
  label: string;
}

export interface PageRange {
  start: number;
  end: number;
}

export function isPdfFile(file: File): boolean {
  if (file.type.toLowerCase() === PDF_MIME) return true;
  return file.name.toLowerCase().endsWith(PDF_EXTENSION);
}

export function stripPdfExtension(fileName: string): string {
  return fileName.toLowerCase().endsWith(PDF_EXTENSION)
    ? fileName.slice(0, -PDF_EXTENSION.length)
    : fileName;
}

export function buildSplitFileName(
  originalName: string,
  pageNumber: number,
  totalPages: number,
): string {
  const baseName = stripPdfExtension(originalName);
  const digits = String(totalPages).length;
  const padded = String(pageNumber).padStart(digits, "0");
  return `${baseName}-page-${padded}${PDF_EXTENSION}`;
}

export function buildRangeFileName(
  originalName: string,
  range: PageRange,
): string {
  const baseName = stripPdfExtension(originalName);
  return range.start === range.end
    ? `${baseName}-page-${range.start}${PDF_EXTENSION}`
    : `${baseName}-pages-${range.start}-${range.end}${PDF_EXTENSION}`;
}

export function parsePageRanges(input: string, pageCount: number): PageRange[] {
  const tokens = input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    throw new Error("Enter at least one page or page range.");
  }

  return tokens.map((token) => {
    const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
    const singleMatch = token.match(/^(\d+)$/);

    let start: number;
    let end: number;

    if (rangeMatch) {
      start = Number(rangeMatch[1]);
      end = Number(rangeMatch[2]);
    } else if (singleMatch) {
      start = Number(singleMatch[1]);
      end = start;
    } else {
      throw new Error(`"${token}" is not a valid page or page range.`);
    }

    if (start < 1 || end < start) {
      throw new Error(`"${token}" is not a valid page or page range.`);
    }

    if (end > pageCount) {
      throw new Error(
        `"${token}" goes beyond the document's ${pageCount} pages.`,
      );
    }

    return { start, end };
  });
}

async function loadPdf(file: File): Promise<PDFDocument> {
  const bytes = await file.arrayBuffer();
  try {
    return await PDFDocument.load(bytes);
  } catch {
    throw new Error(
      `"${file.name}" could not be read. It may be corrupted or password protected.`,
    );
  }
}

function toBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: PDF_MIME });
}

export async function mergePdfs(files: File[]): Promise<Blob> {
  if (files.length < 2) {
    throw new Error("Add at least two PDFs to merge.");
  }

  const mergedDoc = await PDFDocument.create();

  for (const file of files) {
    const sourceDoc = await loadPdf(file);
    const copiedPages = await mergedDoc.copyPages(
      sourceDoc,
      sourceDoc.getPageIndices(),
    );
    copiedPages.forEach((page) => mergedDoc.addPage(page));
  }

  const mergedBytes = await mergedDoc.save();
  return toBlob(mergedBytes);
}

export async function splitPdf(file: File): Promise<SplitPage[]> {
  const sourceDoc = await loadPdf(file);
  const pageCount = sourceDoc.getPageCount();

  if (pageCount < 2) {
    throw new Error(
      `"${file.name}" only has one page, there is nothing to split.`,
    );
  }

  const results: SplitPage[] = [];

  for (let index = 0; index < pageCount; index++) {
    const pageDoc = await PDFDocument.create();
    const [copiedPage] = await pageDoc.copyPages(sourceDoc, [index]);
    pageDoc.addPage(copiedPage);
    const pageBytes = await pageDoc.save();

    results.push({
      blob: toBlob(pageBytes),
      fileName: buildSplitFileName(file.name, index + 1, pageCount),
      label: `Page ${index + 1}`,
    });
  }

  return results;
}

export async function splitPdfByRanges(
  file: File,
  rangesInput: string,
): Promise<SplitPage[]> {
  const sourceDoc = await loadPdf(file);
  const pageCount = sourceDoc.getPageCount();
  const ranges = parsePageRanges(rangesInput, pageCount);

  const results: SplitPage[] = [];

  for (const range of ranges) {
    const pageIndices: number[] = [];
    for (let page = range.start; page <= range.end; page++) {
      pageIndices.push(page - 1);
    }

    const rangeDoc = await PDFDocument.create();
    const copiedPages = await rangeDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((page) => rangeDoc.addPage(page));
    const rangeBytes = await rangeDoc.save();

    results.push({
      blob: toBlob(rangeBytes),
      fileName: buildRangeFileName(file.name, range),
      label:
        range.start === range.end
          ? `Page ${range.start}`
          : `Pages ${range.start}-${range.end}`,
    });
  }

  return results;
}
