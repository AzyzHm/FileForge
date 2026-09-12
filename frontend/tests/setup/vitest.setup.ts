import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { server } from "./mswServer";

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
