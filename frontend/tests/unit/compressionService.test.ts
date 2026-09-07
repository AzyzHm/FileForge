import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const compressionMock = vi.fn();

vi.mock("browser-image-compression", () => ({
  default: (...args: unknown[]) => compressionMock(...args),
}));

import {
  buildCompressedFileName,
  compressImage,
  isCompressibleImage,
} from "../../src/services/compressionService";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

describe("isCompressibleImage", () => {
  it("accepts PNG and JPG by MIME type", () => {
    expect(isCompressibleImage(makeFile("a.png", "image/png"))).toBe(true);
    expect(isCompressibleImage(makeFile("a.jpg", "image/jpeg"))).toBe(true);
    expect(isCompressibleImage(makeFile("a.jpg", "image/jpg"))).toBe(true);
  });

  it("falls back to the file extension when the MIME type is missing", () => {
    expect(isCompressibleImage(makeFile("photo.PNG", ""))).toBe(true);
    expect(isCompressibleImage(makeFile("photo.jpeg", ""))).toBe(true);
  });

  it("rejects unsupported types, including SVG", () => {
    expect(isCompressibleImage(makeFile("icon.svg", "image/svg+xml"))).toBe(
      false,
    );
    expect(isCompressibleImage(makeFile("doc.pdf", "application/pdf"))).toBe(
      false,
    );
  });
});

describe("buildCompressedFileName", () => {
  it("inserts a -compressed suffix before the extension", () => {
    expect(buildCompressedFileName("photo.png")).toBe("photo-compressed.png");
    expect(buildCompressedFileName("holiday.jpeg")).toBe(
      "holiday-compressed.jpeg",
    );
  });

  it("handles file names without an extension", () => {
    expect(buildCompressedFileName("photo")).toBe("photo-compressed");
  });
});

describe("compressImage", () => {
  beforeEach(() => {
    compressionMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects files that are not PNG or JPG without calling the library", async () => {
    await expect(
      compressImage(makeFile("icon.svg", "image/svg+xml"), "balanced"),
    ).rejects.toThrow(/not a supported image type/i);
    expect(compressionMock).not.toHaveBeenCalled();
  });

  it("delegates to browser-image-compression with level-specific options", async () => {
    const file = makeFile("photo.png", "image/png");
    const compressed = makeFile("photo.png", "image/png", "smaller");
    compressionMock.mockResolvedValue(compressed);

    const result = await compressImage(file, "aggressive");

    expect(result).toBe(compressed);
    expect(compressionMock).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ maxSizeMB: 0.3 }),
    );
  });

  it("wraps library failures in a friendly error", async () => {
    compressionMock.mockRejectedValue(new Error("boom"));

    await expect(
      compressImage(makeFile("photo.jpg", "image/jpeg"), "light"),
    ).rejects.toThrow(/could not be compressed/i);
  });
});
