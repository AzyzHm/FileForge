import type { NextFunction, Request, Response } from "express";
import { BadRequestException } from "../../../src/exceptions/http-exceptions";

jest.mock("../../../src/services/convert.service", () => ({
  dummyConvert: jest.fn(),
  convertWordToPdf: jest.fn(),
  convertPdfToWord: jest.fn(),
  compressPdf: jest.fn(),
}));

jest.mock("../../../src/services/queue.service", () => ({
  enqueueConversion: jest.fn((task: () => Promise<unknown>) => task()),
}));

jest.mock("../../../src/utils/safe-unlink", () => ({
  safeUnlink: jest.fn().mockResolvedValue(undefined),
}));

import { dummyConvert } from "../../../src/services/convert.service";
import { safeUnlink } from "../../../src/utils/safe-unlink";
import { ConvertController } from "../../../src/api/v1/controllers/convert.controller";

const mockedDummyConvert = jest.mocked(dummyConvert);
const mockedSafeUnlink = jest.mocked(safeUnlink);

function createMockRequest(file?: Express.Multer.File): Request {
  return { file, body: {} } as unknown as Request;
}

function createMockResponse(): Response & { download: jest.Mock } {
  const res = {} as Response & { download: jest.Mock };
  res.download = jest.fn();
  Object.defineProperty(res, "headersSent", {
    value: false,
    writable: true,
  });
  return res;
}

describe("ConvertController", () => {
  let controller: ConvertController;
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new ConvertController();
  });

  it("rejects with a 400 when no file is attached", async () => {
    const req = createMockRequest(undefined);
    const res = createMockResponse();

    await controller.dummy(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(BadRequestException));
    expect(mockedDummyConvert).not.toHaveBeenCalled();
  });

  it("streams the converted file and cleans up both temp files on success", async () => {
    const file = {
      path: "/tmp/input.txt",
      originalname: "input.txt",
    } as Express.Multer.File;
    const req = createMockRequest(file);
    const res = createMockResponse();

    mockedDummyConvert.mockResolvedValue({
      outputPath: "/tmp/output.txt",
      outputFilename: "output.txt",
      inputBytes: 10,
      outputBytes: 20,
    });
    res.download.mockImplementation((_path, _filename, callback) => {
      callback(undefined);
    });

    await controller.dummy(req, res, next);

    expect(mockedSafeUnlink).toHaveBeenCalledWith("/tmp/input.txt");
    expect(mockedSafeUnlink).toHaveBeenCalledWith("/tmp/output.txt");
    expect(next).not.toHaveBeenCalled();
  });

  it("cleans up the input file and forwards the error when conversion throws", async () => {
    const file = {
      path: "/tmp/input.txt",
      originalname: "input.txt",
    } as Express.Multer.File;
    const req = createMockRequest(file);
    const res = createMockResponse();

    const conversionError = new Error("conversion exploded");
    mockedDummyConvert.mockRejectedValue(conversionError);

    await controller.dummy(req, res, next);

    expect(mockedSafeUnlink).toHaveBeenCalledWith("/tmp/input.txt");
    expect(next).toHaveBeenCalledWith(conversionError);
  });

  it("forwards the error when res.download fails before headers are sent", async () => {
    const file = {
      path: "/tmp/input.txt",
      originalname: "input.txt",
    } as Express.Multer.File;
    const req = createMockRequest(file);
    const res = createMockResponse();

    mockedDummyConvert.mockResolvedValue({
      outputPath: "/tmp/output.txt",
      outputFilename: "output.txt",
      inputBytes: 10,
      outputBytes: 20,
    });
    const downloadError = new Error("stream interrupted");
    res.download.mockImplementation((_path, _filename, callback) => {
      callback(downloadError);
    });

    await controller.dummy(req, res, next);

    expect(next).toHaveBeenCalledWith(downloadError);
  });

  it("does not forward the error when res.download fails after headers were already sent", async () => {
    const file = {
      path: "/tmp/input.txt",
      originalname: "input.txt",
    } as Express.Multer.File;
    const req = createMockRequest(file);
    const res = createMockResponse();

    mockedDummyConvert.mockResolvedValue({
      outputPath: "/tmp/output.txt",
      outputFilename: "output.txt",
      inputBytes: 10,
      outputBytes: 20,
    });
    res.download.mockImplementation((_path, _filename, callback) => {
      Object.defineProperty(res, "headersSent", { value: true });
      callback(new Error("stream interrupted after headers sent"));
    });

    await controller.dummy(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });
});
