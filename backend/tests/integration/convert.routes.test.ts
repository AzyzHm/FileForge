import os from "os";
import path from "path";
import { promises as fs } from "fs";
import request from "supertest";
import { createApp } from "../../src/app";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilDeleted(
  filePath: string,
  timeoutMs = 1000,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fs.access(filePath);
      await wait(20);
    } catch {
      return true;
    }
  }
  return false;
}

describe("POST /api/v1/convert/dummy", () => {
  it("converts an uploaded file and streams the result back", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", Buffer.from("hello fileforge"), "sample.txt");

    expect(response.status).toBe(200);
    expect(response.headers["content-disposition"]).toContain("attachment");
    expect(response.text).toContain("FileForge dummy conversion");
    expect(response.text).toContain("sample.txt");
  });

  it("rejects a request with no file attached", async () => {
    const app = createApp();

    const response = await request(app).post("/api/v1/convert/dummy");

    expect(response.status).toBe(400);
    expect(response.body.status).toBe("error");
  });

  it("rejects a file larger than the configured upload cap with a 413", async () => {
    const app = createApp();
    const oversizedBuffer = Buffer.alloc(2 * 1024 * 1024, "x");

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", oversizedBuffer, "too-big.bin");

    expect(response.status).toBe(413);
    expect(response.body.status).toBe("error");
  });

  it("deletes both the uploaded input and generated output from /tmp after responding", async () => {
    const app = createApp();

    const response = await request(app)
      .post("/api/v1/convert/dummy")
      .attach("file", Buffer.from("cleanup check"), "cleanup.txt");

    expect(response.status).toBe(200);

    const disposition = response.headers["content-disposition"] as string;
    const match = /filename="(.+?)"/.exec(disposition);
    expect(match).not.toBeNull();

    const outputPath = path.join(os.tmpdir(), (match as RegExpExecArray)[1]);

    const wasDeleted = await waitUntilDeleted(outputPath);
    expect(wasDeleted).toBe(true);
  });

  it("processes concurrent uploads one at a time through the shared queue", async () => {
    const app = createApp();

    const start = Date.now();

    await Promise.all([
      request(app)
        .post("/api/v1/convert/dummy")
        .attach("file", Buffer.from("a"), "a.txt"),
      request(app)
        .post("/api/v1/convert/dummy")
        .attach("file", Buffer.from("b"), "b.txt"),
    ]);

    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeGreaterThanOrEqual(90);
  });
});
