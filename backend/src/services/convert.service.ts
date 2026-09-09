import os from "os";
import path from "path";
import crypto from "crypto";
import { promises as fs } from "fs";

export interface DummyConversionResult {
  outputPath: string;
  outputFilename: string;
  inputBytes: number;
  outputBytes: number;
}

const SIMULATED_WORK_MS = 50;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function dummyConvert(
  inputPath: string,
  originalFilename: string,
): Promise<DummyConversionResult> {
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
