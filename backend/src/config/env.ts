import "dotenv/config";

type NodeEnv = "development" | "production" | "test";
type LogLevel =
  "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

const NODE_ENVS: readonly NodeEnv[] = ["development", "production", "test"];
const LOG_LEVELS: readonly LogLevel[] = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
];

const DEFAULT_PORT = 3000;
const DEFAULT_MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const DEFAULT_LIBREOFFICE_TIMEOUT_MS = 60_000;
const DEFAULT_GHOSTSCRIPT_TIMEOUT_MS = 60_000;

function readNodeEnv(): NodeEnv {
  const raw = process.env.NODE_ENV;
  if (!raw) return "development";
  if ((NODE_ENVS as readonly string[]).includes(raw)) return raw as NodeEnv;
  throw new Error(
    `Invalid NODE_ENV "${raw}". Expected one of: ${NODE_ENVS.join(", ")}`,
  );
}

function readLogLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL;
  if (!raw) return "info";
  if ((LOG_LEVELS as readonly string[]).includes(raw)) return raw as LogLevel;
  throw new Error(
    `Invalid LOG_LEVEL "${raw}". Expected one of: ${LOG_LEVELS.join(", ")}`,
  );
}

function readPositiveInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} "${raw}". Expected a positive integer.`);
  }
  return parsed;
}

const nodeEnv = readNodeEnv();

export const env = {
  nodeEnv,
  port: readPositiveInt("PORT", DEFAULT_PORT),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  logLevel: readLogLevel(),
  maxUploadBytes: readPositiveInt("MAX_UPLOAD_BYTES", DEFAULT_MAX_UPLOAD_BYTES),
  libreofficeBinPath: process.env.LIBREOFFICE_BIN_PATH,
  libreofficeTimeoutMs: readPositiveInt(
    "LIBREOFFICE_TIMEOUT_MS",
    DEFAULT_LIBREOFFICE_TIMEOUT_MS,
  ),
  ghostscriptBinPath: process.env.GHOSTSCRIPT_BIN_PATH,
  ghostscriptTimeoutMs: readPositiveInt(
    "GHOSTSCRIPT_TIMEOUT_MS",
    DEFAULT_GHOSTSCRIPT_TIMEOUT_MS,
  ),
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
};
