/* eslint-disable @typescript-eslint/no-require-imports */
type EnvModule = typeof import("../../../src/config/env");

describe("config/env", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("throws for an invalid NODE_ENV", () => {
    process.env.NODE_ENV = "staging";

    expect(() => require("../../../src/config/env")).toThrow(
      /Invalid NODE_ENV "staging"/,
    );
  });

  it("throws for an invalid LOG_LEVEL", () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "verbose";

    expect(() => require("../../../src/config/env")).toThrow(
      /Invalid LOG_LEVEL "verbose"/,
    );
  });

  it.each([
    "PORT",
    "MAX_UPLOAD_BYTES",
    "LIBREOFFICE_TIMEOUT_MS",
    "GHOSTSCRIPT_TIMEOUT_MS",
  ])("throws for a non-numeric %s", (varName) => {
    process.env.NODE_ENV = "test";
    process.env[varName] = "not-a-number";

    expect(() => require("../../../src/config/env")).toThrow(
      new RegExp(`Invalid ${varName} "not-a-number"`),
    );
  });

  it("throws for a zero or negative PORT", () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "0";

    expect(() => require("../../../src/config/env")).toThrow(
      /Invalid PORT "0"/,
    );
  });

  it("falls back to sensible defaults when optional vars are unset", () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.CORS_ORIGIN;
    delete process.env.MAX_UPLOAD_BYTES;
    delete process.env.LIBREOFFICE_TIMEOUT_MS;
    delete process.env.GHOSTSCRIPT_TIMEOUT_MS;

    const { env } = require("../../../src/config/env") as EnvModule;

    expect(env.nodeEnv).toBe("development");
    expect(env.port).toBe(3000);
    expect(env.logLevel).toBe("info");
    expect(env.corsOrigin).toBe("http://localhost:5173/");
    expect(env.maxUploadBytes).toBe(50 * 1024 * 1024);
    expect(env.libreofficeTimeoutMs).toBe(60_000);
    expect(env.ghostscriptTimeoutMs).toBe(60_000);
    expect(env.isProduction).toBe(false);
    expect(env.isTest).toBe(false);
  });

  it("derives isProduction from NODE_ENV=production", () => {
    process.env.NODE_ENV = "production";

    const { env } = require("../../../src/config/env") as EnvModule;

    expect(env.isProduction).toBe(true);
    expect(env.isTest).toBe(false);
  });

  it("derives isTest from NODE_ENV=test", () => {
    process.env.NODE_ENV = "test";

    const { env } = require("../../../src/config/env") as EnvModule;

    expect(env.isTest).toBe(true);
    expect(env.isProduction).toBe(false);
  });

  it("passes configured binary paths through unchanged", () => {
    process.env.NODE_ENV = "test";
    process.env.LIBREOFFICE_BIN_PATH = "/opt/libreoffice/soffice";
    process.env.GHOSTSCRIPT_BIN_PATH = "/opt/gs/bin/gs";

    const { env } = require("../../../src/config/env") as EnvModule;

    expect(env.libreofficeBinPath).toBe("/opt/libreoffice/soffice");
    expect(env.ghostscriptBinPath).toBe("/opt/gs/bin/gs");
  });
});
