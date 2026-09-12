import request from "supertest";
import { createApp } from "../../src/app";

describe("GET /health", () => {
  it("returns 200 with an ok status", async () => {
    const app = createApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});

describe("CORS configuration", () => {
  it("exposes the Content-Disposition header to cross-origin clients", async () => {
    const app = createApp();

    const response = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-expose-headers"]).toContain(
      "Content-Disposition",
    );
  });
});

describe("unknown routes", () => {
  it("returns a 404 with a structured error body", async () => {
    const app = createApp();

    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: "error",
        message: expect.stringContaining("not found"),
      }),
    );
  });
});
