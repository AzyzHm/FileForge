/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("pino", () => jest.fn(() => ({})));

describe("config/logger", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("omits the pino-pretty transport in production", () => {
    process.env.NODE_ENV = "production";

    require("../../../src/config/logger");
    const pino = require("pino") as jest.Mock;

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({ transport: undefined }),
    );
  });

  it("omits the pino-pretty transport in test", () => {
    process.env.NODE_ENV = "test";

    require("../../../src/config/logger");
    const pino = require("pino") as jest.Mock;

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({ transport: undefined }),
    );
  });

  it("uses the pino-pretty transport in development", () => {
    process.env.NODE_ENV = "development";

    require("../../../src/config/logger");
    const pino = require("pino") as jest.Mock;

    expect(pino).toHaveBeenCalledWith(
      expect.objectContaining({
        transport: expect.objectContaining({
          target: "pino-pretty",
          options: expect.objectContaining({ colorize: true }),
        }),
      }),
    );
  });
});
