import os from "os";
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";
import { convertWithLibreOffice } from "./libreoffice.service";
import {
  compressWithGhostscript,
  GHOSTSCRIPT_QUALITIES,
  GhostscriptQuality,
} from "./ghostscript.service";
import {
  BadRequestException,
  UnsupportedMediaTypeException,
} from "../exceptions/http-exceptions";

export interface ConversionResult {
  outputPath: string;
  outputFilename: string;
  inputBytes: number;
  outputBytes: number;
}

const SIMULATED_WORK_MS = 50;

const WORD_TO_PDF_EXTENSIONS = [".doc", ".docx", ".odt", ".rtf"];
const PDF_TO_WORD_EXTENSIONS = [".pdf"];
const PDF_COMPRESS_EXTENSIONS = [".pdf"];

const PDF_IMPORT_FILTER_ARGS = ["--infilter=writer_pdf_import"];

const DEFAULT_COMPRESS_QUALITY: GhostscriptQuality = "ebook";

export interface CompressPdfOptions {
  quality?: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assertAllowedExtension(
  filename: string,
  allowedExtensions: string[],
): void {
  const extension = path.extname(filename).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    throw new UnsupportedMediaTypeException(
      `Unsupported file type "${extension || "unknown"}". Expected one of: ${allowedExtensions.join(", ")}`,
    );
  }
}

function reserveOutputPath(outputExtension: string): {
  outputPath: string;
  outputFilename: string;
} {
  const outputFilename = `fileforge-out-${Date.now()}-${crypto.randomUUID()}${outputExtension}`;
  const outputPath = path.join(os.tmpdir(), outputFilename);
  return { outputPath, outputFilename };
}

async function writeConversionOutput(
  buffer: Buffer,
  outputExtension: string,
): Promise<{ outputPath: string; outputFilename: string }> {
  const { outputPath, outputFilename } = reserveOutputPath(outputExtension);
  await fs.writeFile(outputPath, buffer);
  return { outputPath, outputFilename };
}

function assertValidQuality(
  quality: string,
): asserts quality is GhostscriptQuality {
  if (!(GHOSTSCRIPT_QUALITIES as readonly string[]).includes(quality)) {
    throw new BadRequestException(
      `Invalid quality "${quality}". Expected one of: ${GHOSTSCRIPT_QUALITIES.join(", ")}`,
    );
  }
}

export async function dummyConvert(
  inputPath: string,
  originalFilename: string,
): Promise<ConversionResult> {
  const inputBuffer = await fs.readFile(inputPath);

  await wait(SIMULATED_WORK_MS);

  const summary = [
    "FileForge dummy conversion",
    `Original file: ${originalFilename}`,
    `Original size: ${inputBuffer.byteLength} bytes`,
    `Processed at: ${new Date().toISOString()}`,
    "",
  ].join("\n");

  const outputFilename = `fileforge-out-${Date.now()}-${crypto.randomUUID()}.txt`;
  const outputPath = path.join(os.tmpdir(), outputFilename);
  await fs.writeFile(outputPath, summary, "utf-8");

  const outputStats = await fs.stat(outputPath);

  return {
    outputPath,
    outputFilename,
    inputBytes: inputBuffer.byteLength,
    outputBytes: outputStats.size,
  };
}

export async function convertWordToPdf(
  inputPath: string,
  originalFilename: string,
): Promise<ConversionResult> {
  assertAllowedExtension(originalFilename, WORD_TO_PDF_EXTENSIONS);

  const inputBuffer = await fs.readFile(inputPath);
  const outputBuffer = await convertWithLibreOffice({
    document: inputBuffer,
    fileName: originalFilename,
    targetFormat: "pdf",
  });

  const { outputPath, outputFilename } = await writeConversionOutput(
    outputBuffer,
    ".pdf",
  );

  return {
    outputPath,
    outputFilename,
    inputBytes: inputBuffer.byteLength,
    outputBytes: outputBuffer.byteLength,
  };
}

export async function compressPdf(
  inputPath: string,
  originalFilename: string,
  options: CompressPdfOptions = {},
): Promise<ConversionResult> {
  assertAllowedExtension(originalFilename, PDF_COMPRESS_EXTENSIONS);

  const quality = options.quality ?? DEFAULT_COMPRESS_QUALITY;
  assertValidQuality(quality);

  const inputStats = await fs.stat(inputPath);
  const { outputPath, outputFilename } = reserveOutputPath(".pdf");

  await compressWithGhostscript({
    inputPath,
    outputPath,
    quality,
  });

  const outputStats = await fs.stat(outputPath);

  return {
    outputPath,
    outputFilename,
    inputBytes: inputStats.size,
    outputBytes: outputStats.size,
  };
}

export async function convertPdfToWord(
  inputPath: string,
  originalFilename: string,
): Promise<ConversionResult> {
  assertAllowedExtension(originalFilename, PDF_TO_WORD_EXTENSIONS);

  const inputBuffer = await fs.readFile(inputPath);
  const outputBuffer = await convertWithLibreOffice({
    document: inputBuffer,
    fileName: originalFilename,
    targetFormat: "docx",
    additionalArgs: PDF_IMPORT_FILTER_ARGS,
  });

  const { outputPath, outputFilename } = await writeConversionOutput(
    outputBuffer,
    ".docx",
  );

  return {
    outputPath,
    outputFilename,
    inputBytes: inputBuffer.byteLength,
    outputBytes: outputBuffer.byteLength,
  };
}
