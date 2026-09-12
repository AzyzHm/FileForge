import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const convertFileOnServerMock = vi.fn();

vi.mock("../../src/services/apiClient", () => ({
  convertFileOnServer: (...args: unknown[]) => convertFileOnServerMock(...args),
}));

import { compressPdfOnServer } from "../../src/services/pdfCompressionService";

function makeFile(name: string, type: string, content = "stub"): File {
  return new File([content], name, { type });
}

describe("compressPdfOnServer", () => {
  beforeEach(() => {
    convertFileOnServerMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects files that are not .pdf without calling the server", async () => {
    await expect(
      compressPdfOnServer(
        makeFile("report.docx", "application/msword"),
        "ebook",
      ),
    ).rejects.toThrow(/not a \.pdf file/i);
    expect(convertFileOnServerMock).not.toHaveBeenCalled();
  });

  it("posts the file and quality to the compress-pdf endpoint", async () => {
    const blob = new Blob(["%PDF-smaller"]);
    convertFileOnServerMock.mockResolvedValue({
      blob,
      filename: "report.pdf",
    });

    const file = makeFile("report.pdf", "application/pdf");
    const result = await compressPdfOnServer(file, "screen");

    expect(result).toEqual({ blob, filename: "report.pdf" });
    expect(convertFileOnServerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/api/v1/convert/compress-pdf",
        file,
        fields: { quality: "screen" },
      }),
    );
  });

  it("propagates server errors", async () => {
    convertFileOnServerMock.mockRejectedValue(
      new Error("The conversion service is temporarily unavailable."),
    );

    await expect(
      compressPdfOnServer(makeFile("report.pdf", "application/pdf"), "ebook"),
    ).rejects.toThrow(/temporarily unavailable/i);
  });
});
