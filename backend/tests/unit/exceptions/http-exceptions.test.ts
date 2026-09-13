import { AppError } from "../../../src/exceptions/app-error";
import {
  BadRequestException,
  GatewayTimeoutException,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from "../../../src/exceptions/http-exceptions";

describe("http-exceptions", () => {
  it.each([
    [BadRequestException, 400, "Bad request"],
    [NotFoundException, 404, "Resource not found"],
    [PayloadTooLargeException, 413, "Payload too large"],
    [UnsupportedMediaTypeException, 415, "Unsupported media type"],
    [UnprocessableEntityException, 422, "Unprocessable entity"],
    [ServiceUnavailableException, 503, "Service unavailable"],
    [GatewayTimeoutException, 504, "Gateway timeout"],
  ] as const)(
    "%p uses status %d and a default message when none is given",
    (ExceptionClass, statusCode, defaultMessage) => {
      const err = new ExceptionClass();

      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(statusCode);
      expect(err.message).toBe(defaultMessage);
      expect(err.isOperational).toBe(true);
      expect(err.details).toBeUndefined();
    },
  );

  it.each([
    [BadRequestException, 400],
    [NotFoundException, 404],
    [PayloadTooLargeException, 413],
    [UnsupportedMediaTypeException, 415],
    [UnprocessableEntityException, 422],
    [ServiceUnavailableException, 503],
    [GatewayTimeoutException, 504],
  ] as const)(
    "%p accepts a custom message and details payload",
    (ExceptionClass, statusCode) => {
      const details = { reason: "test" };
      const err = new ExceptionClass("Custom message", details);

      expect(err.statusCode).toBe(statusCode);
      expect(err.message).toBe("Custom message");
      expect(err.details).toBe(details);
    },
  );
});
