import { AppError } from "./app-error";

export class BadRequestException extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, true, details);
  }
}

export class NotFoundException extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, true, details);
  }
}

export class PayloadTooLargeException extends AppError {
  constructor(message = "Payload too large", details?: unknown) {
    super(message, 413, true, details);
  }
}

export class UnsupportedMediaTypeException extends AppError {
  constructor(message = "Unsupported media type", details?: unknown) {
    super(message, 415, true, details);
  }
}
