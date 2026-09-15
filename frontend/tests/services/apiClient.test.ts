import "../setup/polyfills";
import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../setup/mswServer";
import {
  API_BASE_URL,
  ApiError,
  convertFileOnServer,
  withExtension,
} from "../../src/services/apiClient";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

function endpoint(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function jsonError(body: unknown, status: number): HttpResponse {
  return new HttpResponse(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("withExtension", () => {
  it("swaps an existing extension", () => {
    expect(withExtension("report.pdf", "docx")).toBe("report.docx");
  });

  it("adds an extension when there isn't one", () => {
    expect(withExtension("report", "pdf")).toBe("report.pdf");
  });

  it("handles filenames with multiple dots by using the last segment", () => {
    expect(withExtension("annual.report.v2.pdf", "docx")).toBe(
      "annual.report.v2.docx",
    );
  });
});

describe("API_BASE_URL", () => {
  it("defaults to localhost:3000 when no env override is set", () => {
    expect(API_BASE_URL).toBe("http://localhost:3000");
  });
});

describe("convertFileOnServer", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the response blob and the filename from Content-Disposition", async () => {
    server.use(
      http.post(endpoint("/api/v1/convert/pdf-to-word"), () => {
        return new HttpResponse(new Blob(["PK-stub"]), {
          status: 200,
          headers: {
            "Content-Disposition": 'attachment; filename="report.docx"',
          },
        });
      }),
    );

    const result = await convertFileOnServer({
      path: "/api/v1/convert/pdf-to-word",
      file: makeFile("report.pdf", "application/pdf"),
    });

    expect(result.filename).toBe("report.docx");
    expect(await result.blob.text()).toBe("PK-stub");
  });

  it("falls back to the original filename when no Content-Disposition is present", async () => {
    server.use(
      http.post(endpoint("/api/v1/convert/pdf-to-word"), () => {
        return new HttpResponse(new Blob(["PK-stub"]), { status: 200 });
      }),
    );

    const result = await convertFileOnServer({
      path: "/api/v1/convert/pdf-to-word",
      file: makeFile("report.pdf", "application/pdf"),
    });

    expect(result.filename).toBe("report.pdf");
  });

  it("uses a custom fallbackFilename when no Content-Disposition is present", async () => {
    server.use(
      http.post(endpoint("/api/v1/convert/pdf-to-word"), () => {
        return new HttpResponse(new Blob(["PK-stub"]), { status: 200 });
      }),
    );

    const result = await convertFileOnServer({
      path: "/api/v1/convert/pdf-to-word",
      file: makeFile("report.pdf", "application/pdf"),
      fallbackFilename: "report.docx",
    });

    expect(result.filename).toBe("report.docx");
  });

  it("sends extra fields alongside the file", async () => {
    let receivedQuality: string | null = null;

    server.use(
      http.post(
        endpoint("/api/v1/convert/compress-pdf"),
        async ({ request }) => {
          const formData = await request.formData();
          receivedQuality = formData.get("quality") as string | null;
          return new HttpResponse(new Blob(["%PDF-stub"]), { status: 200 });
        },
      ),
    );

    await convertFileOnServer({
      path: "/api/v1/convert/compress-pdf",
      file: makeFile("big.pdf", "application/pdf"),
      fields: { quality: "screen" },
    });

    expect(receivedQuality).toBe("screen");
  });

  it.each([
    [400, "The quality option was invalid"],
    [413, undefined],
    [415, undefined],
    [503, undefined],
    [504, undefined],
  ])(
    "maps a %i response into a friendly ApiError",
    async (status, serverMessage) => {
      server.use(
        http.post(endpoint("/api/v1/convert/pdf-to-word"), () => {
          return jsonError(
            { status: "error", message: serverMessage ?? "server error" },
            status,
          );
        }),
      );

      const promise = convertFileOnServer({
        path: "/api/v1/convert/pdf-to-word",
        file: makeFile("report.pdf", "application/pdf"),
      });

      await expect(promise).rejects.toBeInstanceOf(ApiError);
      await expect(promise).rejects.toMatchObject({ status });

      if (serverMessage) {
        await expect(promise).rejects.toThrow(serverMessage);
      }
    },
  );

  it("raises a connection-level ApiError when the server is unreachable", async () => {
    server.use(
      http.post(endpoint("/api/v1/convert/pdf-to-word"), () => {
        return HttpResponse.error();
      }),
    );

    const promise = convertFileOnServer({
      path: "/api/v1/convert/pdf-to-word",
      file: makeFile("report.pdf", "application/pdf"),
    });

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 0 });
    await expect(promise).rejects.toThrow(/could not reach/i);
  });
});
