import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const removeBackgroundMock = vi.fn();

vi.mock("@imgly/background-removal", () => ({
  removeBackground: (...args: unknown[]) => removeBackgroundMock(...args),
}));

import {
  buildTransparentFileName,
  isRemovableImage,
  removeImageBackground,
} from "../../src/services/backgroundRemovalService";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

describe("isRemovableImage", () => {
  it("accepts PNG, JPG, and WEBP by MIME type", () => {
    expect(isRemovableImage(makeFile("a.png", "image/png"))).toBe(true);
    expect(isRemovableImage(makeFile("a.jpg", "image/jpeg"))).toBe(true);
    expect(isRemovableImage(makeFile("a.jpg", "image/jpg"))).toBe(true);
    expect(isRemovableImage(makeFile("a.webp", "image/webp"))).toBe(true);
  });

  it("falls back to the file extension when the MIME type is missing", () => {
    expect(isRemovableImage(makeFile("photo.PNG", ""))).toBe(true);
    expect(isRemovableImage(makeFile("photo.WEBP", ""))).toBe(true);
  });

  it("rejects unsupported types, including SVG and PDF", () => {
    expect(isRemovableImage(makeFile("icon.svg", "image/svg+xml"))).toBe(false);
    expect(isRemovableImage(makeFile("doc.pdf", "application/pdf"))).toBe(
      false,
    );
  });
});

describe("buildTransparentFileName", () => {
  it("swaps the extension for .png with a -no-bg suffix", () => {
    expect(buildTransparentFileName("photo.jpg")).toBe("photo-no-bg.png");
    expect(buildTransparentFileName("holiday.webp")).toBe("holiday-no-bg.png");
  });

  it("handles file names without an extension", () => {
    expect(buildTransparentFileName("photo")).toBe("photo-no-bg.png");
  });
});

describe("removeImageBackground", () => {
  beforeEach(() => {
    removeBackgroundMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects files that are not PNG, JPG, or WEBP without calling the library", async () => {
    await expect(
      removeImageBackground(makeFile("icon.svg", "image/svg+xml")),
    ).rejects.toThrow(/not a supported image type/i);
    expect(removeBackgroundMock).not.toHaveBeenCalled();
  });

  it("returns a PNG file named with a -no-bg suffix", async () => {
    const file = makeFile("photo.jpg", "image/jpeg");
    removeBackgroundMock.mockResolvedValue(
      new Blob(["cutout"], { type: "image/png" }),
    );

    const result = await removeImageBackground(file);

    expect(result.name).toBe("photo-no-bg.png");
    expect(result.type).toBe("image/png");
    expect(removeBackgroundMock).toHaveBeenCalledWith(
      file,
      expect.objectContaining({ output: { format: "image/png" } }),
    );
  });

  it("reports progress as a percentage via the callback", async () => {
    removeBackgroundMock.mockImplementation(
      async (_file: File, config: { progress?: unknown }) => {
        const progress = config.progress as (
          key: string,
          current: number,
          total: number,
        ) => void;
        progress("fetch:model", 50, 100);
        return new Blob(["cutout"], { type: "image/png" });
      },
    );

    const onProgress = vi.fn();
    await removeImageBackground(makeFile("photo.png", "image/png"), onProgress);

    expect(onProgress).toHaveBeenCalledWith(50);
  });

  it("wraps library failures in a friendly error", async () => {
    removeBackgroundMock.mockRejectedValue(new Error("boom"));

    await expect(
      removeImageBackground(makeFile("photo.png", "image/png")),
    ).rejects.toThrow(/could not be processed/i);
  });
});
