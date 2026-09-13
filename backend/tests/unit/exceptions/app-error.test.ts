import { AppError } from "../../../src/exceptions/app-error";

describe("AppError", () => {
  it("defaults isOperational to true and details to undefined", () => {
    const err = new AppError("Something went wrong", 500);

    expect(err.message).toBe("Something went wrong");
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
    expect(err.details).toBeUndefined();
  });

  it("accepts an explicit isOperational value and details payload", () => {
    const details = { field: "quality" };
    const err = new AppError("Programmer error", 500, false, details);

    expect(err.isOperational).toBe(false);
    expect(err.details).toBe(details);
  });

  it("is a real Error with a stack trace and the correct prototype chain", () => {
    const err = new AppError("Broken", 500);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
    expect(typeof err.stack).toBe("string");
  });
});
