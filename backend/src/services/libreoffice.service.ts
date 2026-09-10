import { promisify } from "util";
import type { ExecFileOptions } from "child_process";
import { convertWithOptions } from "libreoffice-convert";
import { env } from "../config/env";
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from "../exceptions/http-exceptions";

const convertWithOptionsAsync = promisify(convertWithOptions);

type ConvertOptions = Parameters<typeof convertWithOptions>[3];
type ConvertOptionsWithExec = ConvertOptions & {
  execOptions?: ExecFileOptions;
};

const SOFFICE_NOT_FOUND_MESSAGE = "Could not find soffice binary";

export interface LibreOfficeConvertInput {
  document: Buffer;
  fileName: string;
  targetFormat: string;
  additionalArgs?: string[];
  timeoutMs?: number;
}

function isTimeoutError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "killed" in err &&
    (err as { killed?: boolean }).killed === true
  );
}

function isSofficeNotFoundError(err: unknown): boolean {
  return (
    err instanceof Error && err.message.includes(SOFFICE_NOT_FOUND_MESSAGE)
  );
}

export async function convertWithLibreOffice({
  document,
  fileName,
  targetFormat,
  additionalArgs = [],
  timeoutMs = env.libreofficeTimeoutMs,
}: LibreOfficeConvertInput): Promise<Buffer> {
  const sofficeBinaryPaths = env.libreofficeBinPath
    ? [env.libreofficeBinPath]
    : [];

  const options: ConvertOptionsWithExec = {
    fileName,
    sofficeBinaryPaths,
    sofficeAdditionalArgs: additionalArgs,
    execOptions: { timeout: timeoutMs },
  };

  try {
    return await convertWithOptionsAsync(
      document,
      targetFormat,
      undefined,
      options,
    );
  } catch (err) {
    if (isTimeoutError(err)) {
      throw new GatewayTimeoutException(
        `LibreOffice conversion timed out after ${timeoutMs}ms`,
      );
    }

    if (isSofficeNotFoundError(err)) {
      throw new ServiceUnavailableException(
        "LibreOffice is not installed or its binary path is misconfigured",
      );
    }

    throw err;
  }
}
