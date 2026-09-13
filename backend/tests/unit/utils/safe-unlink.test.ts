import { promises as fs } from "fs";

jest.mock("fs", () => ({
  promises: { unlink: jest.fn() },
}));

jest.mock("../../../src/config/logger", () => ({
  logger: { warn: jest.fn() },
}));

import { logger } from "../../../src/config/logger";
import { safeUnlink } from "../../../src/utils/safe-unlink";

const mockedUnlink = jest.mocked(fs.unlink);
const mockedLoggerWarn = jest.mocked(logger.warn);

describe("safeUnlink", () => {
  beforeEach(() => {
    mockedUnlink.mockReset();
    mockedLoggerWarn.mockReset();
  });

  it("deletes the file without logging anything on success", async () => {
    mockedUnlink.mockResolvedValue(undefined);

    await safeUnlink("/tmp/some-file.txt");

    expect(mockedUnlink).toHaveBeenCalledWith("/tmp/some-file.txt");
    expect(mockedLoggerWarn).not.toHaveBeenCalled();
  });

  it("silently ignores a file that's already gone (ENOENT)", async () => {
    const enoent = Object.assign(new Error("no such file"), {
      code: "ENOENT",
    });
    mockedUnlink.mockRejectedValue(enoent);

    await expect(safeUnlink("/tmp/missing.txt")).resolves.toBeUndefined();
    expect(mockedLoggerWarn).not.toHaveBeenCalled();
  });

  it("logs a warning for any other deletion failure", async () => {
    const permissionError = Object.assign(new Error("permission denied"), {
      code: "EACCES",
    });
    mockedUnlink.mockRejectedValue(permissionError);

    await expect(safeUnlink("/tmp/locked.txt")).resolves.toBeUndefined();

    expect(mockedLoggerWarn).toHaveBeenCalledWith(
      { err: permissionError, filePath: "/tmp/locked.txt" },
      "Failed to clean up temporary file",
    );
  });
});
