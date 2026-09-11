import { execFile } from "child_process";
import type { ExecFileOptions } from "child_process";
import { env } from "../config/env";
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from "../exceptions/http-exceptions";

function execFileAsync(
  binary: string,
  args: string[],
  options: ExecFileOptions,
): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(binary, args, options, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export type GhostscriptQuality = "screen" | "ebook" | "printer" | "prepress";

export const GHOSTSCRIPT_QUALITIES: readonly GhostscriptQuality[] = [
  "screen",
  "ebook",
  "printer",
  "prepress",
];

export interface GhostscriptCompressInput {
  inputPath: string;
  outputPath: string;
  quality: GhostscriptQuality;
  timeoutMs?: number;
}

const COMPATIBILITY_LEVEL = "1.4";

function resolveBinaryCandidates(): string[] {
  if (env.ghostscriptBinPath) {
    return [env.ghostscriptBinPath];
  }

  if (process.platform === "win32") {
    return ["gswin64c", "gswin32c"];
  }

  return ["gs"];
}

function buildArgs(input: GhostscriptCompressInput): string[] {
  return [
    "-dSAFER",
    "-sDEVICE=pdfwrite",
    `-dCompatibilityLevel=${COMPATIBILITY_LEVEL}`,
    `-dPDFSETTINGS=/${input.quality}`,
    "-dNOPAUSE",
    "-dBATCH",
    "-dQUIET",
    `-sOutputFile=${input.outputPath}`,
    input.inputPath,
  ];
}

function isBinaryNotFoundError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "ENOENT"
  );
}

function isTimeoutError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "killed" in err &&
    (err as { killed?: boolean }).killed === true
  );
}

export async function compressWithGhostscript(
  input: GhostscriptCompressInput,
): Promise<void> {
  const timeoutMs = input.timeoutMs ?? env.ghostscriptTimeoutMs;
  const args = buildArgs(input);
  const candidates = resolveBinaryCandidates();

  let lastError: unknown;

  for (const binary of candidates) {
    try {
      await execFileAsync(binary, args, { timeout: timeoutMs });
      return;
    } catch (err) {
      lastError = err;

      if (isTimeoutError(err)) {
        throw new GatewayTimeoutException(
          `Ghostscript conversion timed out after ${timeoutMs}ms`,
        );
      }

      if (isBinaryNotFoundError(err)) {
        continue;
      }

      throw err;
    }
  }

  if (isBinaryNotFoundError(lastError)) {
    throw new ServiceUnavailableException(
      "Ghostscript is not installed or its binary path is misconfigured",
    );
  }

  throw lastError;
}
