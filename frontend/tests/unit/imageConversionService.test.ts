import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildOutputFileName,
  convertImage,
  detectImageFormat,
} from "../../src/services/imageConversionService";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 100;
  naturalHeight = 50;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

describe("detectImageFormat", () => {
  it("detects png from MIME type", () => {
    expect(detectImageFormat(makeFile("a.png", "image/png"))).toBe("png");
  });

  it("detects jpeg from either image/jpeg or image/jpg", () => {
    expect(detectImageFormat(makeFile("a.jpg", "image/jpeg"))).toBe("jpeg");
    expect(detectImageFormat(makeFile("a.jpg", "image/jpg"))).toBe("jpeg");
  });

  it("detects svg from MIME type", () => {
    expect(detectImageFormat(makeFile("a.svg", "image/svg+xml"))).toBe("svg");
  });

  it("falls back to the file extension when the MIME type is missing", () => {
    expect(detectImageFormat(makeFile("photo.PNG", ""))).toBe("png");
    expect(detectImageFormat(makeFile("photo.jpeg", ""))).toBe("jpeg");
    expect(detectImageFormat(makeFile("icon.svg", ""))).toBe("svg");
  });

  it("returns null for unsupported types", () => {
    expect(
      detectImageFormat(makeFile("doc.pdf", "application/pdf")),
    ).toBeNull();
  });
});

describe("buildOutputFileName", () => {
  it("swaps the extension for the target format", () => {
    expect(buildOutputFileName("photo.png", "jpeg")).toBe("photo.jpg");
    expect(buildOutputFileName("photo.jpg", "svg")).toBe("photo.svg");
    expect(buildOutputFileName("icon.svg", "png")).toBe("icon.png");
  });

  it("handles file names without an extension", () => {
    expect(buildOutputFileName("photo", "png")).toBe("photo.png");
  });
});

describe("convertImage", () => {
  beforeEach(() => {
    vi.stubGlobal("Image", FakeImage);
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects files that are not PNG, JPG, or SVG", async () => {
    const file = makeFile("doc.pdf", "application/pdf");
    await expect(convertImage(file, "png")).rejects.toThrow(
      /not a supported image type/,
    );
  });

  it("rasterizes to a PNG blob via the canvas", async () => {
    const fakeBlob = new Blob(["pixels"], { type: "image/png" });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => {
        callback(fakeBlob);
      },
    );

    const file = makeFile("photo.jpg", "image/jpeg");
    const result = await convertImage(file, "png");

    expect(result.type).toBe("image/png");
  });

  it("fills a white background before drawing when converting to JPEG", async () => {
    const fillRect = vi.fn();
    const drawImage = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      fillRect,
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => {
        callback(new Blob(["pixels"], { type: "image/jpeg" }));
      },
    );

    const file = makeFile("photo.png", "image/png");
    await convertImage(file, "jpeg");

    expect(fillRect).toHaveBeenCalled();
    expect(drawImage).toHaveBeenCalled();
    expect(fillRect.mock.invocationCallOrder[0]).toBeLessThan(
      drawImage.mock.invocationCallOrder[0],
    );
  });

  it("wraps a raster image in an SVG document for SVG output", async () => {
    const file = makeFile("photo.png", "image/png", "binary-data");
    const result = await convertImage(file, "svg");

    expect(result.type).toBe("image/svg+xml");
    const text = await result.text();
    expect(text).toContain("<svg");
    expect(text).toContain("<image");
  });

  it("passes an SVG source straight through when the target is also SVG", async () => {
    const file = makeFile("icon.svg", "image/svg+xml", "<svg></svg>");
    const result = await convertImage(file, "svg");

    expect(result.type).toBe("image/svg+xml");
    expect(await result.text()).toBe("<svg></svg>");
  });

  it("surfaces a helpful error when the canvas cannot produce image data", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) => {
        callback(null);
      },
    );

    const file = makeFile("photo.png", "image/png");
    await expect(convertImage(file, "jpeg")).rejects.toThrow(
      /could not produce image data/,
    );
  });
});
