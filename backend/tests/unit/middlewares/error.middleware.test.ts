import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../../src/exceptions/app-error";
import { BadRequestException } from "../../../src/exceptions/http-exceptions";

jest.mock("../../../src/config/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn() },
}));

const mockEnv: { isProduction: boolean } = { isProduction: false };
jest.mock("../../../src/config/env", () => ({
  get env() {
    return mockEnv;
  },
}));

import { logger } from "../../../src/config/logger";
import { errorMiddleware } from "../../../src/middlewares/error.middleware";

const mockedLoggerError = jest.mocked(logger.error);
const mockedLoggerWarn = jest.mocked(logger.warn);

function createMockRequest(): Request {
  return { originalUrl: "/api/v1/convert/dummy", method: "POST" } as Request;
}

function createMockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const noopNext: NextFunction = jest.fn();

describe("errorMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv.isProduction = false;
  });

  it("responds with 500 and a generic message for a non-AppError", () => {
    const err = new Error("boom");
    const req = createMockRequest();
    const res = createMockResponse();

    errorMiddleware(err, req, res, noopNext);

    expect(mockedLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        err,
        path: "/api/v1/convert/dummy",
        method: "POST",
      }),
      "Internal server error",
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "error",
        message: "Internal server error",
      }),
    );
  });

  it("responds with the AppError's own status and message, logged at warn level", () => {
    const err = new BadRequestException("Bad input");
    const res = createMockResponse();

    errorMiddleware(err, createMockRequest(), res, noopNext);

    expect(mockedLoggerWarn).toHaveBeenCalledWith(
      expect.any(Object),
      "Bad input",
    );
    expect(mockedLoggerError).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error", message: "Bad input" }),
    );
  });

  it("logs at error level for an AppError with a 5xx status", () => {
    const err = new AppError("Downstream exploded", 502);

    errorMiddleware(err, createMockRequest(), createMockResponse(), noopNext);

    expect(mockedLoggerError).toHaveBeenCalled();
    expect(mockedLoggerWarn).not.toHaveBeenCalled();
  });

  it("includes details in the response body when the AppError carries them", () => {
    const err = new BadRequestException("Bad input", { field: "quality" });
    const res = createMockResponse();

    errorMiddleware(err, createMockRequest(), res, noopNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ details: { field: "quality" } }),
    );
  });

  it("omits details when the AppError doesn't carry any", () => {
    const err = new BadRequestException("Bad input");
    const res = createMockResponse();

    errorMiddleware(err, createMockRequest(), res, noopNext);

    const body = jest.mocked(res.json).mock.calls[0][0] as {
      details?: unknown;
    };
    expect(body.details).toBeUndefined();
  });

  it("omits the stack trace in production", () => {
    mockEnv.isProduction = true;
    const res = createMockResponse();

    errorMiddleware(new Error("boom"), createMockRequest(), res, noopNext);

    const body = jest.mocked(res.json).mock.calls[0][0] as {
      stack?: string;
    };
    expect(body.stack).toBeUndefined();
  });

  it("includes the stack trace outside production", () => {
    mockEnv.isProduction = false;
    const res = createMockResponse();

    errorMiddleware(new Error("boom"), createMockRequest(), res, noopNext);

    const body = jest.mocked(res.json).mock.calls[0][0] as {
      stack?: string;
    };
    expect(typeof body.stack).toBe("string");
  });
});
