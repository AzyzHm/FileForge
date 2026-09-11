import { execFile } from "child_process";
import {
  GatewayTimeoutException,
  ServiceUnavailableException,
} from "../../../src/exceptions/http-exceptions";

jest.mock("child_process", () => ({
  execFile: jest.fn(),
}));

const mockedExecFile = jest.mocked(execFile);

const mockEnv: { ghostscriptBinPath?: string; ghostscriptTimeoutMs: number } = {
  ghostscriptBinPath: undefined,
  ghostscriptTimeoutMs: 60_000,
};

jest.mock("../../../src/config/env", () => ({
  get env() {
    return mockEnv;
  },
}));

const originalPlatform = process.platform;

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, "platform", {
    value: platform,
    configurable: true,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function invokeCallback(err: unknown): (...args: any[]) => void {
  return (...args: unknown[]) => {
    const callback = args[args.length - 1] as (error: unknown) => void;
    callback(err);
  };
}

import { compressWithGhostscript } from "../../../src/services/ghostscript.service";

describe("ghostscript.service compressWithGhostscript", () => {
  beforeEach(() => {
    mockedExecFile.mockReset();
    mockEnv.ghostscriptBinPath = undefined;
    mockEnv.ghostscriptTimeoutMs = 60_000;
    setPlatform("linux");
  });

  afterAll(() => {
    setPlatform(originalPlatform);
  });

  it("resolves when the underlying gs process succeeds", async () => {
    mockedExecFile.mockImplementation(invokeCallback(null) as never);

    await expect(
      compressWithGhostscript({
        inputPath: "/tmp/in.pdf",
        outputPath: "/tmp/out.pdf",
        quality: "ebook",
      }),
    ).resolves.toBeUndefined();
  });

  it("invokes gs with the pdfwrite device, safer sandboxing, and requested quality", async () => {
    mockedExecFile.mockImplementation(invokeCallback(null) as never);

    await compressWithGhostscript({
      inputPath: "/tmp/in.pdf",
      outputPath: "/tmp/out.pdf",
      quality: "printer",
    });

    expect(mockedExecFile).toHaveBeenCalledWith(
      "gs",
      expect.arrayContaining([
        "-dSAFER",
        "-sDEVICE=pdfwrite",
        "-dPDFSETTINGS=/printer",
        "-sOutputFile=/tmp/out.pdf",
        "/tmp/in.pdf",
      ]),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("uses a configured GHOSTSCRIPT_BIN_PATH instead of the default binary name", async () => {
    mockEnv.ghostscriptBinPath = "/custom/path/to/gs";
    mockedExecFile.mockImplementation(invokeCallback(null) as never);

    await compressWithGhostscript({
      inputPath: "/tmp/in.pdf",
      outputPath: "/tmp/out.pdf",
      quality: "ebook",
    });

    expect(mockedExecFile).toHaveBeenCalledWith(
      "/custom/path/to/gs",
      expect.any(Array),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("tries gswin64c then falls back to gswin32c on Windows when unconfigured", async () => {
    setPlatform("win32");

    mockedExecFile.mockImplementation(((
      binary: string,
      _args: string[],
      _options: unknown,
      callback: (error: unknown) => void,
    ) => {
      if (binary === "gswin64c") {
        callback(Object.assign(new Error("not found"), { code: "ENOENT" }));
      } else {
        callback(null);
      }
    }) as never);

    await compressWithGhostscript({
      inputPath: "/tmp/in.pdf",
      outputPath: "/tmp/out.pdf",
      quality: "ebook",
    });

    expect(mockedExecFile).toHaveBeenNthCalledWith(
      1,
      "gswin64c",
      expect.any(Array),
      expect.any(Object),
      expect.any(Function),
    );
    expect(mockedExecFile).toHaveBeenNthCalledWith(
      2,
      "gswin32c",
      expect.any(Array),
      expect.any(Object),
      expect.any(Function),
    );
  });

  it("maps a missing gs binary error to ServiceUnavailableException", async () => {
    mockedExecFile.mockImplementation(
      invokeCallback(
        Object.assign(new Error("spawn gs ENOENT"), { code: "ENOENT" }),
      ) as never,
    );

    await expect(
      compressWithGhostscript({
        inputPath: "/tmp/in.pdf",
        outputPath: "/tmp/out.pdf",
        quality: "ebook",
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("maps a killed/timed-out conversion to GatewayTimeoutException", async () => {
    mockedExecFile.mockImplementation(
      invokeCallback(
        Object.assign(new Error("Command failed"), {
          killed: true,
          signal: "SIGTERM",
        }),
      ) as never,
    );

    await expect(
      compressWithGhostscript({
        inputPath: "/tmp/in.pdf",
        outputPath: "/tmp/out.pdf",
        quality: "ebook",
        timeoutMs: 5000,
      }),
    ).rejects.toBeInstanceOf(GatewayTimeoutException);
  });

  it("rethrows unrecognized errors, such as a non-zero exit from a corrupt PDF, unchanged", async () => {
    const unexpected = Object.assign(new Error("Command failed"), {
      code: 1,
      killed: false,
    });
    mockedExecFile.mockImplementation(invokeCallback(unexpected) as never);

    await expect(
      compressWithGhostscript({
        inputPath: "/tmp/in.pdf",
        outputPath: "/tmp/out.pdf",
        quality: "ebook",
      }),
    ).rejects.toThrow("Command failed");
  });
});
